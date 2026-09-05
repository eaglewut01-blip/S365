import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { TeamClient } from "./TeamClient";

export default async function TeamPage() {
  const owner = await requireRole("owner");
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("profiles")
    .select("*")
    .eq("branch_id", owner.branch_id ?? "")
    .in("role", ["staff", "trainer"])
    .order("full_name");

  return <TeamClient team={(team ?? []) as Profile[]} />;
}
