import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResultsClient from "./results-client";

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ who?: string }>;
}) {
  const supabase = await createClient();
  const { who: whoParam } = await searchParams;
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
    .select("id, relation, name")
    .eq("user_id", user.id);

  const children = (familyMembers || []).filter((m) =>
    ["Son", "Daughter"].includes(m.relation)
  );

  let query = supabase
    .from("test_results")
    .select("id, user_id, family_member_id, type, content, file_path, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (whoParam && whoParam !== "me") {
    query = query.eq("family_member_id", whoParam);
  } else {
    query = query.is("family_member_id", null);
  }

  const { data: results } = await query;

  const whoOptions = [
    { id: "me", label: "Me" },
    ...children.map((c) => ({ id: c.id, label: c.name || c.relation })),
  ];

  return (
    <ResultsClient
      results={results || []}
      whoOptions={whoOptions}
      preselectedWho={whoParam || "me"}
    />
  );
}
