"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { todayBangkok } from "@/lib/dates";
import { isSignature } from "@/lib/signature";

// Trainer logs that a session happened. Always starts "pending" — RLS
// enforces trainer_id = the logged-in trainer and status = 'pending'.
export async function logPtSession(formData: FormData) {
  const trainer = await requireRole("trainer");
  const supabase = await createClient();

  const memberId = String(formData.get("member_id") || "");
  const sessionTime = String(formData.get("session_time") || "");

  if (!memberId || !sessionTime) return { error: "กรอกข้อมูลให้ครบถ้วน" };
  if (!trainer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const { error } = await supabase.from("pt_sessions").insert({
    member_id: memberId,
    trainer_id: trainer.id,
    branch_id: trainer.branch_id,
    session_date: todayBangkok(),
    session_time: sessionTime,
    status: "pending",
  });

  if (error) return { error: error.message };

  revalidatePath("/trainer/pt-sessions");
  return { success: true };
}

// Member confirms the trainer's log — this is the ONLY action a customer
// can take here, and it's what decrements pt_remaining (via DB trigger).
export async function approvePtSession(sessionId: string) {
  await requireRole("member");
  const supabase = await createClient();

  const { error } = await supabase
    .from("pt_sessions")
    .update({ status: "approved" })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath("/member/pt-sessions");
  return { success: true };
}

// Member disputes the log — flags it for staff review, no hours deducted.
export async function disputePtSession(sessionId: string) {
  await requireRole("member");
  const supabase = await createClient();

  const { error } = await supabase
    .from("pt_sessions")
    .update({ status: "disputed" })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath("/member/pt-sessions");
  return { success: true };
}

// Staff/owner resolves a disputed session one way or the other.
export async function resolvePtDispute(sessionId: string, resolution: "approved" | "pending") {
  await requireRole("owner", "staff");
  const supabase = await createClient();

  const { error } = await supabase
    .from("pt_sessions")
    .update({ status: resolution })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  revalidatePath("/owner/pt-sessions");
  return { success: true };
}

const SIGN_PROBLEM: Record<string, string> = {
  not_allowed: "บัญชีนี้ยังไม่มีสิทธิ์ตัดชั่วโมง",
  no_signature: "ให้ลูกค้าเซ็นชื่อก่อน",
  not_found: "ไม่พบลูกค้าคนนี้",
  no_hours: "ลูกค้าคนนี้ไม่มีชั่วโมง PT เหลือแล้ว",
  just_signed: "ลูกค้าคนนี้เพิ่งเซ็นไปเมื่อไม่กี่นาทีนี้ ระบบตัดชั่วโมงให้แล้ว ไม่ตัดซ้ำ",
};

// The client signs on the trainer's phone after a session. One step records
// the session with the signature and takes one hour off (sign_pt_session).
export async function signPtSession(memberId: string, signature: string): Promise<{ error?: string; remaining?: number }> {
  await requireRole("trainer", "owner", "staff");
  if (!memberId) return { error: "เลือกลูกค้า" };
  if (!isSignature(signature)) return { error: SIGN_PROBLEM.no_signature };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sign_pt_session", { p_member: memberId, p_signature: signature });
  if (error) return { error: "ยังตัดชั่วโมงไม่ได้ แจ้งเจ้าของยิม (ฐานข้อมูลยังไม่ได้อัปเดต)" };

  const result = data as { ok: boolean; reason?: string; remaining?: number };
  if (!result?.ok) return { error: SIGN_PROBLEM[result?.reason ?? ""] ?? "ตัดชั่วโมงไม่สำเร็จ" };

  revalidatePath("/trainer/pt-sessions");
  revalidatePath("/owner/pt-sessions");
  return { remaining: result.remaining };
}

// Owner/staff: a session signed by mistake is removed and the hour returned.
export async function voidPtSession(sessionId: string): Promise<{ error?: string; success?: boolean }> {
  await requireRole("owner", "staff");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("void_pt_session", { p_session: sessionId });
  if (error || !(data as { ok?: boolean })?.ok) return { error: "ยกเลิกไม่สำเร็จ" };
  revalidatePath("/owner/pt-sessions");
  return { success: true };
}
