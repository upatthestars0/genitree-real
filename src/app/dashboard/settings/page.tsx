import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./settings-client";

export default async function SettingsPage() {
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

  const { data: healthHistory } = await supabase
    .from("health_history")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <SettingsClient
      profile={profile}
      healthHistory={healthHistory}
      email={user.email || ""}
    />
  );
}
