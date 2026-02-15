"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const BUCKET = "results";

interface Result {
  id: string;
  family_member_id: string | null;
  type: string;
  content: string | null;
  file_path: string | null;
  created_at: string;
}

interface WhoOption {
  id: string;
  label: string;
}

export default function ResultsClient({
  results,
  whoOptions,
  preselectedWho,
}: {
  results: Result[];
  whoOptions: WhoOption[];
  preselectedWho: string;
}) {
  const [who, setWho] = useState(preselectedWho);
  const [mode, setMode] = useState<"manual" | "pdf">("manual");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast.error("Please sign in again");
        setLoading(false);
        return;
      }
      const familyMemberId = who === "me" ? null : who;

      if (mode === "manual") {
        if (!content.trim()) {
          toast.error("Add a short note for this result");
          setLoading(false);
          return;
        }
        const { error } = await supabase.from("test_results").insert({
          user_id: authUser.id,
          family_member_id: familyMemberId,
          type: "manual",
          content: content.trim(),
        });
        if (error) throw error;
        toast.success("Result saved");
        setContent("");
        window.location.reload();
        return;
      }

      if (mode === "pdf" && file) {
        const ext = file.name.split(".").pop() || "pdf";
        const path = `${authUser.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false });
        if (uploadError) {
          if (uploadError.message.includes("Bucket") || uploadError.message.includes("not found")) {
            toast.error("PDF storage not set up yet. Create a bucket named 'results' in Supabase Storage.");
          } else throw uploadError;
          setLoading(false);
          return;
        }
        const { error } = await supabase.from("test_results").insert({
          user_id: authUser.id,
          family_member_id: familyMemberId,
          type: "pdf",
          file_path: path,
          content: null,
        });
        if (error) throw error;
        toast.success("PDF uploaded. Summary can be added later via our agent.");
        setFile(null);
        window.location.reload();
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Results</h1>
        <p className="text-muted-foreground">
          Add lab results, upload PDFs, and keep your history in one place
        </p>
      </div>

      {/* Add result */}
      <section className="rounded-xl border bg-card p-6">
        <h2 className="mb-4 font-semibold">Add a result</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Who is this for?</Label>
            <Select value={who} onValueChange={setWho}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {whoOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  mode === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <TestTube className="h-4 w-4" />
                Manual note
              </button>
              <button
                type="button"
                onClick={() => setMode("pdf")}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  mode === "pdf"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <Upload className="h-4 w-4" />
                Upload PDF
              </button>
            </div>
          </div>
          {mode === "manual" && (
            <div>
              <Label htmlFor="content">Note</Label>
              <Textarea
                id="content"
                placeholder="e.g. Blood panel from Jan 2025 – cholesterol normal, vitamin D low"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="mt-1.5 resize-none"
              />
            </div>
          )}
          {mode === "pdf" && (
            <div>
              <Label>PDF file</Label>
              <div className="mt-1.5">
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                We’ll store the file. A human-readable summary can be added later (e.g. via our agent).
              </p>
            </div>
          )}
          <Button type="submit" disabled={loading || (mode === "pdf" && !file)}>
            {loading ? "Saving..." : "Save result"}
          </Button>
        </form>
      </section>

      {/* List */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Past results</h2>
          {whoOptions.length > 1 && (
            <Select
              value={who}
              onValueChange={(v) => router.push(`/dashboard/results${v === "me" ? "" : `?who=${v}`}`)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Who" />
              </SelectTrigger>
              <SelectContent>
                {whoOptions.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        {results.length === 0 ? (
          <p className="rounded-xl border border-dashed bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No results yet. Add a manual note or upload a PDF above.
          </p>
        ) : (
          <ul className="space-y-2">
            {results.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
              >
                {r.type === "pdf" ? (
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <TestTube className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">
                    {r.content || (r.type === "pdf" ? "PDF upload" : "Manual entry")}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
                {r.type === "pdf" && r.file_path && (
                  <a
                    href="#"
                    onClick={async (e) => {
                      e.preventDefault();
                      const { data } = supabase.storage.from(BUCKET).getPublicUrl(r.file_path!);
                      window.open(data.publicUrl, "_blank");
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    View file
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
