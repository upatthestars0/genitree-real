import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(profile: Record<string, unknown> | null, familyMembers: Record<string, unknown>[], healthHistory: Record<string, unknown> | null): string {
  const name = profile?.name ?? "the user";
  const age = profile?.age ? `${profile.age} years old` : "unknown age";
  const sex = profile?.sex ?? "unknown sex";
  const lifestyle = profile?.lifestyle ?? "unknown lifestyle";

  const familySummary = familyMembers.length > 0
    ? familyMembers.map((m) => {
        const conditions = (m.condition_list as string[] | null)?.join(", ") || "no known conditions";
        const status = m.is_alive
          ? `age ${m.age ?? "unknown"}`
          : `deceased at age ${m.age_at_death ?? "unknown"}${m.cause_of_death ? `, cause: ${m.cause_of_death}` : ""}`;
        return `- ${m.relation} (${status}): ${conditions}`;
      }).join("\n")
    : "No family members recorded.";

  const ownConditions = (healthHistory?.current_conditions as string[] | null)?.join(", ") || "none";
  const medications = (healthHistory?.medications as string[] | null)?.join(", ") || "none";
  const allergies = (healthHistory?.allergies as string[] | null)?.join(", ") || "none";

  return `You are GeniTree, a personal health advisor who knows the user's full family health history. You reason like a knowledgeable clinician — drawing on evidence-based medical guidelines (similar to UpToDate or OpenEvidence) to give specific, contextual answers.

## About the user
- Name: ${name}
- Age: ${age}
- Biological sex: ${sex}
- Lifestyle: ${lifestyle}

## Their family history
${familySummary}

## Their personal health
- Current conditions: ${ownConditions}
- Medications: ${medications}
- Allergies: ${allergies}

## Your behaviour
- Always connect your answers to their specific family history when relevant
- Be direct and specific — not vague like "consult a doctor for everything"
- You can suggest tests, flag risks, and explain hereditary links
- End responses that touch on diagnosis or treatment with a one-line reminder to confirm with their GP
- Never fabricate data the user hasn't provided`;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Chat is not configured. Missing ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  let body: { message?: string; messages?: { role: string; content: string }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
  }

  // Fetch user context from Supabase
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = null;
  let familyMembers: Record<string, unknown>[] = [];
  let healthHistory = null;

  if (user) {
    const [profileRes, familyRes, historyRes] = await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase.from("family_members").select("*").eq("user_id", user.id),
      supabase.from("health_history").select("*").eq("user_id", user.id).single(),
    ]);
    profile = profileRes.data;
    familyMembers = familyRes.data ?? [];
    healthHistory = historyRes.data;
  }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages = [
    ...history
      .filter((m) => m.role && m.content)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    { role: "user", content: message },
  ] as Anthropic.MessageParam[];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: buildSystemPrompt(profile, familyMembers, healthHistory),
      messages,
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ text });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Network or server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
