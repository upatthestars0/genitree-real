import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function GET(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Missing ANTHROPIC_API_KEY." }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const [profileRes, familyRes, historyRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("family_members").select("*").eq("user_id", user.id),
    supabase.from("health_history").select("*").eq("user_id", user.id).single(),
  ]);

  const profile = profileRes.data;
  const familyMembers = familyRes.data ?? [];
  const healthHistory = historyRes.data;

  const familySummary = familyMembers.length > 0
    ? familyMembers.map((m) => {
        const conditions = (m.condition_list as string[] | null)?.join(", ") || "no known conditions";
        const status = m.is_alive
          ? `age ${m.age ?? "unknown"}`
          : `deceased at age ${m.age_at_death ?? "unknown"}${m.cause_of_death ? `, cause: ${m.cause_of_death}` : ""}`;
        const lifestyle = [
          m.smoking && m.smoking !== "never" ? `smoking: ${m.smoking}` : null,
          m.alcohol && m.alcohol !== "none" ? `alcohol: ${m.alcohol}` : null,
        ].filter(Boolean).join(", ");
        return `- ${m.relation} (${status}): ${conditions}${lifestyle ? ` | ${lifestyle}` : ""}${m.notes ? ` | notes: ${m.notes}` : ""}`;
      }).join("\n")
    : "No family members recorded.";

  const prompt = `You are a clinical decision support system. Based on the patient profile below, generate personalised health screening recommendations grounded in evidence-based guidelines (NICE, USPSTF, AHA, etc).

## Patient
- Age: ${profile?.age ?? "unknown"}
- Biological sex: ${profile?.sex ?? "unknown"}
- Lifestyle: ${(() => { try { const l = profile?.lifestyle ? JSON.parse(profile.lifestyle) : null; return l ? `exercise: ${l.exercise||"unknown"}, smoking: ${l.smoking||"unknown"}, alcohol: ${l.alcohol||"unknown"}, diet: ${l.diet||"unknown"}` : "unknown"; } catch { return profile?.lifestyle ?? "unknown"; } })()}
- Current conditions: ${(healthHistory?.current_conditions as string[] | null)?.join(", ") || "none"}
- Medications: ${(healthHistory?.medications as string[] | null)?.join(", ") || "none"}${profile?.notes ? `\n- Additional notes: ${profile.notes}` : ""}

## Family history
${familySummary}

Return a JSON array of recommendations. Each item must have:
{
  "test": "name of the test or screening",
  "reason": "specific reason referencing their family history or profile",
  "frequency": "how often",
  "priority": "high" | "medium" | "routine"
}

Priority guide:
- "high": directly indicated by family history of a hereditary condition
- "medium": recommended given age/sex/lifestyle but not urgent
- "routine": standard screening for all adults

Return 6-10 recommendations. Return only valid JSON array, no explanation.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "[]";

    let recommendations;
    try {
      recommendations = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      recommendations = match ? JSON.parse(match[1]) : [];
    }

    return NextResponse.json({ recommendations });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to generate recommendations.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
