"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, User, Bot } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { generateMockResponse } from "@/lib/chat-response";

const TOPICS = [
  { id: "treatment", label: "A treatment (should I take it? is it right for me?)" },
  { id: "symptom", label: "A symptom (why am I having this?)" },
  { id: "test", label: "Test recommendations (what should I get checked?)" },
  { id: "medication", label: "Medication (is it safe? interactions?)" },
  { id: "other", label: "Something else" },
] as const;

interface Profile {
  name: string;
  age: number | null;
  sex: string | null;
}

interface FamilyMember {
  id: string;
  relation: string;
  name: string | null;
  condition_list: string[];
}

interface HealthHistory {
  current_conditions: string[];
  medications: string[];
  allergies: string[];
}

interface Child {
  id: string;
  relation: string;
  name: string | null;
}

export default function AskClient({
  userId,
  profile,
  familyMembers,
  healthHistory,
  children,
  preselectedWho,
}: {
  userId: string;
  profile: Profile | null;
  familyMembers: FamilyMember[];
  healthHistory: HealthHistory | null;
  children: Child[];
  preselectedWho: string | null;
}) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [who, setWho] = useState<string | null>(preselectedWho || "me");
  const [topic, setTopic] = useState<string | null>(null);
  const [details, setDetails] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit() {
    if (step === 3) {
      setLoading(true);
      const topicLabel = TOPICS.find((t) => t.id === topic)?.label || topic || "";
      const message = [
        `Question about: ${topicLabel}.`,
        details.trim() ? `Details: ${details.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" ");

      await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
      const answer = generateMockResponse(
        message,
        profile,
        familyMembers,
        healthHistory
      );
      setResponse(answer);

      await supabase.from("chat_logs").insert({
        user_id: userId,
        message,
        response: answer,
      });
      setStep(4);
      setLoading(false);
      return;
    }
    if (step === 2) setStep(3);
    if (step === 1) setStep(2);
  }

  if (response !== null && step === 4) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your answer</h1>
          <p className="text-muted-foreground">
            Based on your family history and what you shared
          </p>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" />
            GeniTree
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {response}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/ask">Ask another question</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard">Back to Me</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Ask a question</h1>
        <p className="text-muted-foreground">
          We’ll ask a few short questions so we can give you a relevant answer
        </p>
      </div>

      <div className="rounded-xl border bg-card p-6">
        {/* Step 1: Who */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Who is this about?</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWho("me")}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                  who === "me"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <User className="h-4 w-4" />
                Me
              </button>
              {children.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setWho(c.id)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                    who === c.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <User className="h-4 w-4" />
                  {c.name || c.relation}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Topic (MCQ) */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-semibold">What’s your question about?</h2>
            <p className="text-sm text-muted-foreground">
              Choose the closest option. You can add details next.
            </p>
            <div className="space-y-2">
              {TOPICS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTopic(t.id)}
                  className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                    topic === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Optional details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-semibold">Any details? (optional)</h2>
            <p className="text-sm text-muted-foreground">
              Type anything that helps — or skip if you prefer.
            </p>
            <Textarea
              placeholder="e.g. I’ve had headaches for a week, or the doctor suggested this medication..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => (s > 1 ? (s - 1) as 1 | 2 | 3 : 1))}
            disabled={step === 1}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={(step === 2 && !topic) || loading}
          >
            {loading ? "Thinking..." : step === 3 ? "Get answer" : "Next"}
            {!loading && step !== 3 && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
