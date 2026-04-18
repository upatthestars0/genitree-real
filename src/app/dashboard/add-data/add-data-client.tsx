"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface FamilyMember {
  id: string;
  relation: string;
  name: string | null;
}

interface ParsedData {
  summary: string;
  date: string | null;
  conditions: string[];
  test_results: { name: string; value: string; unit?: string; flag?: string }[];
  medications: string[];
  notes: string;
}

interface TestResult {
  id: string;
  content: string;
  created_at: string;
  family_member_id: string | null;
}

type Step = "upload" | "confirm" | "done";

export default function AddDataClient({
  userId,
  familyMembers,
  recentResults,
}: {
  userId: string;
  familyMembers: FamilyMember[];
  recentResults: TestResult[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [selectedMember, setSelectedMember] = useState<string>("self");
  const [checkingEmail, setCheckingEmail] = useState(false);

  async function handleCheckEmail() {
    setCheckingEmail(true);
    try {
      const res = await fetch("/api/email/poll", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to check inbox");
      if (data.count === 0) {
        toast.info("No new medical emails found. Forward a document to your inbox with subject containing 'genitree'.");
      } else {
        toast.success(`${data.count} document${data.count > 1 ? "s" : ""} imported from email.`);
        router.refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to check email");
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleFile(file: File) {
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Please upload a PDF, JPG, PNG, or WebP file.");
      return;
    }

    setFileName(file.name);
    setParsing(true);

    const base64 = await fileToBase64(file);

    try {
      const res = await fetch("/api/parse-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64, mediaType: file.type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse document.");

      setParsed(data.data);
      setStep("confirm");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to parse document.");
    } finally {
      setParsing(false);
    }
  }

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("test_results").insert({
        user_id: userId,
        family_member_id: selectedMember === "self" ? null : selectedMember,
        type: "pdf",
        content: JSON.stringify(parsed),
      });

      if (error) throw error;
      toast.success("Data saved to your health record.");
      setStep("done");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setStep("upload");
    setParsed(null);
    setFileName("");
    setSelectedMember("self");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Data</h1>
        <p className="text-muted-foreground">
          Upload a medical document and we&apos;ll extract the key information automatically.
        </p>
      </div>

      {/* Step: Upload */}
      {step === "upload" && (
        <div
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-12 text-center transition-colors hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
        >
          {parsing ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="font-medium">Reading {fileName}...</p>
              <p className="text-sm text-muted-foreground">Claude is extracting the medical data</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Drop a file here or click to upload</p>
                <p className="text-sm text-muted-foreground">PDF, JPG, PNG — blood tests, discharge letters, GP summaries</p>
              </div>
              <Button variant="outline" size="sm">Choose file</Button>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
      )}

      {/* Step: Confirm */}
      {step === "confirm" && parsed && (
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 space-y-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-semibold">{parsed.summary}</p>
                {parsed.date && <p className="text-sm text-muted-foreground">Date: {parsed.date}</p>}
              </div>
            </div>

            {parsed.conditions.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Conditions / Diagnoses</p>
                <div className="flex flex-wrap gap-2">
                  {parsed.conditions.map((c) => (
                    <span key={c} className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-600">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {parsed.test_results.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Test Results</p>
                <div className="space-y-1.5">
                  {parsed.test_results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                      <span className="font-medium">{r.name}</span>
                      <span className={`${r.flag === "high" || r.flag === "low" ? "text-red-600 font-semibold" : "text-muted-foreground"}`}>
                        {r.value}{r.unit ? ` ${r.unit}` : ""}{r.flag ? ` (${r.flag})` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parsed.medications.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Medications</p>
                <div className="flex flex-wrap gap-2">
                  {parsed.medications.map((m) => (
                    <span key={m} className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {parsed.notes && (
              <div>
                <p className="mb-1 text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">{parsed.notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Who does this belong to?</p>
            <Select value={selectedMember} onValueChange={setSelectedMember}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Me</SelectItem>
                {familyMembers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name ? `${m.name} (${m.relation})` : m.relation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="flex-1">Upload different file</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving..." : "Save to health record"}
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border bg-card p-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
          <div>
            <p className="text-lg font-semibold">Saved to your health record</p>
            <p className="text-sm text-muted-foreground mt-1">This data is now part of your family health history.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset}>Upload another</Button>
            <Button onClick={() => router.push("/dashboard/recommendations")}>View recommendations</Button>
          </div>
        </div>
      )}

      {/* Recent uploads */}
      {recentResults.length > 0 && step === "upload" && (
        <div>
          <p className="mb-3 text-sm font-medium text-muted-foreground">Recent uploads</p>
          <div className="space-y-2">
            {recentResults.map((r) => {
              let summary = "Document";
              try { summary = JSON.parse(r.content).summary ?? "Document"; } catch {}
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate">{summary}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Email import */}
      <div className="flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="text-sm">
            <p className="font-medium">Import from email</p>
            <p className="text-muted-foreground">Forward a medical document to your inbox with <span className="font-mono text-xs">genitree</span> in the subject, then click check.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleCheckEmail} disabled={checkingEmail} className="shrink-0">
          {checkingEmail ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
          {checkingEmail ? "Checking..." : "Check inbox"}
        </Button>
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
