"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TreePine, ArrowRight, ArrowLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const CONDITIONS = [
  "Diabetes", "Hypertension", "Heart Disease", "Cancer",
  "Autoimmune Disorder", "Mental Health", "Stroke", "Alzheimer's",
  "Asthma", "Kidney Disease",
];

const RELATIONS = [
  "Mother", "Father", "Adoptive Mother", "Adoptive Father", "Stepmother", "Stepfather",
  "Sister", "Brother", "Half-Sister", "Half-Brother", "Stepsister", "Stepbrother",
  "Daughter", "Son", "Adopted Daughter", "Adopted Son", "Stepdaughter", "Stepson",
  "Maternal Grandmother", "Maternal Grandfather", "Paternal Grandmother", "Paternal Grandfather",
  "Aunt", "Uncle", "Niece", "Nephew", "Cousin", "Partner", "Spouse",
];

const CURRENT_YEAR = new Date().getFullYear();
const BIRTH_YEARS = Array.from({ length: 100 }, (_, i) => CURRENT_YEAR - i);

interface FamilyMember {
  relation: string;
  name: string;
  birthYear: string;
  isAlive: boolean;
  ageAtDeath: string;
  conditions: string[];
  causeOfDeath: string;
}

function emptyMember(relation = ""): FamilyMember {
  return { relation, name: "", birthYear: "", isAlive: true, ageAtDeath: "", conditions: [], causeOfDeath: "" };
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Step 1 — About you
  const [birthYear, setBirthYear] = useState("");
  const [sex, setSex] = useState("");
  const [exercise, setExercise] = useState("");
  const [smoking, setSmoking] = useState("");
  const [alcohol, setAlcohol] = useState("");
  const [diet, setDiet] = useState("");

  // Step 2 — Family
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    emptyMember("Mother"),
    emptyMember("Father"),
  ]);

  // Step 3 — Your health
  const [currentConditions, setCurrentConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");

  function updateMember(index: number, field: keyof FamilyMember, value: string | boolean | string[]) {
    setFamilyMembers((prev) => {
      const updated = [...prev];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (updated[index] as any)[field] = value;
      return updated;
    });
  }

  function toggleMemberCondition(index: number, condition: string) {
    setFamilyMembers((prev) => {
      const updated = [...prev];
      const m = { ...updated[index] };
      m.conditions = m.conditions.includes(condition)
        ? m.conditions.filter((c) => c !== condition)
        : [...m.conditions, condition];
      updated[index] = m;
      return updated;
    });
  }

  async function handleComplete() {
    const unnamed = familyMembers.filter((m) => m.relation && !m.name.trim());
    if (unnamed.length > 0) {
      toast.error(`Please enter a name for each family member (or remove them).`);
      setStep(2);
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Not authenticated"); return; }

      const age = birthYear ? CURRENT_YEAR - parseInt(birthYear) : null;

      const { error: userError } = await supabase
        .from("users")
        .update({
          age,
          sex: sex || null,
          lifestyle: JSON.stringify({ exercise, smoking, alcohol, diet }),
          onboarding_completed: true,
        })
        .eq("id", user.id);
      if (userError) throw userError;

      const familyData = familyMembers
        .filter((m) => m.relation)
        .map((m) => ({
          user_id: user.id,
          relation: m.relation,
          name: m.name || null,
          age: m.birthYear ? CURRENT_YEAR - parseInt(m.birthYear) : null,
          age_at_death: m.ageAtDeath ? parseInt(m.ageAtDeath) : null,
          is_alive: m.isAlive,
          condition_list: m.conditions,
          cause_of_death: m.causeOfDeath || null,
        }));

      if (familyData.length > 0) {
        const { error } = await supabase.from("family_members").insert(familyData);
        if (error) throw error;
      }

      const { error: healthError } = await supabase.from("health_history").insert({
        user_id: user.id,
        current_conditions: currentConditions,
        medications: medications ? medications.split(",").map((s) => s.trim()).filter(Boolean) : [],
        allergies: allergies ? allergies.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      if (healthError) throw healthError;

      toast.success("You're all set!");
      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { num: 1, label: "About You" },
    { num: 2, label: "Your Family" },
    { num: 3, label: "Your Health" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <TreePine className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">GeniTree</span>
          </div>
          <h1 className="text-2xl font-semibold">Let&apos;s build your health tree</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Takes about 2 minutes — fields marked <span className="text-destructive">*</span> are required
          </p>
        </div>

        {/* Progress */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                step > s.num ? "bg-primary text-primary-foreground"
                  : step === s.num ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}>
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span className={`hidden text-sm sm:inline ${step >= s.num ? "font-medium" : "text-muted-foreground"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`mx-2 h-px w-8 ${step > s.num ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: About You */}
        {step === 1 && (
          <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">About You</h2>
              <p className="text-sm text-muted-foreground">Skip anything you&apos;d rather not answer</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Year of birth</Label>
                <Select value={birthYear} onValueChange={setBirthYear}>
                  <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {BIRTH_YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Biological sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="intersex">Intersex</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Exercise</Label>
                <Select value={exercise} onValueChange={setExercise}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light (2–4x/month)</SelectItem>
                    <SelectItem value="moderate">Moderate (1–2x/week)</SelectItem>
                    <SelectItem value="active">Active (3+/week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Smoking</Label>
                <Select value={smoking} onValueChange={setSmoking}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="ex-smoker">Ex-smoker</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alcohol</Label>
                <Select value={alcohol} onValueChange={setAlcohol}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Diet</Label>
                <Select value={diet} onValueChange={setDiet}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-restrictions">No restrictions</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Family */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Your Family</h2>
              <p className="mb-5 text-sm text-muted-foreground">
                We&apos;ve pre-filled Mother and Father — remove or edit them freely. You can add more from the Family Tree later.
              </p>
              <div className="space-y-4">
                {familyMembers.map((member, index) => (
                  <div key={index} className="space-y-3 rounded-xl border bg-background p-4">
                    <div className="flex items-center gap-3">
                      <Select
                        value={member.relation}
                        onValueChange={(v) => updateMember(index, "relation", v)}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <button
                        type="button"
                        onClick={() => setFamilyMembers((prev) => prev.filter((_, i) => i !== index))}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Name <span className="text-destructive">*</span></Label>
                        <Input
                          placeholder="e.g. Jane"
                          value={member.name}
                          required
                          onChange={(e) => updateMember(index, "name", e.target.value)}
                        />
                      </div>
                      <Select
                        value={member.birthYear}
                        onValueChange={(v) => updateMember(index, "birthYear", v)}
                      >
                        <SelectTrigger><SelectValue placeholder="Year of birth" /></SelectTrigger>
                        <SelectContent className="max-h-60">
                          {BIRTH_YEARS.map((y) => (
                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`alive-${index}`}
                        checked={member.isAlive}
                        onCheckedChange={(v) => updateMember(index, "isAlive", !!v)}
                      />
                      <Label htmlFor={`alive-${index}`} className="text-sm font-normal">Currently alive</Label>
                      {!member.isAlive && (
                        <Input
                          type="number"
                          placeholder="Age at death"
                          value={member.ageAtDeath}
                          onChange={(e) => updateMember(index, "ageAtDeath", e.target.value)}
                          className="ml-2 w-32"
                        />
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-xs text-muted-foreground">Known conditions</p>
                      <div className="flex flex-wrap gap-1.5">
                        {CONDITIONS.map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => toggleMemberCondition(index, c)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                              member.conditions.includes(c)
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setFamilyMembers((prev) => [...prev, emptyMember()])}
                  className="w-full"
                >
                  + Add another family member
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Your Health */}
        {step === 3 && (
          <div className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">Your Health</h2>
              <p className="text-sm text-muted-foreground">Optional — skip anything that doesn&apos;t apply</p>
            </div>

            <div>
              <Label className="mb-2 block">Any current conditions?</Label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() =>
                      setCurrentConditions((prev) =>
                        prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      currentConditions.includes(c)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">Current medications <span className="text-muted-foreground font-normal text-xs">comma separated</span></Label>
              <Input
                id="medications"
                placeholder="e.g. Metformin, Lisinopril"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies <span className="text-muted-foreground font-normal text-xs">comma separated</span></Label>
              <Input
                id="allergies"
                placeholder="e.g. Penicillin, Shellfish"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            {step < 3 ? (
              <>
                <Button variant="ghost" onClick={() => setStep(step + 1)} className="text-muted-foreground">
                  Skip
                </Button>
                <Button onClick={() => setStep(step + 1)}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={handleComplete} disabled={loading} className="text-muted-foreground">
                  Skip for now
                </Button>
                <Button onClick={handleComplete} disabled={loading}>
                  {loading ? "Saving..." : "Finish"}
                  {!loading && <Check className="ml-2 h-4 w-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
