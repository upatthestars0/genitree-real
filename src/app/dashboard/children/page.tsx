import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ChildrenClient from "./children-client";

const CHILD_RELATIONS = ["Son", "Daughter"];

export default async function ChildrenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, relation, name, age, is_alive, condition_list, condition_details")
    .eq("user_id", user.id);

  const children = (familyMembers || []).filter((m) =>
    CHILD_RELATIONS.includes(m.relation)
  );

  const childIds = children.map((c) => c.id);
  const { data: resultsByChild } = await supabase
    .from("test_results")
    .select("id, family_member_id, type, content, created_at")
    .eq("user_id", user.id)
    .in("family_member_id", childIds.length ? childIds : ["__none__"])
    .order("created_at", { ascending: false });

  const resultsCountByChild: Record<string, number> = {};
  (resultsByChild || []).forEach((r) => {
    if (r.family_member_id) {
      resultsCountByChild[r.family_member_id] = (resultsCountByChild[r.family_member_id] || 0) + 1;
    }
  });

  return (
    <ChildrenClient
      children={children}
      resultsCountByChild={resultsCountByChild}
    />
  );
}
