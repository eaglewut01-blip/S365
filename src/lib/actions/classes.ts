"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/lib/session";

export async function createClass(formData: FormData) {
  const staffer = await requireRole("owner", "staff");
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const trainerId = String(formData.get("trainer_id") || "") || null;
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") || "");
  const capacity = Number(formData.get("capacity") || 10);

  if (!name || !startTime || Number.isNaN(dayOfWeek)) {
    return { error: "กรอกข้อมูลคลาสให้ครบถ้วน" };
  }

  const { error } = await supabase.from("classes").insert({
    branch_id: staffer.branch_id,
    name,
    trainer_id: trainerId,
    day_of_week: dayOfWeek,
    start_time: startTime,
    capacity,
  });

  if (error) return { error: error.message };

  revalidatePath("/owner/schedule");
  return { success: true };
}

export async function bookClass(classId: string, memberId: string, path: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_class", {
    p_class_id: classId,
    p_member_id: memberId,
  });

  if (error) return { error: error.message };

  revalidatePath(path);
  return { success: true, status: data as "booked" | "waitlist" };
}

export async function cancelBooking(classId: string, memberId: string, path: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "กรุณาเข้าสู่ระบบ" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_booking", {
    p_class_id: classId,
    p_member_id: memberId,
  });

  if (error) return { error: error.message };

  revalidatePath(path);
  return { success: true };
}
