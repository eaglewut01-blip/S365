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

  const { error } = await insertPurchase(supabase, {
    trainer_id: trainerId,
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

const MAX_DOCUMENTS = 12;

type PurchaseRow = Record<string, unknown>;

// Saves a sale. Columns added by later database updates (who trains) are
// left out when the database does not have them yet, so selling never stops.
async function insertPurchase(supabase: Awaited<ReturnType<typeof createClient>>, row: PurchaseRow) {
  const first = await supabase.from("member_purchases").insert(row);
  if (!first.error) return first;
  // A shared sale cannot be saved until the database has the columns for it.
  if ("sold_by_2" in row && /sold_by_2/.test(first.error.message)) {
    return { ...first, error: { ...first.error, message: "ยังแบ่งค่าคอมสองคนไม่ได้ ต้องรันคำสั่งฐานข้อมูลรอบล่าสุดก่อน" } };
  }
  if (!("trainer_id" in row) || !/trainer_id/.test(first.error.message)) return first;
  const { trainer_id: _dropped, ...rest } = row;
  void _dropped;
  return supabase.from("member_purchases").insert(rest);
}

export type SaleResult = { error?: string; success?: boolean; memberId?: string; memberName?: string; lines?: string[] };

// The one-screen sale: a seller picks or adds the customer, then records a
// membership, PT hours, or both, with the trainer and how it was paid.
// Everything is checked before anything is saved.
export async function recordSale(formData: FormData): Promise<SaleResult> {
  const staffer = await requireRole("owner", "staff", "trainer");
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();
  const field = (name: string) => String(formData.get(name) || "").trim();

  // A trainer's sale is always their own; staff choose who sold.
  const soldBy = staffer.role === "trainer" ? staffer.id : field("sold_by");
  const method = (field("payment_method") || "transfer") as PaymentMethod;
  const purchasedOn = field("purchased_on") || todayBangkok();
  const note = field("note") || null;
  if (!soldBy) return { error: "เลือกผู้ขาย เพื่อใช้คิดค่าคอม" };
  if (!METHODS.includes(method)) return { error: "เลือกวิธีชำระ" };
  if (!DATE.test(purchasedOn)) return { error: "วันที่ซื้อไม่ถูกต้อง" };

  // What is being sold
  const packageId = field("package_id");
  const hours = Math.floor(Number(field("pt_hours") || 0));
  const bonus = Math.floor(Number(field("pt_bonus") || 0));
  if (!packageId && hours < 1) return { error: "เลือกแพ็กเกจสมาชิก หรือใส่ชั่วโมง PT อย่างน้อยหนึ่งอย่าง" };

  let pkg: Package | null = null;
  const membershipAmount = Number(field("membership_amount") || 0);
  const startsOn = field("starts_on") || purchasedOn;
  let endsOn = field("ends_on");
  if (packageId) {
    const { data } = await supabase.from("packages").select("*").eq("id", packageId).eq("kind", "membership").maybeSingle<Package>();
    pkg = data;
    if (!pkg) return { error: "ไม่พบแพ็กเกจสมาชิกนี้" };
    if (!Number.isFinite(membershipAmount) || membershipAmount < 0) return { error: "ยอดชำระค่าสมาชิกไม่ถูกต้อง" };
    if (!DATE.test(startsOn) || (endsOn && !DATE.test(endsOn))) return { error: "วันเริ่มหรือวันหมดอายุไม่ถูกต้อง" };
    endsOn = endsOn || membershipEnd(startsOn, pkg.months, pkg.bonus_months, pkg.bonus_days);
    if (endsOn < startsOn) return { error: "วันหมดอายุต้องไม่ก่อนวันเริ่ม" };
  }

  const ptAmount = Number(field("pt_amount") || 0);
  const trainerId = field("pt_trainer_id");
  if (hours >= 1) {
    if (!Number.isFinite(bonus) || bonus < 0) return { error: "ชั่วโมงแถมไม่ถูกต้อง" };
    if (!Number.isFinite(ptAmount) || ptAmount < 0) return { error: "ยอดชำระค่า PT ไม่ถูกต้อง" };
    if (!trainerId) return { error: "เลือกเทรนเนอร์ที่เทรนให้" };
  }

  // Two sellers sharing the commission: the second one's part of the total.
  const soldBy2 = field("sold_by_2");
  const total = (pkg ? membershipAmount : 0) + (hours >= 1 ? ptAmount : 0);
  const share2 = Math.round(Number(field("sold_by_2_amount") || 0) * 100) / 100;
  if (soldBy2) {
    if (soldBy2 === soldBy) return { error: "ผู้ขายคนที่ 2 ต้องเป็นคนละคนกับผู้ขายคนที่ 1" };
    if (!Number.isFinite(share2) || share2 <= 0) return { error: "ใส่ยอดของผู้ขายคนที่ 2" };
    if (share2 >= total) return { error: "ยอดของผู้ขายคนที่ 2 ต้องน้อยกว่ายอดรวมของการขาย" };
  }
  // Spread over the membership and PT lines in proportion to their amounts.
  const share2Membership = soldBy2 && pkg ? (hours >= 1 ? Math.round((share2 * membershipAmount) / total) : share2) : 0;
  const share2Pt = soldBy2 && hours >= 1 ? share2 - share2Membership : 0;
  const split = (amount: number) => (soldBy2 && amount > 0 ? { sold_by_2: soldBy2, sold_by_2_amount: amount } : {});

  // The customer: an existing member, or a new one added here
  let memberId = field("member_id");
  let memberName = "";
  if (memberId) {
    const { data: member } = await supabase.from("members").select("id, name").eq("id", memberId).maybeSingle();
    if (!member) return { error: "ไม่พบลูกค้าคนนี้" };
    memberName = member.name;
  } else {
    const name = field("new_name");
    const digits = field("new_phone").replace(/\D/g, "");
    if (!name) return { error: "เลือกลูกค้า หรือกรอกชื่อลูกค้าใหม่" };
    if (digits && digits.length !== 10) return { error: "เบอร์โทรต้องมี 10 หลัก" };
    if (digits) {
      const { data: same } = await supabase.from("members").select("name").eq("branch_id", staffer.branch_id).eq("phone", digits).limit(1);
      if (same && same.length > 0) return { error: `เบอร์นี้มีในระบบแล้วในชื่อ ${same[0].name} ให้เลือกจากลูกค้าเดิม` };
    }
    const { data: created, error } = await supabase
      .from("members")
      .insert({ branch_id: staffer.branch_id, name, phone: digits || null, plan: "-", status: "active", joined_date: purchasedOn, visit_count: 0, billing_status: "paid", amount: 0 })
      .select("id")
      .single();
    if (error) return { error: error.message };
    memberId = created.id;
    memberName = name;
  }

  // The slip photo was uploaded from the browser into this branch's folder.
  const proofPath = field("proof_path");
  if (proofPath && !new RegExp(`^${staffer.branch_id}/[0-9a-f-]{36}\\.jpg$`).test(proofPath)) return { error: "ไฟล์หลักฐานการชำระเงินไม่ถูกต้อง", memberId, memberName };

  // Contract and other papers: any number of photos, uploaded the same way.
  const documentPaths = formData.getAll("document_paths").map(String).filter(Boolean);
  if (documentPaths.length > MAX_DOCUMENTS) return { error: `แนบเอกสารได้ไม่เกิน ${MAX_DOCUMENTS} รูปต่อการขาย`, memberId, memberName };
  if (documentPaths.some((path) => !new RegExp(`^${staffer.branch_id}/[0-9a-f-]{36}\\.jpg$`).test(path))) {
    return { error: "ไฟล์เอกสารที่แนบไม่ถูกต้อง", memberId, memberName };
  }

  const lines: string[] = [];
  const earlier = async (kind: "membership" | "pt") =>
    ((await supabase.from("member_purchases").select("id", { count: "exact", head: true }).eq("member_id", memberId).eq("kind", kind)).count ?? 0) > 0;
  const base = { branch_id: staffer.branch_id, member_id: memberId, payment_method: method, sold_by: soldBy, purchased_on: purchasedOn, note, created_by: staffer.id, ...(proofPath ? { proof_path: proofPath } : {}), ...(documentPaths.length ? { document_paths: documentPaths } : {}) };

  if (pkg) {
    const { error } = await insertPurchase(supabase, {
      ...base, package_id: pkg.id, kind: "membership", package_name: pkg.name, amount: membershipAmount,
      starts_on: startsOn, ends_on: endsOn, pt_sessions: 0, is_renewal: await earlier("membership"), ...split(share2Membership),
    });
    if (error) return { error: error.message, memberId, memberName };
    await supabase.from("members").update({ plan: pkg.name, status: "active" }).eq("id", memberId);
    lines.push(`สมาชิก ${pkg.name} ถึงวันที่ ${endsOn}`);
  }

  if (hours >= 1) {
    const { error } = await insertPurchase(supabase, {
      ...base, package_id: null, kind: "pt", package_name: `PT ${hours} ชั่วโมง${bonus ? ` แถม ${bonus}` : ""}`, amount: ptAmount,
      starts_on: null, ends_on: null, pt_sessions: hours + bonus, is_renewal: await earlier("pt"), trainer_id: trainerId, ...split(share2Pt),
    });
    if (error) {
      return { error: `${lines.length ? "บันทึกค่าสมาชิกแล้ว แต่" : ""}บันทึก PT ไม่สำเร็จ: ${error.message}`, memberId, memberName, lines };
    }
    await supabase.from("members").update({ pt_trainer_id: trainerId }).eq("id", memberId);
    lines.push(`PT ${hours + bonus} ชั่วโมง`);
  }

  refresh(memberId);
  revalidatePath("/owner/sell");
  revalidatePath("/trainer/sell");
  return { success: true, memberId, memberName, lines };
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

// Set or clear the trainer who looks after a member's PT.
export async function assignPtTrainer(memberId: string, trainerId: string): Promise<Result> {
  await requireRole("owner", "staff");
  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ pt_trainer_id: trainerId || null }).eq("id", memberId);
  if (error) return { error: error.message };
  refresh(memberId);
  return { success: true };
}

// Clients carried over from the previous system keep their trainer's name
// (members.legacy_trainer). Once that trainer has an account here under the
// same name, this hands those clients to the account.
export async function linkLegacyTrainers(): Promise<Result & { linked?: number }> {
  const staffer = await requireRole("owner", "staff");
  if (!staffer.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };
  const supabase = await createClient();
  const { data: trainers } = await supabase.from("profiles").select("id, full_name").eq("branch_id", staffer.branch_id).eq("role", "trainer");

  let linked = 0;
  for (const trainer of trainers ?? []) {
    const name = trainer.full_name.trim().replace(/^PT[.\s]*/i, "");
    if (!name) continue;
    const { data, error } = await supabase
      .from("members")
      .update({ pt_trainer_id: trainer.id })
      .eq("branch_id", staffer.branch_id)
      .is("pt_trainer_id", null)
      .ilike("legacy_trainer", name)
      .select("id");
    if (error) return { error: error.message };
    linked += data?.length ?? 0;
  }

  revalidatePath("/owner/trainer-clients");
  revalidatePath("/owner");
  return { success: true, linked };
}
