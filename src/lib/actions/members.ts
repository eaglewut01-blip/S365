"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { MemberStatus } from "@/types/database";

const PLAN_AMOUNTS: Record<string, number> = {
  Unlimited: 1890,
  "8x / month": 1290,
  "Drop-in x12": 990,
};

export async function addMember(formData: FormData) {
  const staffer = await requireRole("owner", "staff");
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const plan = String(formData.get("plan") || "8x / month");

  if (!name) return { error: "กรอกชื่อสมาชิก" };
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from("members").insert({
    branch_id: staffer.branch_id,
    name,
    phone: phone || null,
    plan,
    status: "active",
    joined_date: today,
    last_visit: today,
    visit_count: 0,
    billing_status: "paid",
    amount: PLAN_AMOUNTS[plan] ?? 0,
  });

  if (error) return { error: error.message };

  revalidatePath("/owner/members");
  return { success: true };
}

const STATUS_CYCLE: MemberStatus[] = ["active", "frozen", "cancelled"];

export async function cycleMemberStatus(memberId: string, currentStatus: MemberStatus) {
  await requireRole("owner", "staff");
  const supabase = await createClient();

  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length];
  const { error } = await supabase.from("members").update({ status: next }).eq("id", memberId);
  if (error) return { error: error.message };

  revalidatePath("/owner/members");
  return { success: true };
}
