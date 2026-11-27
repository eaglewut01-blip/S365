"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { todayBangkok } from "@/lib/dates";
import type { VisitActivity } from "@/types/database";

export async function checkInMember(memberId: string, activity?: VisitActivity) {
  const staffer = await requireRole("owner", "staff");
  const supabase = await createClient();

  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const today = todayBangkok();

  const { error: checkinError } = await supabase.from("checkins").insert({
    member_id: memberId,
    branch_id: staffer.branch_id,
    ...(activity ? { activity } : {}),
  });
  if (checkinError) return { error: checkinError.message };

  const { data: member } = await supabase
    .from("members")
    .select("visit_count")
    .eq("id", memberId)
    .single();

  const { error: updateError } = await supabase
    .from("members")
    .update({ last_visit: today, visit_count: (member?.visit_count ?? 0) + 1 })
    .eq("id", memberId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/owner/checkin");
  return { success: true };
}
