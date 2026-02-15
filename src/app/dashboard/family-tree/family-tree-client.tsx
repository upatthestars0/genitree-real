"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Heart, Plus, MoreVertical } from "lucide-react";
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
  "Mother",
  "Father",
  "Sister",
  "Brother",
  "Son",
  "Daughter",
];

interface FamilyMember {
  id: string;
  relation: string;
  name: string | null;
  age: number | null;
  age_at_death: number | null;
  is_alive: boolean;
  condition_list: string[];
  condition_details?: { id: string; label: string; category?: string; subtype?: string; age_at_diagnosis?: number; notes?: string }[] | null;
  cause_of_death: string | null;
}

interface Profile {
  name: string;
  age: number | null;
}

const emptyForm = () => ({
  relation: "",
  name: "",
  age: "",
  isAlive: true,
  ageAtDeath: "",
  causeOfDeath: "",
  conditions: [] as string[],
});

function MemberCard({
  member,
  onEdit,
  onRemove,
}: {
  member: FamilyMember;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="group relative flex flex-col items-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full border-2 ${
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
      </div>
      <p className="mt-2 text-sm font-semibold">
        {member.name || member.relation}
      </p>
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
}: {
  profile: Profile | null;
  familyMembers: FamilyMember[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

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
      const conditionDetails = form.conditions.map((label) => {
        const opt = ALL_CONDITIONS.find((c) => c.label === label);
        return {
          id: opt?.id ?? label,
          label,
          ...(opt?.category && { category: opt.category }),
        };
      });
      const payload = {
        relation: form.relation,
        name: form.name || null,
        age: form.age ? parseInt(form.age, 10) : null,
        age_at_death: form.ageAtDeath ? parseInt(form.ageAtDeath, 10) : null,
        is_alive: form.isAlive,
        condition_list: form.conditions,
        condition_details: conditionDetails,
        cause_of_death: form.causeOfDeath || null,
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
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
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

  const grandparents = familyMembers.filter((m) =>
    m.relation.includes("Grand")
  );
  const maternalGP = grandparents.filter((m) =>
    m.relation.includes("Maternal")
  );
  const paternalGP = grandparents.filter((m) =>
    m.relation.includes("Paternal")
  );
  const parents = familyMembers.filter(
    (m) => m.relation === "Mother" || m.relation === "Father"
  );
  const siblings = familyMembers.filter(
    (m) => m.relation === "Sister" || m.relation === "Brother"
  );
  const children = familyMembers.filter(
    (m) => m.relation === "Son" || m.relation === "Daughter"
  );

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
                  />
                ))}
                {paternalGP.map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    onEdit={() => openEdit(m)}
                    onRemove={() => handleRemove(m)}
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
                  />
                ))}
              </div>
            </div>
          )}

          <div className="h-8 w-px bg-border" />

          {/* You */}
          <div className="flex flex-col items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <p className="mt-2 text-sm font-bold">
              {profile?.name || "You"}
            </p>
            {profile?.age != null && (
              <p className="text-xs text-muted-foreground">
                Age {profile.age}
              </p>
            )}
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
                    />
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
    </div>
  );
}
