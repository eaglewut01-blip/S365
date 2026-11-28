import { requireRole } from "@/lib/session";
import { adminKeyProblem, createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginNameOf } from "@/lib/staff-login";
import type { Profile } from "@/types/database";
import { TeamClient } from "./TeamClient";

export const metadata = { title: "ทีมงาน | S365 Fitness" };

export default async function TeamPage() {
  const owner = await requireRole("owner");
  const supabase = await createClient();

  const { data: team } = await supabase
    .from("profiles")
    .select("*")
    .eq("branch_id", owner.branch_id ?? "")
    .in("role", ["staff", "trainer"])
    .order("full_name");

  // What each person signs in with. Only the owner sees this page.
  const logins: Record<string, string> = {};
  const adminProblem = await adminKeyProblem();
  if (!adminProblem) {
    const { data } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const user of data?.users ?? []) logins[user.id] = loginNameOf(user.email);
  }

  const { data: gone } = await supabase.from("profiles").select("*").eq("branch_id", owner.branch_id ?? "").eq("role", "left").order("full_name");

  const { data: waiting } = await supabase
    .from("profiles")
    .select("*")
    .eq("branch_id", owner.branch_id ?? "")
    .eq("role", "pending")
    .order("created_at");

  return <TeamClient team={(team ?? []) as Profile[]} waiting={(waiting ?? []) as Profile[]} gone={(gone ?? []) as Profile[]} logins={logins} adminProblem={adminProblem} />;
}
