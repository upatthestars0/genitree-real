import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import FamilyTreeClient from "./family-tree-client";

export default async function FamilyTreePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [profileRes, familyRes, historyRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("family_members").select("*").eq("user_id", user.id),
    supabase.from("health_history").select("*").eq("user_id", user.id).single(),
  ]);

  return (
    <FamilyTreeClient
      profile={profileRes.data}
      familyMembers={familyRes.data || []}
      healthHistory={historyRes.data}
      userId={user.id}
    />
  );
}
