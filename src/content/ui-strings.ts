import type { Locale } from "./site-texts";

// Fixed interface wording on the public site, in both languages. Texts the
// owner can edit live in site-texts.ts instead.
const th = {
  htmlLang: "th",
  nav: { gym: "ยิม", trainers: "เทรนเนอร์", results: "ผลลัพธ์", community: "คอมมูนิตี้", location: "แผนที่", contact: "ติดต่อ" },
  navLabel: "เมนูหลัก",
  backToTop: "S365 Fitness กลับไปด้านบน",
  login: "เข้าสู่ระบบ",
  loginLong: "เข้าสู่ระบบสมาชิกและทีมงาน",
  addLine: "แอดไลน์",
  call: "โทร",
  switchLanguage: "เปลี่ยนภาษา",
  resultsListLabel: "ภาพผลลัพธ์ก่อนและหลังของสมาชิก",
  openFullImage: "เปิดภาพขนาดเต็ม",
  mapHint: "แผนที่ 3 มิติ ลากเพื่อหมุนและเอียงมุมมองได้",
  mapLabel: "แผนที่ 3 มิติแสดงตำแหน่งยิม",
  mapLoading: "กำลังโหลดแผนที่",
  mapFailed: "เปิดแผนที่ในหน้านี้ไม่ได้",
  mapFallbackLink: "ดูบน Google Maps",
  address: "ADDRESS",
  gettingHere: "GETTING HERE",
  open: "OPEN",
  directions: "นำทางด้วย Google Maps",
  viewListing: "ดูหน้าร้านบน Google Maps",
  qrHint: "เปิดกล้องมือถือแล้วสแกนเพื่อแอดไลน์",
  qrLabel: "คิวอาร์โค้ดสำหรับแอดไลน์",
};

const en: typeof th = {
  htmlLang: "en",
  nav: { gym: "Gym", trainers: "Trainers", results: "Results", community: "Community", location: "Location", contact: "Contact" },
  navLabel: "Main menu",
  backToTop: "S365 Fitness, back to top",
  login: "Log in",
  loginLong: "Member and staff login",
  addLine: "Add LINE",
  call: "Call",
  switchLanguage: "Change language",
  resultsListLabel: "Before and after photos of members",
  openFullImage: "Open full-size image",
  mapHint: "3D map. Drag to rotate and tilt the view.",
  mapLabel: "3D map showing where the gym is",
  mapLoading: "Loading map",
  mapFailed: "The map could not be opened here.",
  mapFallbackLink: "View on Google Maps",
  address: "ADDRESS",
  gettingHere: "GETTING HERE",
  open: "OPEN",
  directions: "Get directions on Google Maps",
  viewListing: "View the gym on Google Maps",
  qrHint: "Scan with your phone camera to add us on LINE",
  qrLabel: "QR code to add LINE",
};

export type UiStrings = typeof th;

export const uiStrings: Record<Locale, UiStrings> = { th, en };

export const localePaths: Record<Locale, string> = { th: "/", en: "/en" };
