// Business facts shown on the public website. Phone, LINE and the Facebook
// page name come from S365's own marketing posters; address, opening hours and
// map position come from the gym's Google Business listing (checked 2026-11-21).
// Fields left null are not known yet and their blocks stay hidden until filled in.
export const site = {
  name: "S365 Fitness",
  phoneDisplay: "062-365-365-0",
  phoneHref: "tel:0623653650",
  lineId: "@s365fitness",
  lineHref: "https://line.me/R/ti/p/%40s365fitness",
  facebookName: "S365 Fitness",
  facebookHref: null as string | null,
  address: "ซอยสุขุมวิท 70/3 แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260",
  // Google Maps links that open the gym's own listing (place ID), not a text search.
  mapHref: "https://www.google.com/maps/search/?api=1&query=S365%20Fitness&query_place_id=ChIJhVhELruh4jARzOOXA0T1hP8",
  directionsHref:
    "https://www.google.com/maps/dir/?api=1&destination=S365%20Fitness&destination_place_id=ChIJhVhELruh4jARzOOXA0T1hP8",
  geo: { lat: 13.6653423, lng: 100.6012298 },
  hours: [
    { days: "จันทร์ ถึง ศุกร์", time: "06:00 – 23:00 น." },
    { days: "เสาร์ และ อาทิตย์", time: "08:00 – 22:00 น." },
  ],
};

export const navLinks = [
  { href: "#gym", label: "ยิม" },
  { href: "#trainers", label: "เทรนเนอร์" },
  { href: "#results", label: "ผลลัพธ์" },
  { href: "#community", label: "คอมมูนิตี้" },
  { href: "#location", label: "แผนที่" },
  { href: "#contact", label: "ติดต่อ" },
];

export const zones = [
  {
    title: "แมชชีน",
    label: "MACHINE",
    text: "เครื่องเวทแบบสแต็ก และแบบใส่แผ่น ฝึกเจาะทีละส่วน",
  },
  {
    title: "ฟรีเวท",
    label: "FREE WEIGHT",
    text: "ดัมเบลล์ บาร์เบลล์ EZ bar และแร็กยกน้ำหนัก",
  },
  {
    title: "ฟังก์ชันนัล",
    label: "FUNCTIONAL",
    text: "ลู่หญ้าเทียม สเลด เคตเทิลเบลล์ แซนด์แบ็ก และแบตเทิลโรป",
  },
  {
    title: "คาร์ดิโอ",
    label: "CARDIO",
    text: "SkiErg เครื่องกรรเชียงบก จักรยาน และลู่วิ่ง",
  },
];
