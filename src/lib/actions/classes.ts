"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/lib/session";

export async function createClass(formData: FormData) {
  const staffer = await requireRole("owner", "staff");
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  // The teacher is typed in: who teaches a class changes from week to week.
  const instructor = String(formData.get("instructor_name") || "").trim();
  const dayOfWeek = Number(formData.get("day_of_week"));
  const startTime = String(formData.get("start_time") || "");
  const hours = Number(formData.get("hours") || 1);
  const capacity = Number(formData.get("capacity") || 30);

  if (!name || !startTime || Number.isNaN(dayOfWeek)) {
    return { error: "กรอกข้อมูลคลาสให้ครบถ้วน" };
  }
  if (!Number.isFinite(hours) || hours <= 0 || hours > 6) return { error: "จำนวนชั่วโมงไม่ถูกต้อง" };

  const base = { branch_id: staffer.branch_id, name, trainer_id: null, day_of_week: dayOfWeek, start_time: startTime, capacity };
  let { error } = await supabase.from("classes").insert({ ...base, instructor_name: instructor || null, duration_minutes: Math.round(hours * 60) });
  // Before the database update that adds teacher and length, save the class without them.
  if (error && /instructor_name|duration_minutes/.test(error.message)) ({ error } = await supabase.from("classes").insert(base));

  if (error) return { error: error.message };

  revalidatePath("/owner/schedule");
  return { success: true };
}

export async function deleteClass(classId: string) {
  await requireRole("owner", "staff");
  const supabase = await createClient();
  const { error } = await supabase.from("classes").delete().eq("id", classId);
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
