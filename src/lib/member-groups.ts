import { expiryState } from "@/lib/dates";

// The three lists the team calls from, by where a membership stands today.
// Each member with a membership is in exactly one of them.
export const SOON_DAYS = 30;
export type MemberGroup = "active" | "soon" | "expired";

export const GROUP_LABEL: Record<MemberGroup, string> = {
  active: `ใช้งานอยู่ (เหลือเกิน ${SOON_DAYS} วัน)`,
  soon: `ใกล้หมดอายุ (ไม่เกิน ${SOON_DAYS} วัน)`,
  expired: "หมดอายุแล้ว",
};
export const GROUP_SHEET: Record<MemberGroup, string> = { active: "ใช้งานอยู่", soon: "ใกล้หมดอายุ", expired: "หมดอายุแล้ว" };

export function memberGroup(expiresOn: string | null | undefined): MemberGroup | null {
  const { state, daysLeft } = expiryState(expiresOn, SOON_DAYS);
  if (state === "none" || daysLeft === null) return null;
  return state === "expired" ? "expired" : state === "soon" ? "soon" : "active";
}
