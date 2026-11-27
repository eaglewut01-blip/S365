import type { Package, PaymentMethod, PromotionAudience, SlotKind, VisitActivity } from "@/types/database";

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  transfer: "โอน",
  credit: "บัตรเครดิต",
  cash: "เงินสด",
  other: "อื่นๆ",
};

export const AUDIENCE_LABEL: Record<PromotionAudience, string> = {
  membership_expiring: "สมาชิกใกล้หมดอายุ",
  pt_low: "ชั่วโมง PT ใกล้หมด",
  all: "สมาชิกทุกคน",
};

// What a member came to do on a visit; they tap one when checking in.
export const ACTIVITY_LABEL: Record<VisitActivity, string> = {
  weights: "เวท",
  cardio: "คาร์ดิโอ",
  class: "เข้าคลาส",
};

export const ACTIVITIES = Object.keys(ACTIVITY_LABEL) as VisitActivity[];

// A PT client with this many hours left, or fewer, is "about to run out".
export const PT_LOW_HOURS = 2;

export const SLOT_LABEL: Record<SlotKind, string> = {
  pt: "เทรนลูกค้า",
  trial: "เทสต์ลูกค้า",
  free: "ว่าง",
  off: "ไม่อยู่",
};

// The hours a trainer can fill in, matching the gym's opening hours.
export const WORK_HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

// "3 เดือน + แถม 1 เดือน" / "12 ครั้ง + แถม 2 ครั้ง"
export function packageTerms(p: Pick<Package, "kind" | "months" | "bonus_months" | "bonus_days" | "sessions" | "bonus_sessions">): string {
  if (p.kind === "pt") {
    return `${p.sessions} ชั่วโมง` + (p.bonus_sessions ? ` + แถม ${p.bonus_sessions} ชั่วโมง` : "");
  }
  const bonus = [p.bonus_months ? `${p.bonus_months} เดือน` : "", p.bonus_days ? `${p.bonus_days} วัน` : ""].filter(Boolean).join(" ");
  const base = p.months ? `${p.months} เดือน` : "";
  if (!base) return bonus || "-";
  return base + (bonus ? ` + แถม ${bonus}` : "");
}
