"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";

export async function markPaid(memberId: string) {
  const staffer = await requireRole("owner", "staff");
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("next_bill_date, amount, branch_id")
    .eq("id", memberId)
    .single();

  if (!member) return { error: "ไม่พบข้อมูลสมาชิก" };

  const nextBill = member.next_bill_date ? new Date(member.next_bill_date) : new Date();
  nextBill.setMonth(nextBill.getMonth() + 1);

  const { error } = await supabase
    .from("members")
    .update({ billing_status: "paid", next_bill_date: nextBill.toISOString().slice(0, 10) })
    .eq("id", memberId);

  if (error) return { error: error.message };

  await supabase.from("payments").insert({
    member_id: memberId,
    branch_id: member.branch_id ?? staffer.branch_id,
    amount: member.amount,
  });

  revalidatePath("/owner/billing");
  revalidatePath("/owner/reports");
  return { success: true };
}
