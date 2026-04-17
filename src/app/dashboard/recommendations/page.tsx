import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RecommendationsClient from "./recommendations-client";

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return <RecommendationsClient />;
}
