"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, FileText, MessageCircle, Pencil, Plus, X } from "lucide-react";
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
  ALL_CONDITIONS,
  getConditionLabel,
  type ConditionDetail,
  type ConditionOption,
} from "@/lib/conditions";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Child {
  id: string;
  relation: string;
  name: string | null;
  age: number | null;
  is_alive: boolean;
  condition_list: string[];
  condition_details?: ConditionDetail[] | null;
}

export default function ChildrenClient({
  children,
  resultsCountByChild,
}: {
  children: Child[];
  resultsCountByChild: Record<string, number>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editChild, setEditChild] = useState<Child | null>(null);
  const [conditionSearch, setConditionSearch] = useState("");
  const [selectedCondition, setSelectedCondition] = useState<ConditionOption | null>(null);
  const [followUpSubtype, setFollowUpSubtype] = useState("");
  const [followUpAge, setFollowUpAge] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const conditionDetails = editChild?.condition_details ?? [];
  const displayConditions =
    conditionDetails.length > 0
      ? conditionDetails.map((d) => (d.subtype ? `${d.label} (${d.subtype})` : d.label))
      : editChild?.condition_list ?? [];

  const filteredConditions = ALL_CONDITIONS.filter(
    (c) =>
      !displayConditions.some((d) => d === c.label || d.startsWith(c.label + " (")) &&
      (conditionSearch === "" || c.label.toLowerCase().includes(conditionSearch.toLowerCase()))
  );

  async function addConditionToChild() {
    if (!selectedCondition || !editChild) return;
    setSaving(true);
    try {
      const opt = ALL_CONDITIONS.find((c) => c.id === selectedCondition.id);
      const category = opt?.category ?? opt?.label;
      const newEntry: ConditionDetail = {
        id: selectedCondition.id,
        label: selectedCondition.label,
        ...(category && { category }),
        ...(followUpSubtype && { subtype: followUpSubtype }),
        ...(followUpAge && { age_at_diagnosis: parseInt(followUpAge, 10) }),
        ...(followUpNotes && { notes: followUpNotes }),
      };
      const nextDetails = [...conditionDetails, newEntry];
      const nextCurrent = [
        ...(editChild.condition_list ?? []),
        category || selectedCondition.label,
      ];
      const { error } = await supabase
        .from("family_members")
        .update({
          condition_list: nextCurrent,
          condition_details: nextDetails,
        })
        .eq("id", editChild.id);
      if (error) throw error;
      toast.success("Condition added");
      setSelectedCondition(null);
      setFollowUpSubtype("");
      setFollowUpAge("");
      setFollowUpNotes("");
      router.refresh();
      setEditChild((prev) =>
        prev
          ? {
              ...prev,
              condition_list: nextCurrent,
              condition_details: nextDetails,
            }
          : null
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setSaving(false);
    }
  }

  async function removeConditionFromChild(index: number) {
    if (!editChild) return;
    const next = conditionDetails.filter((_, i) => i !== index);
    const nextCurrent = next.map((d) => d.category || d.label);
    try {
      const { error } = await supabase
        .from("family_members")
        .update({ condition_list: nextCurrent, condition_details: next })
        .eq("id", editChild.id);
      if (error) throw error;
      toast.success("Removed");
      router.refresh();
      setEditChild((prev) =>
        prev ? { ...prev, condition_list: nextCurrent, condition_details: next } : null
      );
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

  if (children.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Children</h1>
          <p className="text-muted-foreground">
            Track tests and results for each child
          </p>
        </div>
        <div className="rounded-xl border border-dashed bg-muted/30 p-10 text-center">
          <User className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 font-medium">No children added yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your children in the Family Tree or during onboarding. You can
            set up their profiles and track their tests here.
          </p>
          <Link href="/dashboard/family-tree" className="mt-4 inline-block">
            <Button variant="outline">Go to Family Tree</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Children</h1>
        <p className="text-muted-foreground">
          Tests, results, and health details for each child
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {children.map((child) => (
          <div
            key={child.id}
            className="flex flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{child.name || child.relation}</h2>
                <p className="text-sm text-muted-foreground">
                  {child.relation}
                  {child.age != null && ` · Age ${child.age}`}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditChild(child)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit health
              </Button>
              <Link href={`/dashboard/results?who=${child.id}`}>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Results
                  {(resultsCountByChild[child.id] ?? 0) > 0 && (
                    <span className="rounded bg-primary/20 px-1.5 text-xs">
                      {resultsCountByChild[child.id]}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href={`/dashboard/ask?who=${child.id}`}>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Ask about {child.name || "them"}
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Edit child health dialog */}
      <Dialog open={!!editChild} onOpenChange={(open) => !open && setEditChild(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editChild ? `${editChild.name || editChild.relation} – health` : ""}
            </DialogTitle>
          </DialogHeader>
          {editChild && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-medium">Conditions</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedCondition(null);
                    setConditionSearch("");
                    setFollowUpSubtype("");
                    setFollowUpAge("");
                    setFollowUpNotes("");
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {displayConditions.map((c, i) => (
                  <span
                    key={`${c}-${i}`}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm"
                  >
                    {getConditionLabel(c)}
                    <button
                      type="button"
                      onClick={() => removeConditionFromChild(i)}
                      className="rounded-full p-0.5 hover:bg-primary/20"
                      aria-label="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {displayConditions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No conditions added. Add any that apply.
                  </p>
                )}
              </div>

              {!selectedCondition ? (
                <div>
                  <Label>Search or select condition</Label>
                  <Input
                    placeholder="e.g. anaemia, asthma"
                    value={conditionSearch}
                    onChange={(e) => setConditionSearch(e.target.value)}
                    className="mt-1"
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border p-2">
                    {filteredConditions.slice(0, 40).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCondition(c)}
                        className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted/60"
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm font-medium">
                    {selectedCondition.label}
                  </p>
                  {showFollowUps && (
                    <>
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
                            placeholder="e.g. 5"
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
                    </>
                  )}
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCondition(null)}
                    >
                      Back
                    </Button>
                    <Button
                      size="sm"
                      onClick={addConditionToChild}
                      disabled={saving || !canSubmitCondition}
                    >
                      {saving ? "Adding..." : "Add condition"}
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
