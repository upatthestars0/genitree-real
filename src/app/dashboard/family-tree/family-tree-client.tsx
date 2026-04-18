"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Heart, Plus, MoreVertical, Pencil, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ALL_CONDITIONS } from "@/lib/conditions";

const CONDITION_LABELS = ALL_CONDITIONS.map((c) => c.label);


const RELATIONS = [
  // Parents
  "Mother",
  "Father",
  "Adoptive Mother",
  "Adoptive Father",
  "Stepmother",
  "Stepfather",
  // Siblings
  "Sister",
  "Brother",
  "Half-Sister",
  "Half-Brother",
  "Stepsister",
  "Stepbrother",
  // Children
  "Daughter",
  "Son",
  "Adopted Daughter",
  "Adopted Son",
  "Stepdaughter",
  "Stepson",
  // Grandparents
  "Maternal Grandmother",
  "Maternal Grandfather",
  "Paternal Grandmother",
  "Paternal Grandfather",
  // Grandchildren
  "Granddaughter",
  "Grandson",
  // Extended
  "Aunt",
  "Uncle",
  "Niece",
  "Nephew",
  "Cousin",
  // Partner
  "Partner",
  "Spouse",
];

interface FamilyMember {
  id: string;
  relation: string;
  name: string | null;
  age: number | null;
  age_at_death: number | null;
  is_alive: boolean;
  condition_list: string[];
  cause_of_death: string | null;
  smoking: string | null;
  alcohol: string | null;
  notes: string | null;
}

interface Profile {
  name: string;
  age: number | null;
  sex: string | null;
  lifestyle: string | null;
  notes: string | null;
}

interface HealthHistory {
  current_conditions: string[];
  medications: string[];
  allergies: string[];
}

interface TestResult {
  id: string;
  content: string;
  created_at: string;
}

const emptyForm = () => ({
  relation: "",
  name: "",
  age: "",
  isAlive: true,
  ageAtDeath: "",
  causeOfDeath: "",
  conditions: [] as string[],
  smoking: "",
  alcohol: "",
  notes: "",
});

