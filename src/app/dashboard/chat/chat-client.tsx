"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Profile {
  name: string;
  age: number | null;
  sex: string | null;
  lifestyle: string | null;
}

interface FamilyMember {
  relation: string;
  condition_list: string[];
  is_alive: boolean;
  cause_of_death: string | null;
  age: number | null;
  age_at_death: number | null;
}

interface HealthHistory {
  current_conditions: string[];
  medications: string[];
  allergies: string[];
}

interface ChatLog {
  id: string;
  message: string;
  response: string;
  created_at: string;
}

export default function ChatClient({
  userId,
  profile,
  familyMembers,
  healthHistory,
  initialChatLogs,
}: {
  userId: string;
  profile: Profile | null;
  familyMembers: FamilyMember[];
  healthHistory: HealthHistory | null;
  initialChatLogs: ChatLog[];
}) {
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; content: string }[]
  >(
    initialChatLogs.flatMap((log) => [
      { role: "user" as const, content: log.message },
      { role: "assistant" as const, content: log.response },
    ])
  );
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const userMessage = input.trim();
    if (!userMessage) return;

    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsTyping(true);

    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          messages: history,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : res.status === 503
              ? "Chat is not configured. Add GOOGLE_API_KEY to your environment."
              : "Something went wrong. Please try again.";
        setError(message);
        toast.error(message);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      const text = data.text ?? "";
      setMessages((prev) => [...prev, { role: "assistant", content: text }]);

      await supabase.from("chat_logs").insert({
        user_id: userId,
        message: userMessage,
        response: text,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error. Please try again.";
      setError(message);
      toast.error(message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Ask GeniTree</h1>
        <p className="text-sm text-muted-foreground">
          Get health insights based on your family history
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border bg-card p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-4 h-12 w-12 text-primary/30" />
            <h3 className="text-lg font-medium">Hello{profile?.name ? `, ${profile.name}` : ""}!</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              I can help answer health questions based on your family history.
              Try asking something like:
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {[
                "Should I worry about cholesterol?",
                "What tests should I get?",
                "Is my medication safe?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.role === "user" ? (
                <User className="h-4 w-4" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-2xl bg-muted px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="my-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <AlertCircle className="h-3 w-3" />
        This is not medical advice. Always consult a licensed physician.
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health..."
            className="flex-1"
            disabled={isTyping}
          />
          <Button type="submit" size="icon" disabled={isTyping || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
