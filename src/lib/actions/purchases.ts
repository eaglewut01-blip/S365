"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { membershipEnd, todayBangkok } from "@/lib/dates";
import type { Package, PaymentMethod } from "@/types/database";

type Result = { error?: string; success?: boolean };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const METHODS: PaymentMethod[] = ["transfer", "credit", "cash", "other"];

function refresh(memberId: string) {
  revalidatePath("/owner/members");
  revalidatePath(`/owner/members/${memberId}`);
  revalidatePath("/owner/billing");
  revalidatePath("/owner/reports");
  revalidatePath("/owner");
}

// Staff record that a member bought a package. A membership starts on the
// chosen day and its end date is worked out from the package; staff can
// type a different end date (for a special deal) before saving.
export async function sellPackage(formData: FormData): Promise<Result> {
  const staffer = await requireRole("owner", "staff");
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();

  const memberId = String(formData.get("member_id") || "");
  const packageId = String(formData.get("package_id") || "");
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("payment_method") || "transfer") as PaymentMethod;
  const soldBy = String(formData.get("sold_by") || "") || null;
  const purchasedOn = String(formData.get("purchased_on") || "") || todayBangkok();
  const startsOn = String(formData.get("starts_on") || "") || purchasedOn;
  const endsOnInput = String(formData.get("ends_on") || "");
  const note = String(formData.get("note") || "").trim() || null;

  if (!memberId || !packageId) return { error: "เลือกแพ็กเกจก่อน" };
  if (!Number.isFinite(amount) || amount < 0) return { error: "ยอดชำระไม่ถูกต้อง" };
  if (!METHODS.includes(method)) return { error: "เลือกวิธีชำระ" };
  if (![purchasedOn, startsOn].every((d) => DATE.test(d)) || (endsOnInput && !DATE.test(endsOnInput))) {
    return { error: "วันที่ไม่ถูกต้อง" };
  }

  const { data: pkg } = await supabase.from("packages").select("*").eq("id", packageId).single<Package>();
  if (!pkg) return { error: "ไม่พบแพ็กเกจนี้" };

  const isMembership = pkg.kind === "membership";
  const endsOn = isMembership ? endsOnInput || membershipEnd(startsOn, pkg.months, pkg.bonus_months, pkg.bonus_days) : null;
  if (isMembership && endsOn! < startsOn) return { error: "วันหมดอายุต้องไม่ก่อนวันเริ่ม" };

  const { error } = await supabase.from("member_purchases").insert({
    branch_id: staffer.branch_id,
    member_id: memberId,
    package_id: pkg.id,
    kind: pkg.kind,
    package_name: pkg.name,
    amount,
    payment_method: method,
    sold_by: soldBy,
    purchased_on: purchasedOn,
    starts_on: isMembership ? startsOn : null,
    ends_on: endsOn,
    pt_sessions: isMembership ? 0 : pkg.sessions + pkg.bonus_sessions,
    note,
    created_by: staffer.id,
  });
  if (error) return { error: error.message };

  if (isMembership) {
    await supabase.from("members").update({ plan: pkg.name, status: "active" }).eq("id", memberId);
  }

  refresh(memberId);
  return { success: true };
}

// Move a membership's end date: a freeze, a goodwill extension, or a fix.
export async function changePurchaseEnd(purchaseId: string, memberId: string, endsOn: string): Promise<Result> {
  await requireRole("owner", "staff");
  if (!DATE.test(endsOn)) return { error: "วันที่ไม่ถูกต้อง" };
  const supabase = await createClient();
  const { error } = await supabase.from("member_purchases").update({ ends_on: endsOn }).eq("id", purchaseId).eq("kind", "membership");
  if (error) return { error: error.code === "23514" ? "วันหมดอายุต้องไม่ก่อนวันเริ่ม" : error.message };
  refresh(memberId);
  return { success: true };
}

// Remove a sale entered by mistake. The member's expiry date, PT hours and
// the revenue report follow automatically.
export async function deletePurchase(purchaseId: string, memberId: string): Promise<Result> {
  await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("member_purchases").delete().eq("id", purchaseId);
  if (error) return { error: error.message };
  refresh(memberId);
  return { success: true };
}

export async function updateMemberDetails(formData: FormData): Promise<Result> {
  await requireRole("owner", "staff");
  const memberId = String(formData.get("member_id") || "");
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  if (!memberId || !name) return { error: "กรอกชื่อสมาชิก" };

  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ name, phone: phone || null }).eq("id", memberId);
  if (error) return { error: error.message };
  refresh(memberId);
  return { success: true };
}
