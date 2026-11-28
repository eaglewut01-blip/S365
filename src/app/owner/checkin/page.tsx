import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { startOfTodayBangkok } from "@/lib/dates";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { Member } from "@/types/database";
import { CheckInClient, type AttemptRow, type CheckinRow } from "./CheckInClient";
import type { LockerLoan } from "./LockerPanel";

export default async function CheckInPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const startOfDay = startOfTodayBangkok();

  const [{ data: members }, { data: checkins }, { data: attempts }, loans, branch] = await Promise.all([
    fetchAll<Member>((from, to) =>
      supabase.from("members").select("*").eq("branch_id", branchId).eq("status", "active").order("name").order("id").range(from, to)
    ),
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
    supabase.from("locker_loans").select("id, zone, number, lent_at, member:members(id, name)").eq("branch_id", branchId).is("returned_at", null).order("zone").order("number"),
    supabase.from("branches").select("*").eq("id", branchId).maybeSingle(),
  ]);

  const lockerLoans: LockerLoan[] = ((loans.data ?? []) as unknown as { id: string; zone: "female" | "male"; number: number; lent_at: string; member: { id: string; name: string } | null }[]).map((l) => ({
    id: l.id,
    zone: l.zone,
    number: l.number,
    lentAt: l.lent_at,
    memberId: l.member?.id ?? "",
    memberName: l.member?.name ?? "-",
  }));
  const place = branch.data as { lockers_female?: number; lockers_male?: number } | null;

  return (
    <CheckInClient
      members={(members ?? []) as Member[]}
      checkins={(checkins ?? []) as unknown as CheckinRow[]}
      attempts={(attempts ?? []) as unknown as AttemptRow[]}
      lockers={{ loans: lockerLoans, counts: { female: place?.lockers_female ?? 0, male: place?.lockers_male ?? 0 }, notReady: Boolean(loans.error), isOwner: profile.role === "owner" }}
    />
  );
}
