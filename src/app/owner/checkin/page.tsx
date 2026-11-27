import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { startOfTodayBangkok } from "@/lib/dates";
import type { Member } from "@/types/database";
import { CheckInClient, type AttemptRow, type CheckinRow } from "./CheckInClient";

export default async function CheckInPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const startOfDay = startOfTodayBangkok();

  const [{ data: members }, { data: checkins }, { data: attempts }] = await Promise.all([
    supabase.from("members").select("*").eq("branch_id", branchId).eq("status", "active").order("name"),
    supabase
      .from("checkins")
      .select("*, member:members(id, name, membership_expires_on)")
      .eq("branch_id", branchId)
      .gte("checked_in_at", startOfDay.toISOString())
      .order("checked_in_at", { ascending: false }),
    supabase
      .from("checkin_attempts")
      .select("id, created_at, reason, member:members(id, name, membership_expires_on)")
      .eq("branch_id", branchId)
      .gte("created_at", startOfDay.toISOString())
      .order("created_at", { ascending: false }),
  ]);

  return (
    <CheckInClient
      members={(members ?? []) as Member[]}
      checkins={(checkins ?? []) as unknown as CheckinRow[]}
      attempts={(attempts ?? []) as unknown as AttemptRow[]}
    />
  );
}