function MemberCard({
  member,
  onEdit,
  onRemove,
  onView,
}: {
  member: FamilyMember;
  onEdit: () => void;
  onRemove: () => void;
  onView: () => void;
}) {
  return (
    <div className="group relative flex flex-col items-center">
      <button
        onClick={onView}
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-opacity hover:opacity-80 ${
          member.is_alive
            ? "border-primary/30 bg-primary/10"
            : "border-muted bg-muted"
        }`}
      >
        <User
          className={`h-7 w-7 ${
            member.is_alive ? "text-primary" : "text-muted-foreground"
          }`}
        />
      </button>
      <button onClick={onView} className="mt-2 text-sm font-semibold hover:underline">
        {member.name || member.relation}
      </button>
      <p className="text-xs text-muted-foreground">{member.relation}</p>
      {member.is_alive && member.age != null && (
        <p className="text-xs text-muted-foreground">Age {member.age}</p>
      )}
      {!member.is_alive && member.age_at_death != null && (
        <p className="text-xs text-muted-foreground">
          Passed at {member.age_at_death}
        </p>
      )}
      {member.condition_list && member.condition_list.length > 0 && (
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {member.condition_list.map((c) => (
            <span
              key={c}
              className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600"
            >
              {c}
            </span>
          ))}
        </div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-0 right-0 h-8 w-8 opacity-70 group-hover:opacity-100"
          >
            <span className="sr-only">Options</span>
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
          <DropdownMenuItem onClick={onRemove} className="text-destructive">
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function FamilyTreeClient({
  profile,
  familyMembers,
  healthHistory,
  userId,
}: {
  profile: Profile | null;
  familyMembers: FamilyMember[];
  healthHistory: HealthHistory | null;
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  // View sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetMember, setSheetMember] = useState<FamilyMember | null>(null);
  const [sheetResults, setSheetResults] = useState<TestResult[]>([]);
  const [sheetLoading, setSheetLoading] = useState(false);

  async function openView(member: FamilyMember) {
    setSheetMember(member);
    setSheetOpen(true);
    setSheetLoading(true);
    const { data } = await supabase
      .from("test_results")
      .select("id, content, created_at")
      .eq("family_member_id", member.id)
      .order("created_at", { ascending: false });
    setSheetResults(data ?? []);
    setSheetLoading(false);
  }

  async function openViewMe() {
    setSheetMember(null);
    setSheetOpen(true);
    setSheetLoading(true);
    const { data } = await supabase
      .from("test_results")
      .select("id, content, created_at")
      .eq("user_id", userId)
      .is("family_member_id", null)
      .order("created_at", { ascending: false });
    setSheetResults(data ?? []);
    setSheetLoading(false);
  }

  // Edit-me dialog state
  const [meDialogOpen, setMeDialogOpen] = useState(false);
  const [meLoading, setMeLoading] = useState(false);
  const parsedLifestyle = (() => {
    try { return JSON.parse(profile?.lifestyle || "{}"); } catch { return {}; }
  })();
  const [meForm, setMeForm] = useState({
    name: profile?.name || "",
    age: profile?.age != null ? String(profile.age) : "",
    sex: profile?.sex || "",
    exercise: parsedLifestyle.exercise || "",
    smoking: parsedLifestyle.smoking || "",
    alcohol: parsedLifestyle.alcohol || "",
    diet: parsedLifestyle.diet || "",
    conditions: healthHistory?.current_conditions || [] as string[],
    notes: profile?.notes || "",
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (member: FamilyMember) => {
    setEditingId(member.id);
    setForm({
      relation: member.relation,
      name: member.name || "",
      age: member.age != null ? String(member.age) : "",
      isAlive: member.is_alive,
      ageAtDeath: member.age_at_death != null ? String(member.age_at_death) : "",
      causeOfDeath: member.cause_of_death || "",
      conditions: member.condition_list || [],
      smoking: member.smoking || "",
      alcohol: member.alcohol || "",
      notes: member.notes || "",
    });
    setDialogOpen(true);
  };

  function toggleCondition(c: string) {
    setForm((prev) =>
      prev.conditions.includes(c)
        ? { ...prev, conditions: prev.conditions.filter((x) => x !== c) }
        : { ...prev, conditions: [...prev.conditions, c] }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please sign in again");
        return;
      }
      const payload = {
        relation: form.relation,
        name: form.name || null,
        age: form.age ? parseInt(form.age, 10) : null,
        age_at_death: form.ageAtDeath ? parseInt(form.ageAtDeath, 10) : null,
        is_alive: form.isAlive,
        condition_list: form.conditions,
        cause_of_death: form.causeOfDeath || null,
        smoking: form.smoking || null,
        alcohol: form.alcohol || null,
        notes: form.notes || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("family_members")
          .update(payload)
          .eq("id", editingId)
          .eq("user_id", user.id);
        if (error) throw error;
        toast.success("Family member updated");
      } else {
        if (!form.relation) {
          toast.error("Please select a relationship");
          return;
        }
        const { error } = await supabase
          .from("family_members")
          .insert({ user_id: user.id, ...payload });
        if (error) throw error;
        toast.success("Family member added");
      }
      setDialogOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : (err as {message?: string})?.message ?? "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleMeSave(e: React.FormEvent) {
    e.preventDefault();
    setMeLoading(true);
    try {
      const lifestyle = JSON.stringify({ exercise: meForm.exercise, smoking: meForm.smoking, alcohol: meForm.alcohol, diet: meForm.diet });

      // Upsert user profile (handles both new and existing rows)
      const { error: profileError } = await supabase
        .from("users")
        .upsert({
          id: userId,
          name: meForm.name || null,
          age: meForm.age ? parseInt(meForm.age, 10) : null,
          sex: meForm.sex || null,
          lifestyle,
          notes: meForm.notes || null,
          onboarding_completed: true,
        }, { onConflict: "id" });
      if (profileError) throw new Error(profileError.message);

      // Update health history if exists, insert if not
      const { data: existing } = await supabase
        .from("health_history")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (existing) {
        const { error: historyError } = await supabase
          .from("health_history")
          .update({ current_conditions: meForm.conditions })
          .eq("user_id", userId);
        if (historyError) throw new Error(historyError.message);
      } else {
        const { error: historyError } = await supabase
          .from("health_history")
          .insert({ user_id: userId, current_conditions: meForm.conditions });
        if (historyError) throw new Error(historyError.message);
      }

      toast.success("Profile updated");
      setMeDialogOpen(false);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setMeLoading(false);
    }
  }

  async function handleRemove(member: FamilyMember) {
    if (!confirm(`Remove ${member.name || member.relation} from your family?`)) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase
        .from("family_members")
        .delete()
        .eq("id", member.id)
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Family member removed");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const maternalGP = familyMembers.filter((m) => m.relation.includes("Maternal"));
  const paternalGP = familyMembers.filter((m) => m.relation.includes("Paternal"));
  const parents = familyMembers.filter((m) =>
    ["Mother", "Father", "Adoptive Mother", "Adoptive Father", "Stepmother", "Stepfather"].includes(m.relation)
  );
  const siblings = familyMembers.filter((m) =>
    ["Sister", "Brother", "Half-Sister", "Half-Brother", "Stepsister", "Stepbrother"].includes(m.relation)
  );
  const children = familyMembers.filter((m) =>
    ["Daughter", "Son", "Adopted Daughter", "Adopted Son", "Stepdaughter", "Stepson"].includes(m.relation)
  );
  const grandchildren = familyMembers.filter((m) =>
    ["Granddaughter", "Grandson"].includes(m.relation)
  );
  const partners = familyMembers.filter((m) =>
    ["Partner", "Spouse"].includes(m.relation)
  );
  const extended = familyMembers.filter((m) =>
    ["Aunt", "Uncle", "Niece", "Nephew", "Cousin"].includes(m.relation)
  );
  const categorised = new Set([
    ...maternalGP, ...paternalGP, ...parents, ...siblings,
    ...children, ...grandchildren, ...partners, ...extended,
  ].map((m) => m.id));
  const other = familyMembers.filter((m) => !categorised.has(m.id));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Family Tree</h1>
          <p className="text-muted-foreground">
            Visual overview of your family health history
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          Add family member
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-8">
        <div className="flex flex-col items-center space-y-10">
          {/* Grandparents */}
          {(maternalGP.length > 0 || paternalGP.length > 0) && (
            <div>
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Grandparents
              </p>
              <div className="flex flex-wrap justify-center gap-8">
                {maternalGP.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onEdit={() => openEdit(m)}
                    onRemove={() => handleRemove(m)}
                    onView={() => openView(m)}
                  />
                ))}
                {paternalGP.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onEdit={() => openEdit(m)}
                    onRemove={() => handleRemove(m)}
                    onView={() => openView(m)}
                  />
                ))}
              </div>
            </div>
          )}

          {(maternalGP.length > 0 || paternalGP.length > 0) && (
            <div className="h-8 w-px bg-border" />
          )}

          {/* Parents */}
          {parents.length > 0 && (
            <div>
              <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Parents
              </p>
              <div className="flex justify-center gap-12">
                {parents.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onEdit={() => openEdit(m)}
                    onRemove={() => handleRemove(m)}
                    onView={() => openView(m)}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-border" />

          {/* You */}
          <div className="group relative flex flex-col items-center">
            <button onClick={openViewMe} className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10 hover:opacity-80 transition-opacity">
              <Heart className="h-8 w-8 text-primary" />
            </button>
            <button onClick={openViewMe} className="mt-2 text-sm font-bold hover:underline">{profile?.name || "You"}</button>
            {profile?.age != null && (
              <p className="text-xs text-muted-foreground">Age {profile.age}</p>
            )}
            {healthHistory?.current_conditions && healthHistory.current_conditions.length > 0 && (
              <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                {healthHistory.current_conditions.map((c) => (
                  <span key={c} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600">{c}</span>
                ))}
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-0 right-0 h-8 w-8 -translate-y-1 translate-x-6 opacity-70 group-hover:opacity-100"
              onClick={() => {
                const pl = (() => { try { return JSON.parse(profile?.lifestyle || "{}"); } catch { return {}; } })();
                setMeForm({
                  name: profile?.name || "",
                  age: profile?.age != null ? String(profile.age) : "",
                  sex: profile?.sex || "",
                  exercise: pl.exercise || "",
                  smoking: pl.smoking || "",
                  alcohol: pl.alcohol || "",
                  diet: pl.diet || "",
                  conditions: healthHistory?.current_conditions || [],
                  notes: profile?.notes || "",
                });
                setMeDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Siblings */}
          {siblings.length > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Siblings
                </p>
                <div className="flex flex-wrap justify-center gap-8">
                  {siblings.map((m) => (
                    <MemberCard
                      key={m.id}
                      member={m}
                      onEdit={() => openEdit(m)}
                      onRemove={() => handleRemove(m)}
                      onView={() => openView(m)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Children */}
          {children.length > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Children
                </p>
                <div className="flex flex-wrap justify-center gap-8">
                  {children.map((m) => (
                    <MemberCard
                      key={m.id}
                      member={m}
                      onEdit={() => openEdit(m)}
                      onRemove={() => handleRemove(m)}
                      onView={() => openView(m)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Grandchildren */}
          {grandchildren.length > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grandchildren</p>
                <div className="flex flex-wrap justify-center gap-8">
                  {grandchildren.map((m) => (
                    <MemberCard key={m.id} member={m} onEdit={() => openEdit(m)} onRemove={() => handleRemove(m)} onView={() => openView(m)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Partners */}
          {partners.length > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Partner / Spouse</p>
                <div className="flex flex-wrap justify-center gap-8">
                  {partners.map((m) => (
                    <MemberCard key={m.id} member={m} onEdit={() => openEdit(m)} onRemove={() => handleRemove(m)} onView={() => openView(m)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Extended family */}
          {extended.length > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Extended Family</p>
                <div className="flex flex-wrap justify-center gap-8">
                  {extended.map((m) => (
                    <MemberCard key={m.id} member={m} onEdit={() => openEdit(m)} onRemove={() => handleRemove(m)} onView={() => openView(m)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Other / uncategorised */}
          {other.length > 0 && (
            <>
              <div className="h-8 w-px bg-border" />
              <div>
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Other</p>
                <div className="flex flex-wrap justify-center gap-8">
                  {other.map((m) => (
                    <MemberCard key={m.id} member={m} onEdit={() => openEdit(m)} onRemove={() => handleRemove(m)} onView={() => openView(m)} />
                  ))}
                </div>
              </div>
            </>
          )}

          {familyMembers.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No family members yet. Click &quot;Add family member&quot; to get started.
            </p>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit family member" : "Add family member"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Relationship</Label>
              <Select
                value={form.relation}
                onValueChange={(v) => setForm((p) => ({ ...p, relation: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                placeholder="e.g. Jane"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="alive"
                checked={form.isAlive}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, isAlive: !!v }))
                }
              />
              <Label htmlFor="alive" className="text-sm font-normal">
                Currently alive
              </Label>
            </div>
            {form.isAlive ? (
              <div>
                <Label htmlFor="age">Age (optional)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="e.g. 65"
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="ageAtDeath">Age at death</Label>
                  <Input
                    id="ageAtDeath"
                    type="number"
                    placeholder="e.g. 72"
                    value={form.ageAtDeath}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, ageAtDeath: e.target.value }))
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="cause">Cause of death (optional)</Label>
                  <Input
                    id="cause"
                    placeholder="e.g. Heart disease"
                    value={form.causeOfDeath}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, causeOfDeath: e.target.value }))
                    }
                    className="mt-1.5"
                  />
                </div>
              </>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Smoking</Label>
                <Select value={form.smoking} onValueChange={(v) => setForm((p) => ({ ...p, smoking: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="ex-smoker">Ex-smoker</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alcohol</Label>
                <Select value={form.alcohol} onValueChange={(v) => setForm((p) => ({ ...p, alcohol: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Had a heart attack at 60, takes blood pressure medication, diagnosed with type 2 diabetes in 2018..."
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">Claude will use this to inform health recommendations.</p>
            </div>
                    <div>
                      <Label className="mb-2 block">Known conditions (optional)</Label>
                      <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                        {CONDITION_LABELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCondition(c)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      form.conditions.includes(c)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : editingId ? "Save changes" : "Add member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {sheetMember ? (sheetMember.name || sheetMember.relation) : (profile?.name || "You")}
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Conditions */}
            {(sheetMember ? sheetMember.condition_list : []).length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {(sheetMember?.condition_list ?? []).map((c) => (
                    <span key={c} className="rounded-full bg-red-50 px-3 py-1 text-xs text-red-600">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {sheetMember?.notes && (
              <div>
                <p className="mb-1 text-sm font-medium">Notes</p>
                <p className="text-sm text-muted-foreground">{sheetMember.notes}</p>
              </div>
            )}

            {/* Documents */}
            <div>
              <p className="mb-3 text-sm font-medium">Documents</p>
              {sheetLoading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : sheetResults.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-3">
                  {sheetResults.map((r) => {
                    let parsed: { summary?: string; date?: string; conditions?: string[]; test_results?: { name: string; value: string; unit?: string; flag?: string }[] } = {};
                    try { parsed = JSON.parse(r.content); } catch {}
                    return (
                      <div key={r.id} className="rounded-xl border bg-card p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{parsed.summary || "Document"}</p>
                            <p className="text-xs text-muted-foreground">
                              {parsed.date || new Date(r.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {parsed.conditions && parsed.conditions.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {parsed.conditions.map((c) => (
                              <span key={c} className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] text-red-600">{c}</span>
                            ))}
                          </div>
                        )}
                        {parsed.test_results && parsed.test_results.length > 0 && (
                          <div className="space-y-1">
                            {parsed.test_results.map((t, i) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-muted-foreground">{t.name}</span>
                                <span className={t.flag === "high" || t.flag === "low" ? "font-semibold text-red-600" : ""}>
                                  {t.value}{t.unit ? ` ${t.unit}` : ""}{t.flag ? ` (${t.flag})` : ""}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Me Dialog */}
      <Dialog open={meDialogOpen} onOpenChange={setMeDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit your profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMeSave} className="space-y-4">
            <div>
              <Label htmlFor="me-name">Name</Label>
              <Input
                id="me-name"
                value={meForm.name}
                onChange={(e) => setMeForm((p) => ({ ...p, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="me-age">Age</Label>
                <Input
                  id="me-age"
                  type="number"
                  value={meForm.age}
                  onChange={(e) => setMeForm((p) => ({ ...p, age: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Biological sex</Label>
                <Select value={meForm.sex} onValueChange={(v) => setMeForm((p) => ({ ...p, sex: v }))}>
                  <SelectTrigger className="mt-1.5">
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Exercise</Label>
                <Select value={meForm.exercise} onValueChange={(v) => setMeForm((p) => ({ ...p, exercise: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">Sedentary</SelectItem>
                    <SelectItem value="light">Light (2–4x/month)</SelectItem>
                    <SelectItem value="moderate">Moderate (1–2x/week)</SelectItem>
                    <SelectItem value="active">Active (3+/week)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Smoking</Label>
                <Select value={meForm.smoking} onValueChange={(v) => setMeForm((p) => ({ ...p, smoking: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="ex-smoker">Ex-smoker</SelectItem>
                    <SelectItem value="occasional">Occasional</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Alcohol</Label>
                <Select value={meForm.alcohol} onValueChange={(v) => setMeForm((p) => ({ ...p, alcohol: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Diet</Label>
                <Select value={meForm.diet} onValueChange={(v) => setMeForm((p) => ({ ...p, diet: v }))}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-restrictions">No restrictions</SelectItem>
                    <SelectItem value="vegetarian">Vegetarian</SelectItem>
                    <SelectItem value="vegan">Vegan</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Current conditions</Label>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto">
                {CONDITION_LABELS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setMeForm((p) => ({
                      ...p,
                      conditions: p.conditions.includes(c)
                        ? p.conditions.filter((x) => x !== c)
                        : [...p.conditions, c],
                    }))}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      meForm.conditions.includes(c)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="me-notes">Notes (optional)</Label>
              <textarea
                id="me-notes"
                value={meForm.notes}
                onChange={(e) => setMeForm((p) => ({ ...p, notes: e.target.value }))}
                placeholder="e.g. Had my appendix removed in 2019, occasional migraines, takes vitamin D supplements..."
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px] resize-none"
              />
              <p className="mt-1 text-xs text-muted-foreground">Claude will use this to inform health recommendations.</p>
            </div>
            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setMeDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={meLoading}>
                {meLoading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
