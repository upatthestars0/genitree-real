import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AddDataClient from "./add-data-client";

export default async function AddDataPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile && !profile.onboarding_completed) redirect("/onboarding");

  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("id, relation, name")
    .eq("user_id", user.id);

  const { data: recentResults } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <AddDataClient
      userId={user.id}
      familyMembers={familyMembers || []}
      recentResults={recentResults || []}
    />
  );
}
