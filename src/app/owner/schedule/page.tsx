import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/database";
import { ScheduleClient, type ClassWithBookings } from "./ScheduleClient";

export default async function SchedulePage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const [{ data: classes }, { data: members }, { data: trainers }] = await Promise.all([
    supabase
      .from("classes")
      .select("*, trainer:profiles(id, full_name), class_bookings(id, status, member:members(id, name))")
      .eq("branch_id", branchId)
      .order("day_of_week")
      .order("start_time"),
    supabase.from("members").select("*").eq("branch_id", branchId).order("name"),
    supabase.from("profiles").select("id, full_name").eq("branch_id", branchId).eq("role", "trainer"),
  ]);

  return (
    <ScheduleClient
      classes={(classes ?? []) as unknown as ClassWithBookings[]}
      members={(members ?? []) as Member[]}
      trainers={trainers ?? []}
    />
  );
}
