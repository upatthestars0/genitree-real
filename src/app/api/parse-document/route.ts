import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY." }, { status: 503 });
  }

  let body: { base64: string; mediaType: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { base64, mediaType } = body;
  if (!base64 || !mediaType) {
    return NextResponse.json({ error: "Missing file data." }, { status: 400 });
  }

  const isPdf = mediaType === "application/pdf";

  try {
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
      // Try extracting from markdown code block
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        try {
          parsed = JSON.parse(match[1]);
        } catch {
          return NextResponse.json({ error: `JSON parse failed. Claude returned: ${text.slice(0, 300)}` }, { status: 500 });
        }
      } else {
        // Try finding a raw JSON object in the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            parsed = JSON.parse(jsonMatch[0]);
          } catch {
            return NextResponse.json({ error: `Could not extract JSON. Claude returned: ${text.slice(0, 300)}` }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: `No JSON found. Claude returned: ${text.slice(0, 300)}` }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ data: parsed });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to parse document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
