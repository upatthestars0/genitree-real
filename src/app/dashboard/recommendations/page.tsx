import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RecommendationsClient from "./recommendations-client";

export default async function RecommendationsPage() {
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

  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id);

  const { data: healthHistory } = await supabase
    .from("health_history")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <RecommendationsClient
      profile={profile}
      familyMembers={familyMembers || []}
      healthHistory={healthHistory}
    />
  );
}
