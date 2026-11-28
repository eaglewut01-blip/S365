"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { WORK_HOURS } from "@/lib/labels";
import type { SlotKind } from "@/types/database";

const KINDS: SlotKind[] = ["pt", "trial", "free", "off"];
type Result = { error?: string; success?: boolean };

// Whose day is being edited: a trainer edits their own; staff name the trainer.
async function target(trainerId?: string) {
  const profile = await requireRole("trainer", "owner", "staff");
  const id = profile.role === "trainer" ? profile.id : trainerId ?? "";
  return { profile, id };
}

function refresh() {
  revalidatePath("/trainer/schedule");
  revalidatePath("/owner/trainer-schedule");
  revalidatePath("/owner/trainer-clients");
  revalidatePath("/owner");
}

// Set one hour of a trainer's day, or clear it with kind = null. Saved at once,
// so filling in the day is a series of taps with no separate save step.
export async function setTrainerSlot(input: { date: string; hour: number; kind: SlotKind | null; clientName?: string; trainerId?: string }): Promise<Result> {
  const { profile, id } = await target(input.trainerId);
  if (!profile.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  if (!id) return { error: "ไม่พบเทรนเนอร์" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || !WORK_HOURS.includes(input.hour)) return { error: "วันหรือเวลาไม่ถูกต้อง" };

  const supabase = await createClient();
  if (input.kind === null) {
    const { error } = await supabase.from("trainer_slots").delete().eq("trainer_id", id).eq("work_date", input.date).eq("hour", input.hour);
    if (error) return { error: error.message };
  } else {
    if (!KINDS.includes(input.kind)) return { error: "ข้อมูลตารางไม่ถูกต้อง" };
    const client = (input.clientName ?? "").trim().slice(0, 80);
    const { error } = await supabase.from("trainer_slots").upsert(
      {
        branch_id: profile.branch_id,
        trainer_id: id,
        work_date: input.date,
        hour: input.hour,
        kind: input.kind,
        client_name: input.kind === "pt" || input.kind === "trial" ? client || null : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "trainer_id,work_date,hour" }
    );
    if (error) return { error: error.message };
  }

  refresh();
  return { success: true };
}

// Mark every hour that has nothing yet as free, or as not working.
export async function fillEmptySlots(input: { date: string; kind: "free" | "off"; trainerId?: string }): Promise<Result> {
  const { profile, id } = await target(input.trainerId);
  if (!profile.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  if (!id) return { error: "ไม่พบเทรนเนอร์" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || (input.kind !== "free" && input.kind !== "off")) return { error: "ข้อมูลไม่ถูกต้อง" };

  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase.from("trainer_slots").select("hour").eq("trainer_id", id).eq("work_date", input.date);
  if (readError) return { error: readError.message };
  const taken = new Set((existing ?? []).map((row) => row.hour));
  const rows = WORK_HOURS.filter((hour) => !taken.has(hour)).map((hour) => ({
    branch_id: profile.branch_id,
    trainer_id: id,
    work_date: input.date,
    hour,
    kind: input.kind,
    client_name: null,
  }));
  if (rows.length > 0) {
    const { error } = await supabase.from("trainer_slots").insert(rows);
    if (error) return { error: error.message };
  }

  refresh();
  return { success: true };
}
