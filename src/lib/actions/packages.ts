"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { PackageKind, PromotionAudience } from "@/types/database";

type Result = { error?: string; success?: boolean };

function wholeNumber(value: FormDataEntryValue | null): number {
  const n = Math.floor(Number(value || 0));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Owner only: add a package, or change one when `id` is sent.
export async function savePackage(formData: FormData): Promise<Result> {
  const owner = await requireRole("owner");
  if (!owner.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const id = String(formData.get("id") || "");
  const kind = String(formData.get("kind") || "") as PackageKind;
  const name = String(formData.get("name") || "").trim();
  const price = Number(formData.get("price") || 0);

  if (!name) return { error: "กรอกชื่อแพ็กเกจ" };
  if (kind !== "membership" && kind !== "pt") return { error: "เลือกประเภทแพ็กเกจ" };
  if (!Number.isFinite(price) || price < 0) return { error: "ราคาไม่ถูกต้อง" };

  const row = {
    branch_id: owner.branch_id,
    kind,
    name,
    price,
    months: kind === "membership" ? wholeNumber(formData.get("months")) : 0,
    bonus_months: kind === "membership" ? wholeNumber(formData.get("bonus_months")) : 0,
    bonus_days: kind === "membership" ? wholeNumber(formData.get("bonus_days")) : 0,
    sessions: kind === "pt" ? wholeNumber(formData.get("sessions")) : 0,
    bonus_sessions: kind === "pt" ? wholeNumber(formData.get("bonus_sessions")) : 0,
    note: String(formData.get("note") || "").trim() || null,
  };

  if (kind === "membership" && row.months + row.bonus_months + row.bonus_days === 0) {
    return { error: "ใส่อายุสมาชิกเป็นเดือนหรือวัน" };
  }
  if (kind === "pt" && row.sessions === 0) return { error: "ใส่จำนวนชั่วโมง PT" };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("packages").update(row).eq("id", id)
    : await supabase.from("packages").insert(row);
  if (error) return { error: error.message };

  revalidatePath("/owner/packages");
  return { success: true };
}

// Retire a package (or bring it back). Past sales keep their details.
export async function setPackageActive(id: string, active: boolean): Promise<Result> {
  await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("packages").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/owner/packages");
  return { success: true };
}

export async function savePromotion(formData: FormData): Promise<Result> {
  const owner = await requireRole("owner");
  if (!owner.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim();
  const audience = String(formData.get("audience") || "") as PromotionAudience;
  if (!title) return { error: "กรอกหัวข้อโปรโมชั่น" };
  if (!["membership_expiring", "pt_low", "all"].includes(audience)) return { error: "เลือกกลุ่มที่จะเห็นโปรโมชั่น" };

  const row = {
    branch_id: owner.branch_id,
    title,
    body: String(formData.get("body") || "").trim(),
    audience,
    days_before: formData.get("days_before") === null ? 7 : wholeNumber(formData.get("days_before")),
    pt_at_most: formData.get("pt_at_most") === null ? 2 : wholeNumber(formData.get("pt_at_most")),
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("promotions").update(row).eq("id", id)
    : await supabase.from("promotions").insert(row);
  if (error) return { error: error.message };

  revalidatePath("/owner/packages");
  return { success: true };
}

export async function setPromotionActive(id: string, active: boolean): Promise<Result> {
  await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").update({ active }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/owner/packages");
  return { success: true };
}

export async function deletePromotion(id: string): Promise<Result> {
  await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/owner/packages");
  return { success: true };
}
