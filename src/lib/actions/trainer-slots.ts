"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { WORK_HOURS } from "@/lib/labels";
import type { SlotKind } from "@/types/database";

const KINDS: SlotKind[] = ["pt", "trial", "free", "off"];

// A trainer saves their whole day at once. Staff can save a day on a
// trainer's behalf by sending that trainer's id.
export async function saveTrainerDay(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const profile = await requireRole("trainer", "owner", "staff");
  if (!profile.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const workDate = String(formData.get("work_date") || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return { error: "วันที่ไม่ถูกต้อง" };
  const trainerId = profile.role === "trainer" ? profile.id : String(formData.get("trainer_id") || "");
  if (!trainerId) return { error: "ไม่พบเทรนเนอร์" };

  const rows: { branch_id: string; trainer_id: string; work_date: string; hour: number; kind: SlotKind; client_name: string | null; updated_at: string }[] = [];
  const cleared: number[] = [];
  const now = new Date().toISOString();

  for (const hour of WORK_HOURS) {
    const kind = String(formData.get(`kind_${hour}`) || "") as SlotKind | "";
    if (!kind) {
      cleared.push(hour);
      continue;
    }
    if (!KINDS.includes(kind)) return { error: "ข้อมูลตารางไม่ถูกต้อง" };
    const client = String(formData.get(`client_${hour}`) || "").trim();
    rows.push({
      branch_id: profile.branch_id,
      trainer_id: trainerId,
      work_date: workDate,
      hour,
      kind,
      client_name: kind === "pt" || kind === "trial" ? client || null : null,
      updated_at: now,
    });
  }

  const supabase = await createClient();
  if (rows.length > 0) {
    const { error } = await supabase.from("trainer_slots").upsert(rows, { onConflict: "trainer_id,work_date,hour" });
    if (error) return { error: error.message };
  }
  if (cleared.length > 0) {
    const { error } = await supabase.from("trainer_slots").delete().eq("trainer_id", trainerId).eq("work_date", workDate).in("hour", cleared);
    if (error) return { error: error.message };
  }

  revalidatePath("/trainer/schedule");
  revalidatePath("/owner/trainer-schedule");
  return { success: true };
}
