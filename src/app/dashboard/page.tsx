import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
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
    .select("*")
    .eq("user_id", user.id);

  const { data: healthHistory } = await supabase
    .from("health_history")
    .select("id, user_id, current_conditions, condition_details, medications, allergies, surgeries")
    .eq("user_id", user.id)
    .single();

  const { data: myResultsData } = await supabase
    .from("test_results")
    .select("id, type, content, file_path, created_at")
    .eq("user_id", user.id)
    .is("family_member_id", null)
    .order("created_at", { ascending: false })
    .limit(5);
  const myResults = myResultsData ?? [];

  return (
    <DashboardClient
      profile={profile}
      familyMembers={familyMembers || []}
      healthHistory={healthHistory}
      myResults={myResults}
    />
  );
}
