import { NextResponse } from "next/server";
import { ImapFlow } from "imapflow";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SUPPORTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];

async function parseDocument(base64: string, mediaType: string) {
  const isPdf = mediaType === "application/pdf";
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          isPdf
            ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
            : { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp", data: base64 } },
          {
            type: "text",
            text: `You are a medical document parser. Extract all clinically relevant information from this document.

Return a JSON object with these fields:
{
  "summary": "one sentence describing what this document is",
  "date": "date of the test/consultation if found, or null",
  "conditions": ["list of diagnoses or conditions mentioned"],
  "test_results": [{"name": "test name", "value": "result value", "unit": "unit if present", "flag": "high/low/normal if indicated"}],
  "medications": ["list of medications mentioned"],
  "notes": "any other clinically relevant information"
}

Return only valid JSON, no explanation.`,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) parsed = JSON.parse(match[1]);
    else {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      else throw new Error("Could not parse Claude response");
    }
  }
  return parsed;
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    return NextResponse.json({ error: "Gmail credentials not configured" }, { status: 503 });
  }

  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    logger: false,
  });

  const processed: string[] = [];
  const errors: string[] = [];

  try {
    await client.connect();
    await client.mailboxOpen("[Gmail]/All Mail");

    // Get unseen emails from last 7 days, then filter subject in code
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const searchResult = await client.search({ seen: false, since });
    const allUids = (searchResult || []).slice(-50); // cap at 50 recent

    for (const uid of allUids) {
      try {
        const msg = await client.fetchOne(String(uid), { bodyStructure: true, envelope: true }, { uid: true });
        if (!msg) continue;

        const subject = msg.envelope?.subject || "";
        if (!subject.toLowerCase().includes("genitree")) continue;

        // Find attachment parts
        const parts = flattenParts(msg.bodyStructure);
        const attachments = parts.filter(
          (p) => SUPPORTED_TYPES.includes(`${p.type}/${p.subtype}`.toLowerCase()) && p.size > 0
        );

        if (attachments.length === 0) continue;

        for (const part of attachments) {
          try {
            const mediaType = `${part.type}/${part.subtype}`.toLowerCase();
            const { content } = await client.download(String(uid), part.part || "1", { uid: true });

            const chunks: Buffer[] = [];
            for await (const chunk of content) chunks.push(chunk);
            const base64 = Buffer.concat(chunks).toString("base64");

            const parsed = await parseDocument(base64, mediaType);

            const fromAddress = msg.envelope?.from?.[0]?.address || "unknown";

            const { error } = await supabase.from("test_results").insert({
              user_id: user.id,
              family_member_id: null,
              content: JSON.stringify({ ...parsed, source: `Email from ${fromAddress}: ${subject}` }),
            });

            if (!error) {
              processed.push(subject || "attachment");
            }

          } catch (e) {
            errors.push(e instanceof Error ? e.message : "Failed to process attachment");
          }
        }

        // Mark as read
        await client.messageFlagsAdd(uid, ["\\Seen"], { uid: true });
      } catch (e) {
        errors.push(e instanceof Error ? e.message : "Failed to process message");
      }
    }

    await client.logout();
  } catch (e) {
    const message = e instanceof Error ? e.message : "IMAP connection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ processed, errors, count: processed.length });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function flattenParts(structure: any, parts: any[] = []): any[] {
  if (!structure) return parts;
  if (structure.childNodes) {
    for (const child of structure.childNodes) flattenParts(child, parts);
  } else {
    parts.push(structure);
  }
  return parts;
}
