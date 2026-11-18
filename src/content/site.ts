// Business facts shown on the public website. Phone, LINE and the Facebook
// page name come from S365's own marketing posters. Fields left null are not
// known yet and their blocks stay hidden until filled in.
export const site = {
  name: "S365 Fitness",
  phoneDisplay: "062-365-365-0",
  phoneHref: "tel:0623653650",
  lineId: "@s365fitness",
  lineHref: "https://line.me/R/ti/p/%40s365fitness",
  facebookName: "S365 Fitness",
  facebookHref: null as string | null,
  address: null as string | null,
  mapHref: null as string | null,
  hours: null as string | null,
};

export const navLinks = [
  { href: "#gym", label: "ยิม" },
  { href: "#trainers", label: "เทรนเนอร์" },
  { href: "#results", label: "ผลลัพธ์" },
  { href: "#community", label: "คอมมูนิตี้" },
  { href: "#contact", label: "ติดต่อ" },
];

export const zones = [
  {
    title: "แมชชีน",
    text: "เครื่องเวทแบบสแต็ก และแบบใส่แผ่น ฝึกเจาะทีละส่วน",
  },
  {
    title: "ฟรีเวท",
    text: "ดัมเบลล์ บาร์เบลล์ EZ bar และแร็กยกน้ำหนัก",
  },
  {
    title: "ฟังก์ชันนัล",
    text: "ลู่หญ้าเทียม สเลด เคตเทิลเบลล์ แซนด์แบ็ก และแบตเทิลโรป",
  },
  {
    title: "คาร์ดิโอ",
    text: "SkiErg เครื่องกรรเชียงบก จักรยาน และลู่วิ่ง",
  },
];
