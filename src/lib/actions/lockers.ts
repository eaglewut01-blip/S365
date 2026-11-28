"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";

type Result = { error?: string; success?: boolean };
const ZONE_LABEL = { female: "หญิง", male: "ชาย" } as const;
const NOT_READY = "ยังใช้ล็อกเกอร์ไม่ได้ ต้องรันคำสั่งฐานข้อมูลรอบล่าสุดก่อน";

// Counter staff hand a locker key to a member.
export async function lendLocker(memberId: string, zone: string, number: number): Promise<Result> {
  const staffer = await requireRole("owner", "staff");
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  if (!memberId) return { error: "เลือกลูกค้า" };
  if (zone !== "female" && zone !== "male") return { error: "เลือกตู้หญิงหรือตู้ชาย" };
  if (!Number.isInteger(number) || number < 1 || number > 999) return { error: "ใส่เลขตู้" };

  const supabase = await createClient();
  const { data: holding, error: readError } = await supabase.from("locker_loans").select("zone, number").eq("member_id", memberId).is("returned_at", null).limit(1);
  if (readError) return { error: NOT_READY };
  if (holding && holding.length > 0) {
    const held = holding[0] as { zone: "female" | "male"; number: number };
    return { error: `ลูกค้าคนนี้ยืมตู้${ZONE_LABEL[held.zone]} ${held.number} อยู่ ให้รับคืนก่อน` };
  }

  const { error } = await supabase.from("locker_loans").insert({ branch_id: staffer.branch_id, member_id: memberId, zone, number, lent_by: staffer.id });
  // The database allows one open loan per locker.
  if (error) return { error: error.code === "23505" ? `ตู้${ZONE_LABEL[zone]} ${number} มีคนยืมอยู่` : error.message };
  revalidatePath("/owner/checkin");
  return { success: true };
}

// The key came back.
export async function returnLocker(loanId: string): Promise<Result> {
  await requireRole("owner", "staff");
  const supabase = await createClient();
  const { error } = await supabase.from("locker_loans").update({ returned_at: new Date().toISOString() }).eq("id", loanId).is("returned_at", null);
  if (error) return { error: error.message };
  revalidatePath("/owner/checkin");
  return { success: true };
}

// Owner: how many lockers there are, so the counter can tap a number.
export async function setLockerCounts(female: number, male: number): Promise<Result> {
  const owner = await requireRole("owner");
  if (!owner.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const ok = (n: number) => Number.isInteger(n) && n >= 0 && n <= 300;
  if (!ok(female) || !ok(male)) return { error: "จำนวนตู้ต้องเป็นตัวเลข 0 ถึง 300" };
  const supabase = await createClient();
  const { error } = await supabase.from("branches").update({ lockers_female: female, lockers_male: male }).eq("id", owner.branch_id);
  if (error) return { error: NOT_READY };
  revalidatePath("/owner/checkin");
  return { success: true };
}
