"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";

// Owner: make the secret inside the staff QR, or replace it. Replacing it
// stops every staff poster printed before from working.
export async function resetStaffToken(): Promise<{ error?: string; success?: boolean }> {
  const owner = await requireRole("owner");
  if (!owner.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();
  const { error } = await supabase.from("branch_secrets").upsert({ branch_id: owner.branch_id, staff_token: randomBytes(18).toString("base64url") });
  if (error) return { error: "ยังสร้างไม่ได้ ต้องรันคำสั่งฐานข้อมูลรอบล่าสุดก่อน" };
  revalidatePath("/owner/attendance/qr");
  return { success: true };
}
