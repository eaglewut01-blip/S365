"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, isStaffRole } from "@/lib/session";
import type { VisitActivity } from "@/types/database";

export type DoorEvent = {
  id: string;
  at: string;
  type: "checkin" | "blocked";
  memberId: string;
  name: string;
  activity: VisitActivity | null;
  expiresOn: string | null;
  reason: "expired" | "frozen" | "no_package" | null;
};

// What happened at the door since `since`: check-ins and scans that were
// turned away. Polled by the back office so staff see each scan as it happens.
export async function doorEventsSince(since: string): Promise<DoorEvent[]> {
  const profile = await getCurrentProfile();
  if (!profile || !isStaffRole(profile.role) || !profile.branch_id) return [];

  // Never look back further than 15 minutes, whatever the browser asks for.
  const floor = Date.now() - 15 * 60 * 1000;
  const asked = Date.parse(since);
  const from = new Date(Number.isFinite(asked) ? Math.max(asked, floor) : floor).toISOString();

  const supabase = await createClient();
  const [checkins, attempts] = await Promise.all([
    supabase
      .from("checkins")
      .select("id, checked_in_at, activity, member:members(id, name, membership_expires_on)")
      .eq("branch_id", profile.branch_id)
      .gt("checked_in_at", from)
      .order("checked_in_at")
      .limit(20),
    supabase
      .from("checkin_attempts")
      .select("id, created_at, reason, member:members(id, name, membership_expires_on)")
      .eq("branch_id", profile.branch_id)
      .gt("created_at", from)
      .order("created_at")
      .limit(20),
  ]);

  type MemberRef = { id: string; name: string; membership_expires_on: string | null } | null;
  const events: DoorEvent[] = [];
  for (const row of (checkins.data ?? []) as unknown as { id: string; checked_in_at: string; activity: VisitActivity | null; member: MemberRef }[]) {
    if (!row.member) continue;
    events.push({ id: `c-${row.id}`, at: row.checked_in_at, type: "checkin", memberId: row.member.id, name: row.member.name, activity: row.activity, expiresOn: row.member.membership_expires_on, reason: null });
  }
  for (const row of (attempts.data ?? []) as unknown as { id: string; created_at: string; reason: DoorEvent["reason"]; member: MemberRef }[]) {
    if (!row.member) continue;
    events.push({ id: `a-${row.id}`, at: row.created_at, type: "blocked", memberId: row.member.id, name: row.member.name, activity: null, expiresOn: row.member.membership_expires_on, reason: row.reason });
  }
  return events.sort((a, b) => a.at.localeCompare(b.at));
}
