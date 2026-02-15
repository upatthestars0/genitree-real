"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  TestTube,
  FileText,
  ArrowRight,
  Calendar,
  User,
  Pill,
  ChevronDown,
  Plus,
  X,
} from "lucide-react";
import Link from "next/link";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getRecommendations } from "@/lib/recommendations";
import {
  ALL_CONDITIONS,
  getConditionLabel,
  type ConditionDetail,
  type ConditionOption,
} from "@/lib/conditions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Profile {
  id: string;
  name: string | null;
  age: number | null;
  sex: string | null;
  lifestyle: string | null;
  height: string | null;
  weight: string | null;
}

interface FamilyMember {
  id: string;
  relation: string;
  name: string | null;
  condition_list: string[];
}

interface HealthHistory {
  id: string;
  current_conditions: string[];
  condition_details?: ConditionDetail[] | null;
  medications: string[];
  allergies: string[];
  surgeries?: string[];
}

interface TestResult {
  id: string;
  type: string;
  content: string | null;
  file_path: string | null;
  created_at: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardClient({
  profile,
  familyMembers,
  healthHistory,
  myResults,
}: {
  profile: Profile | null;
  familyMembers: FamilyMember[];
  healthHistory: HealthHistory | null;
  myResults: TestResult[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const recs = getRecommendations(profile, familyMembers, healthHistory);
  const comingUp = recs.slice(0, 6);
  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const conditionDetails = healthHistory?.condition_details ?? [];
  const displayConditions =
    conditionDetails.length > 0
      ? conditionDetails.map((d) =>
          d.subtype ? `${d.label} (${d.subtype})` : d.label
        )
      : healthHistory?.current_conditions ?? [];

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: profile?.name ?? "",
    age: profile?.age != null ? String(profile.age) : "",
    sex: profile?.sex ?? "",
    lifestyle: profile?.lifestyle ?? "",
    height: profile?.height ?? "",
    weight: profile?.weight ?? "",
  });
  const [medsOpen, setMedsOpen] = useState(false);
  const [medications, setMedications] = useState(
    healthHistory?.medications?.join(", ") ?? ""
  );
  const [allergies, setAllergies] = useState(
    healthHistory?.allergies?.join(", ") ?? ""
  );
  const [saving, setSaving] = useState(false);

  const [addConditionOpen, setAddConditionOpen] = useState(false);
  const [conditionSearch, setConditionSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<
    ConditionOption | null
  >(null);
  const [followUpSubtype, setFollowUpSubtype] = useState("");
  const [followUpAge, setFollowUpAge] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [addingCondition, setAddingCondition] = useState(false);

  const filteredConditions = ALL_CONDITIONS.filter(
    (c) =>
      !displayConditions.some(
        (d) => d === c.label || d.startsWith(c.label + " (")
      ) &&
      (conditionSearch === "" ||
        c.label.toLowerCase().includes(conditionSearch.toLowerCase()))
  );

  async function saveProfile() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("users")
        .update({
          name: profileForm.name || null,
          age: profileForm.age ? parseInt(profileForm.age, 10) : null,
          sex: profileForm.sex || null,
          lifestyle: profileForm.lifestyle || null,
          height: profileForm.height || null,
          weight: profileForm.weight || null,
        })
        .eq("id", user.id);
      toast.success("Profile updated");
      setProfileOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function saveMedsAndAllergies() {
    setSaving(true);
    try {
      if (!healthHistory?.id) return;
      await supabase
        .from("health_history")
        .update({
          medications: medications
            ? medications.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          allergies: allergies
            ? allergies.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
        })
        .eq("id", healthHistory.id);
      toast.success("Saved");
      setMedsOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function startAddCondition() {
    setSelectedCondition(null);
    setConditionSearch("");
    setFollowUpSubtype("");
    setFollowUpAge("");
    setFollowUpNotes("");
    setAddConditionOpen(true);
  }

  async function submitAddCondition() {
    if (!selectedCondition) {
      toast.error("Select a condition");
      return;
    }
    setAddingCondition(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const opt = ALL_CONDITIONS.find((c) => c.id === selectedCondition.id);
      const category = opt?.category ?? opt?.label;
      const newEntry: ConditionDetail = {
        id: selectedCondition.id,
        label: selectedCondition.label,
        ...(category && { category }),
        ...(followUpSubtype && { subtype: followUpSubtype }),
        ...(followUpAge && {
          age_at_diagnosis: parseInt(followUpAge, 10),
        }),
        ...(followUpNotes && { notes: followUpNotes }),
      };
      const nextDetails = [...conditionDetails, newEntry];
      const { error } = await supabase
        .from("health_history")
        .update({
          condition_details: nextDetails,
          current_conditions: [
            ...(healthHistory?.current_conditions ?? []),
            category || selectedCondition.label,
          ],
        })
        .eq("id", healthHistory!.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Condition added");
      setAddConditionOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setAddingCondition(false);
    }
  }

  async function removeCondition(index: number) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const next = conditionDetails.filter((_, i) => i !== index);
      const nextCurrent = next.map((d) => d.category || d.label);
      await supabase
        .from("health_history")
        .update({
          condition_details: next,
          current_conditions: nextCurrent,
        })
        .eq("id", healthHistory!.id)
        .eq("user_id", user.id);
      toast.success("Removed");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    }
  }

  const showFollowUps = selectedCondition?.followUps?.length;
  const canSubmitCondition =
    selectedCondition &&
    (!selectedCondition.followUps?.includes("subtype") ||
      followUpSubtype ||
      !selectedCondition.subtypes?.length);

  return (
    <motion.div
      className="mx-auto max-w-5xl"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="mb-8">
        <motion.h1
          className="text-2xl font-bold tracking-tight"
          variants={item}
        >
          {profile?.name ? `Hi, ${profile.name}` : "Me"}
        </motion.h1>
        <motion.p className="text-muted-foreground" variants={item}>
          Your health at a glance
        </motion.p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* About me */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">About me</h2>
                <p className="text-xs text-muted-foreground">
                  {profile?.age != null && `Age ${profile.age}`}
                  {profile?.sex && ` · ${profile.sex}`}
                  {!profile?.age && !profile?.sex && "Add your details"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setProfileForm({
                  name: profile?.name ?? "",
                  age: profile?.age != null ? String(profile.age) : "",
                  sex: profile?.sex ?? "",
                  lifestyle: profile?.lifestyle ?? "",
                  height: profile?.height ?? "",
                  weight: profile?.weight ?? "",
                });
                setProfileOpen(true);
              }}
            >
              Edit
            </Button>
          </div>
        </motion.section>

        {/* My conditions */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:col-span-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">My conditions</h2>
            <Button variant="outline" size="sm" onClick={startAddCondition}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout">
              {displayConditions.map((c, i) => (
                <motion.span
                  key={`${c}-${i}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-foreground"
                >
                  {getConditionLabel(c)}
                  <button
                    type="button"
                    onClick={() => removeCondition(i)}
                    className="rounded-full p-0.5 hover:bg-primary/20"
                    aria-label="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
            {displayConditions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No conditions added. Add any that apply so we can tailor advice.
              </p>
            )}
          </div>
        </motion.section>

        {/* Medications & allergies */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md sm:col-span-2"
        >
          <Collapsible open={medsOpen} onOpenChange={setMedsOpen}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Pill className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Medications & allergies</h2>
                  <p className="text-xs text-muted-foreground">
                    {healthHistory?.medications?.length
                      ? `${healthHistory.medications.length} medication(s)`
                      : "None listed"}
                    {healthHistory?.allergies?.length
                      ? ` · ${healthHistory.allergies.length} allergy(ies)`
                      : ""}
                  </p>
                </div>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${medsOpen ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              <div className="mt-4 space-y-3">
                <div>
                  <Label className="text-xs">Medications (comma separated)</Label>
                  <Input
                    className="mt-1"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                    placeholder="e.g. Metformin, Lisinopril"
                  />
                </div>
                <div>
                  <Label className="text-xs">Allergies (comma separated)</Label>
                  <Input
                    className="mt-1"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Shellfish"
                  />
                </div>
                <Button size="sm" onClick={saveMedsAndAllergies} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.section>

        {/* Coming up */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Coming up</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tests to consider
          </p>
          <ul className="mt-3 space-y-1.5">
            {comingUp.map((r) => (
              <li
                key={r.test}
                className="flex justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm"
              >
                <span className="truncate font-medium">{r.test}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.frequency}
                </span>
              </li>
            ))}
          </ul>
          <Link
            href="/dashboard/results"
            className="mt-3 inline-block text-sm text-primary hover:underline"
          >
            See all →
          </Link>
        </motion.section>

        {/* Results */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Results</h2>
            </div>
            <Link href="/dashboard/results">
              <Button variant="ghost" size="sm">
                Add
              </Button>
            </Link>
          </div>
          {myResults.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No results yet
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {myResults.slice(0, 3).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm"
                >
                  {r.type === "pdf" ? (
                    <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <TestTube className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">
                    {r.content || (r.type === "pdf" ? "PDF" : "Entry")}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {myResults.length > 0 && (
            <Link
              href="/dashboard/results"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          )}
        </motion.section>

        {/* Ask CTA - full width */}
        <motion.section
          variants={item}
          className="rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:col-span-2 lg:col-span-3"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Have a health question?</h2>
              <p className="text-sm text-muted-foreground">
                Get answers tailored to you and your family history.
              </p>
            </div>
            <Link href="/dashboard/ask">
              <Button className="gap-2">
                Ask a question
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.section>
      </div>

      {/* Edit profile dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label>Name</Label>
              <Input
                value={profileForm.name}
                onChange={(e) =>
                  setProfileForm((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input
                  type="number"
                  value={profileForm.age}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, age: e.target.value }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Sex</Label>
                <Select
                  value={profileForm.sex}
                  onValueChange={(v) =>
                    setProfileForm((p) => ({ ...p, sex: v }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="intersex">Intersex</SelectItem>
                    <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Height</Label>
                <Input
                  value={profileForm.height}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, height: e.target.value }))
                  }
                  placeholder="e.g. 170 cm"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Weight</Label>
                <Input
                  value={profileForm.weight}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, weight: e.target.value }))
                  }
                  placeholder="e.g. 70 kg"
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Lifestyle</Label>
              <Select
                value={profileForm.lifestyle}
                onValueChange={(v) =>
                  setProfileForm((p) => ({ ...p, lifestyle: v }))
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="smoker">Smoker</SelectItem>
                  <SelectItem value="social-drinker">Social drinker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add condition dialog */}
      <Dialog open={addConditionOpen} onOpenChange={setAddConditionOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a condition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Search or select</Label>
              <Input
                placeholder="e.g. anaemia, cancer, menopause"
                value={conditionSearch}
                onChange={(e) => setConditionSearch(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border p-2">
              {filteredConditions.slice(0, 50).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCondition(c)}
                  className={`block w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    selectedCondition?.id === c.id
                      ? "bg-primary/15 text-primary"
                      : "hover:bg-muted/60"
                  }`}
                >
                  {c.label}
                </button>
              ))}
              {filteredConditions.length === 0 && (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  No matching conditions or already added.
                </p>
              )}
            </div>

            {showFollowUps && selectedCondition && (
              <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  A bit more detail (optional but helpful)
                </p>
                {selectedCondition.followUps?.includes("subtype") &&
                  selectedCondition.subtypes &&
                  selectedCondition.subtypes.length > 0 && (
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={followUpSubtype}
                        onValueChange={setFollowUpSubtype}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select if applicable" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedCondition.subtypes.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                {selectedCondition.followUps?.includes("age_at_diagnosis") && (
                  <div>
                    <Label className="text-xs">Age at diagnosis (if known)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 45"
                      value={followUpAge}
                      onChange={(e) => setFollowUpAge(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
                {selectedCondition.followUps?.includes("notes") && (
                  <div>
                    <Label className="text-xs">Notes (optional)</Label>
                    <Input
                      placeholder="Any extra detail"
                      value={followUpNotes}
                      onChange={(e) => setFollowUpNotes(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddConditionOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitAddCondition}
              disabled={addingCondition || !canSubmitCondition}
            >
              {addingCondition ? "Adding..." : "Add condition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
