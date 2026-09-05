import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/database";
import { CheckInClient } from "./CheckInClient";

export default async function CheckInPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: members }, { data: checkins }] = await Promise.all([
    supabase.from("members").select("*").eq("branch_id", branchId).eq("status", "active").order("name"),
    supabase
      .from("checkins")
      .select("id, checked_in_at, member:members(name)")
      .eq("branch_id", branchId)
      .gte("checked_in_at", startOfDay.toISOString())
      .order("checked_in_at", { ascending: false }),
  ]);

  return (
    <CheckInClient
      members={(members ?? []) as Member[]}
      checkins={(checkins ?? []) as unknown as { id: string; checked_in_at: string; member: { name: string } }[]}
    />
  );
}
