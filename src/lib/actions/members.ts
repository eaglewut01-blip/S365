"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { todayBangkok } from "@/lib/dates";
import type { MemberStatus } from "@/types/database";

// Add a walk-in member. The package they buy is recorded next, on their own
// page, where the dates and PT hours are worked out from the package.
export async function addMember(formData: FormData): Promise<{ error?: string; success?: boolean; id?: string }> {
  const staffer = await requireRole("owner", "staff");
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();

  if (!name) return { error: "กรอกชื่อสมาชิก" };
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const { data, error } = await supabase
    .from("members")
    .insert({
      branch_id: staffer.branch_id,
      name,
      phone: phone || null,
      plan: "-",
      status: "active",
      joined_date: todayBangkok(),
      visit_count: 0,
      billing_status: "paid",
      amount: 0,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/owner/members");
  return { success: true, id: data.id };
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
