"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TreePine, ArrowRight, ArrowLeft, Check } from "lucide-react";
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
  "Diabetes",
  "Hypertension",
  "Heart Disease",
  "Cancer",
  "Autoimmune Disorder",
  "Mental Health",
  "Stroke",
  "Alzheimer's",
  "Asthma",
  "Kidney Disease",
];

const RELATIONS = [
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Son",
  "Daughter",
];

interface FamilyMember {
  relation: string;
  name: string;
  age: string;
  isAlive: boolean;
  ageAtDeath: string;
  conditions: string[];
  causeOfDeath: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Step 1 state
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [lifestyle, setLifestyle] = useState("");

  // Step 2 state
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      relation: "Mother",
      name: "",
      age: "",
      isAlive: true,
      ageAtDeath: "",
      conditions: [],
      causeOfDeath: "",
    },
    {
      relation: "Father",
      name: "",
      age: "",
      isAlive: true,
      ageAtDeath: "",
      conditions: [],
      causeOfDeath: "",
    },
  ]);

  // Step 3 state
  const [currentConditions, setCurrentConditions] = useState<string[]>([]);
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [surgeries, setSurgeries] = useState("");

  function addFamilyMember() {
    setFamilyMembers([
      ...familyMembers,
      {
        relation: "",
        name: "",
        age: "",
        isAlive: true,
        ageAtDeath: "",
        conditions: [],
        causeOfDeath: "",
      },
    ]);
  }

  function removeFamilyMember(index: number) {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  }

  function updateFamilyMember(
    index: number,
    field: keyof FamilyMember,
    value: string | boolean | string[]
  ) {
    const updated = [...familyMembers];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[index] as any)[field] = value;
    setFamilyMembers(updated);
  }

  function toggleFamilyCondition(index: number, condition: string) {
    const updated = [...familyMembers];
    const member = updated[index];
    if (member.conditions.includes(condition)) {
      member.conditions = member.conditions.filter((c) => c !== condition);
    } else {
      member.conditions = [...member.conditions, condition];
    }
    setFamilyMembers(updated);
  }

  async function handleComplete() {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      // Update user profile
      const { error: userError } = await supabase
        .from("users")
        .update({
          age: age ? parseInt(age) : null,
          sex,
          height,
          weight,
          lifestyle,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (userError) throw userError;

      // Insert family members
      const familyData = familyMembers
        .filter((m) => m.relation)
        .map((m) => ({
          user_id: user.id,
          relation: m.relation,
          name: m.name || null,
          age: m.age ? parseInt(m.age) : null,
          age_at_death: m.ageAtDeath ? parseInt(m.ageAtDeath) : null,
          is_alive: m.isAlive,
          condition_list: m.conditions,
          cause_of_death: m.causeOfDeath || null,
        }));

      if (familyData.length > 0) {
        const { error: familyError } = await supabase
          .from("family_members")
          .insert(familyData);
        if (familyError) throw familyError;
      }

      // Insert health history
      const { error: healthError } = await supabase
        .from("health_history")
        .insert({
          user_id: user.id,
          current_conditions: currentConditions,
          medications: medications
            ? medications.split(",").map((s) => s.trim())
            : [],
          allergies: allergies
            ? allergies.split(",").map((s) => s.trim())
            : [],
          surgeries: surgeries
            ? surgeries.split(",").map((s) => s.trim())
            : [],
        });

      if (healthError) throw healthError;

      toast.success("Profile complete!");
      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { num: 1, label: "About You" },
    { num: 2, label: "Family History" },
    { num: 3, label: "Health History" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <TreePine className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold">GeniTree</span>
          </div>
          <h1 className="text-2xl font-semibold">
            Let&apos;s build your health profile
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This information helps us provide personalized health insights
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  step > s.num
                    ? "bg-primary text-primary-foreground"
                    : step === s.num
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.num ? <Check className="h-4 w-4" /> : s.num}
              </div>
              <span
                className={`hidden text-sm sm:inline ${
                  step >= s.num
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={`mx-2 h-px w-8 ${
                    step > s.num ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: About You */}
        {step === 1 && (
          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">About You</h2>
              <p className="text-sm text-muted-foreground">
                Basic information to personalize your health insights
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Biological Sex</Label>
                <Select value={sex} onValueChange={setSex}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="intersex">Intersex</SelectItem>
                    <SelectItem value="prefer-not-to-say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  placeholder={`e.g. 5'10" or 178cm`}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  placeholder="e.g. 165 lbs or 75 kg"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lifestyle</Label>
              <Select value={lifestyle} onValueChange={setLifestyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your lifestyle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    Active (Exercise 3+ times/week)
                  </SelectItem>
                  <SelectItem value="moderate">
                    Moderate (Some activity)
                  </SelectItem>
                  <SelectItem value="sedentary">
                    Sedentary (Mostly sitting)
                  </SelectItem>
                  <SelectItem value="smoker">Smoker</SelectItem>
                  <SelectItem value="social-drinker">Social Drinker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 2: Family History */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Immediate Family</h2>
              <p className="mb-4 text-sm text-muted-foreground">
                Add parents, siblings, and children. You can add extended family later from the Family Tree.
              </p>

              <div className="space-y-6">
                {familyMembers.map((member, index) => (
                  <div
                    key={index}
                    className="space-y-4 rounded-xl border bg-background p-4"
                  >
                    <div className="flex items-center justify-between">
                      <Select
                        value={member.relation}
                        onValueChange={(v) =>
                          updateFamilyMember(index, "relation", v)
                        }
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {index >= 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFamilyMember(index)}
                          className="text-destructive"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        placeholder="Name (optional)"
                        value={member.name}
                        onChange={(e) =>
                          updateFamilyMember(index, "name", e.target.value)
                        }
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`alive-${index}`}
                          checked={member.isAlive}
                          onCheckedChange={(v) =>
                            updateFamilyMember(index, "isAlive", !!v)
                          }
                        />
                        <Label htmlFor={`alive-${index}`} className="text-sm">
                          Currently alive
                        </Label>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {member.isAlive ? (
                        <Input
                          type="number"
                          placeholder="Current age"
                          value={member.age}
                          onChange={(e) =>
                            updateFamilyMember(index, "age", e.target.value)
                          }
                        />
                      ) : (
                        <>
                          <Input
                            type="number"
                            placeholder="Age at death"
                            value={member.ageAtDeath}
                            onChange={(e) =>
                              updateFamilyMember(
                                index,
                                "ageAtDeath",
                                e.target.value
                              )
                            }
                          />
                          <Input
                            placeholder="Cause of death"
                            value={member.causeOfDeath}
                            onChange={(e) =>
                              updateFamilyMember(
                                index,
                                "causeOfDeath",
                                e.target.value
                              )
                            }
                          />
                        </>
                      )}
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm">
                        Known conditions
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {CONDITIONS.map((condition) => (
                          <button
                            type="button"
                            key={condition}
                            onClick={() =>
                              toggleFamilyCondition(index, condition)
                            }
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              member.conditions.includes(condition)
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {condition}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addFamilyMember}
                  className="w-full"
                >
                  + Add Family Member
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Health History */}
        {step === 3 && (
          <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">
                Your Personal Health History
              </h2>
              <p className="text-sm text-muted-foreground">
                Help us understand your current health status
              </p>
            </div>

            <div>
              <Label className="mb-2 block">Current Conditions</Label>
              <div className="flex flex-wrap gap-2">
                {CONDITIONS.map((condition) => (
                  <button
                    type="button"
                    key={condition}
                    onClick={() =>
                      setCurrentConditions((prev) =>
                        prev.includes(condition)
                          ? prev.filter((c) => c !== condition)
                          : [...prev, condition]
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      currentConditions.includes(condition)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {condition}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="medications">
                Current Medications (comma separated)
              </Label>
              <Input
                id="medications"
                placeholder="e.g. Metformin, Lisinopril"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies (comma separated)</Label>
              <Input
                id="allergies"
                placeholder="e.g. Penicillin, Shellfish"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="surgeries">
                Previous Surgeries (comma separated)
              </Label>
              <Input
                id="surgeries"
                placeholder="e.g. Appendectomy (2020)"
                value={surgeries}
                onChange={(e) => setSurgeries(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labResults">Lab Results (optional)</Label>
              <Input id="labResults" type="file" accept=".pdf,.jpg,.png" />
              <p className="text-xs text-muted-foreground">
                Upload recent lab results (PDF, JPG, or PNG)
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleComplete} disabled={loading}>
              {loading ? "Saving..." : "Complete Setup"}
              {!loading && <Check className="ml-2 h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
