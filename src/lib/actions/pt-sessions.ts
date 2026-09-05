"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";

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
    session_date: new Date().toISOString().slice(0, 10),
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
