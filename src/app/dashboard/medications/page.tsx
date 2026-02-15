import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import MedicationsClient from "./medications-client";

export default async function MedicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: healthHistory } = await supabase
    .from("health_history")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: familyMembers } = await supabase
    .from("family_members")
    .select("*")
    .eq("user_id", user.id);

  return (
    <MedicationsClient
      healthHistory={healthHistory}
      familyMembers={familyMembers || []}
    />
  );
}
