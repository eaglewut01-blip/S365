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
  revalidatePath("/owner/trainer-clients");
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
  if (!soldBy) return { error: "เลือกผู้ขาย เพื่อใช้คิดค่าคอม" };
  if (!Number.isFinite(amount) || amount < 0) return { error: "ยอดชำระไม่ถูกต้อง" };
  if (!METHODS.includes(method)) return { error: "เลือกวิธีชำระ" };
  if (![purchasedOn, startsOn].every((d) => DATE.test(d)) || (endsOnInput && !DATE.test(endsOnInput))) {
    return { error: "วันที่ไม่ถูกต้อง" };
  }

  const { data: pkg } = await supabase.from("packages").select("*").eq("id", packageId).single<Package>();
  if (!pkg) return { error: "ไม่พบแพ็กเกจนี้" };

  const isMembership = pkg.kind === "membership";
  if (!isMembership && !String(formData.get("pt_trainer_id") || "")) return { error: "เลือกเทรนเนอร์ที่เทรนให้" };
  const endsOn = isMembership ? endsOnInput || membershipEnd(startsOn, pkg.months, pkg.bonus_months, pkg.bonus_days) : null;
  if (isMembership && endsOn! < startsOn) return { error: "วันหมดอายุต้องไม่ก่อนวันเริ่ม" };

  // A repeat purchase of the same kind counts as a renewal in the sales figures.
  const { count: earlier } = await supabase
    .from("member_purchases")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("kind", pkg.kind);

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
    is_renewal: (earlier ?? 0) > 0,
    note,
    created_by: staffer.id,
  });
  if (error) return { error: error.message };

  if (isMembership) {
    await supabase.from("members").update({ plan: pkg.name, status: "active" }).eq("id", memberId);
  } else {
    // The trainer who will look after these hours.
    const trainerId = String(formData.get("pt_trainer_id") || "");
    if (trainerId) await supabase.from("members").update({ pt_trainer_id: trainerId }).eq("id", memberId);
  }

  refresh(memberId);
  return { success: true };
}

// PT is sold by the hour with terms agreed each time (hours, free hours,
// price), so it is typed in directly instead of picked from a package.
export async function sellPt(formData: FormData): Promise<Result> {
  const staffer = await requireRole("owner", "staff");
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();

  const memberId = String(formData.get("member_id") || "");
  const hours = Math.floor(Number(formData.get("hours") || 0));
  const bonus = Math.floor(Number(formData.get("bonus_hours") || 0));
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("payment_method") || "transfer") as PaymentMethod;
  const soldBy = String(formData.get("sold_by") || "");
  const trainerId = String(formData.get("pt_trainer_id") || "");
  const purchasedOn = String(formData.get("purchased_on") || "") || todayBangkok();
  const note = String(formData.get("note") || "").trim() || null;

  if (!memberId) return { error: "ไม่พบสมาชิก" };
  if (!Number.isFinite(hours) || hours < 1) return { error: "ใส่จำนวนชั่วโมงที่ซื้อ" };
  if (!Number.isFinite(bonus) || bonus < 0) return { error: "ชั่วโมงแถมไม่ถูกต้อง" };
  if (!Number.isFinite(amount) || amount < 0) return { error: "ยอดชำระไม่ถูกต้อง" };
  if (!METHODS.includes(method)) return { error: "เลือกวิธีชำระ" };
  if (!DATE.test(purchasedOn)) return { error: "วันที่ไม่ถูกต้อง" };
  if (!trainerId) return { error: "เลือกเทรนเนอร์ที่เทรนให้" };
  if (!soldBy) return { error: "เลือกผู้ขาย เพื่อใช้คิดค่าคอม" };

  const { count: earlier } = await supabase
    .from("member_purchases")
    .select("id", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("kind", "pt");

  const { error } = await supabase.from("member_purchases").insert({
    branch_id: staffer.branch_id,
    member_id: memberId,
    package_id: null,
    kind: "pt",
    package_name: `PT ${hours} ชั่วโมง${bonus ? ` แถม ${bonus}` : ""}`,
    amount,
    payment_method: method,
    sold_by: soldBy,
    purchased_on: purchasedOn,
    starts_on: null,
    ends_on: null,
    pt_sessions: hours + bonus,
    is_renewal: (earlier ?? 0) > 0,
    note,
    created_by: staffer.id,
  });
  if (error) return { error: error.message };

  await supabase.from("members").update({ pt_trainer_id: trainerId }).eq("id", memberId);

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
  const { error } = await supabase
    .from("members")
    .update({ name, phone: phone || null, pt_trainer_id: String(formData.get("pt_trainer_id") || "") || null })
    .eq("id", memberId);
  if (error) return { error: error.message };
  refresh(memberId);
  return { success: true };
}
