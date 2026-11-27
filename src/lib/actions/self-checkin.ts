"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { VisitActivity } from "@/types/database";

export type CheckinResult =
  | { ok: false; reason: "bad_link" | "bad_phone" | "not_found" | "ask_staff" | "error" }
  | {
      ok: true;
      new: boolean;
      name: string;
      checked_in_at: string;
      activity: VisitActivity | null;
      expires_on: string | null;
      days_left: number | null;
      frozen: boolean;
      pt_total: number;
      pt_remaining: number;
      promotions: { title: string; body: string }[];
    };

// A member checks themselves in from the front-desk QR code. No sign-in:
// the QR's secret and the registered phone number are checked by the
// database function, which is all a visitor is allowed to call.
export async function selfCheckin(_prev: CheckinResult | null, formData: FormData): Promise<CheckinResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("self_checkin", {
    p_token: String(formData.get("k") || ""),
    p_phone: String(formData.get("phone") || ""),
    p_activity: String(formData.get("activity") || "") || null,
  });
  if (error || !data) return { ok: false, reason: "error" };
  if (data.ok && data.new) revalidatePath("/tools/crowd");
  return data as CheckinResult;
}

// Owner: make the QR secret for this branch, or replace it. Replacing it
// stops every poster printed before from working.
export async function resetCheckinToken(): Promise<{ error?: string; success?: boolean }> {
  const owner = await requireRole("owner");
  if (!owner.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({ checkin_token: randomBytes(18).toString("base64url") })
    .eq("id", owner.branch_id);
  if (error) return { error: error.message };
  revalidatePath("/owner/checkin/qr");
  return { success: true };
}
