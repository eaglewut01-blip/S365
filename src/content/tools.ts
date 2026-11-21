import type { Locale } from "./site-texts";

type Text = Record<Locale, string>;

// The visitor tools and guides, in the order they appear on the tools page and the home page.
// `ready: false` items are listed on the tools page as coming soon and are not linked yet.
export const tools: { id: string; path: string; tag: string; title: Text; desc: Text; ready?: boolean }[] = [
  {
    id: "bmi",
    path: "/tools/bmi",
    tag: "BMI",
    title: { th: "คำนวณค่า BMI", en: "BMI calculator" },
    desc: { th: "ใส่น้ำหนักกับส่วนสูง ดูว่าอยู่ในเกณฑ์ไหน", en: "Enter weight and height to see which range you are in." },
  },
  {
    id: "workout",
    path: "/tools/workout-plan",
    tag: "PLAN",
    title: { th: "วางแผนออกกำลังกาย", en: "Workout planner" },
    desc: { th: "เลือกเป้าหมายและจำนวนวัน รับตารางฝึกรายสัปดาห์", en: "Pick a goal and how many days you train to get a weekly plan." },
  },
  {
    id: "meal",
    path: "/tools/meal-plan",
    tag: "FOOD",
    title: { th: "วางแผนการกิน", en: "Meal planner" },
    desc: { th: "คำนวณพลังงานและโปรตีนต่อวัน พร้อมตัวอย่างเมนู", en: "Daily calories and protein, with example meals." },
  },
  {
    id: "crowd",
    ready: false,
    path: "/tools/crowd",
    tag: "LIVE",
    title: { th: "ตอนนี้คนเยอะไหม", en: "How busy is it now" },
    desc: { th: "ดูจำนวนคนในยิมตอนนี้ก่อนออกจากบ้าน", en: "See how many people are in the gym before you leave home." },
  },
  {
    id: "home",
    path: "/guides/home-workout",
    tag: "HOME",
    title: { th: "ท่าออกกำลังกายที่บ้าน", en: "Home exercises" },
    desc: { th: "ท่าพื้นฐานที่ทำได้โดยไม่ต้องใช้อุปกรณ์", en: "Basic moves you can do with no equipment." },
  },
  {
    id: "stretch",
    path: "/guides/stretching",
    tag: "STRETCH",
    title: { th: "ท่ายืดหลังออกกำลังกาย", en: "Post-workout stretches" },
    desc: { th: "ยืดทีละส่วน คอ ไหล่ หลัง สะโพก ขา", en: "Stretch one area at a time: neck, shoulders, back, hips, legs." },
  },
  {
    id: "machines",
    ready: false,
    path: "/machines",
    tag: "HOW TO",
    title: { th: "วิธีเล่นแต่ละเครื่อง", en: "How to use each machine" },
    desc: { th: "ขั้นตอนและคลิปของแต่ละเครื่อง สแกน QR ที่เครื่องได้เลย", en: "Steps and a clip for each machine. Scan the QR code on the machine." },
  },
];

export const comingSoon: Text = { th: "เร็วๆ นี้", en: "Coming soon" };

// Page titles and introductions for each tool or guide page.
export const toolPages = {
  hub: {
    path: "/tools",
    eyebrow: "TOOLS",
    title: { th: "เครื่องมือและคู่มือ", en: "Tools and guides" },
    intro: {
      th: "เครื่องมือคำนวณและคู่มือพื้นฐานจากทีม S365 ใช้ได้ฟรี ไม่ต้องสมัครสมาชิก",
      en: "Calculators and basic guides from the S365 team. Free to use, no sign-up needed.",
    },
  },
  bmi: {
    path: "/tools/bmi",
    eyebrow: "BMI",
    title: { th: "คำนวณค่า BMI", en: "BMI calculator" },
    intro: {
      th: "ค่าดัชนีมวลกายบอกคร่าวๆ ว่าน้ำหนักเหมาะกับส่วนสูงหรือไม่ ใช้เกณฑ์สำหรับคนเอเชีย",
      en: "Body mass index gives a rough idea of whether your weight suits your height. Uses the Asia-Pacific ranges.",
    },
  },
  workout: {
    path: "/tools/workout-plan",
    eyebrow: "WORKOUT PLAN",
    title: { th: "วางแผนออกกำลังกาย", en: "Workout planner" },
    intro: {
      th: "เลือกเป้าหมาย จำนวนวัน และสถานที่ฝึก รับตารางฝึกรายสัปดาห์ที่เริ่มทำได้ทันที",
      en: "Choose your goal, training days and where you train to get a weekly plan you can start today.",
    },
  },
  meal: {
    path: "/tools/meal-plan",
    eyebrow: "MEAL PLAN",
    title: { th: "วางแผนการกิน", en: "Meal planner" },
    intro: {
      th: "คำนวณพลังงาน โปรตีน คาร์โบไฮเดรต และไขมันต่อวันตามเป้าหมาย พร้อมตัวอย่างเมนู",
      en: "Work out daily energy, protein, carbohydrate and fat for your goal, with example meals.",
    },
  },
  home: {
    path: "/guides/home-workout",
    eyebrow: "HOME WORKOUT",
    title: { th: "ท่าออกกำลังกายที่บ้านเบื้องต้น", en: "Basic home exercises" },
    intro: {
      th: "8 ท่าพื้นฐานที่ไม่ต้องใช้อุปกรณ์ ทำได้ในพื้นที่เท่าเสื่อโยคะ",
      en: "Eight basic moves that need no equipment and only the space of a yoga mat.",
    },
  },
  stretch: {
    path: "/guides/stretching",
    eyebrow: "STRETCHING",
    title: { th: "ท่ายืดหลังออกกำลังกาย", en: "Post-workout stretches" },
    intro: {
      th: "ยืดทีละส่วนตั้งแต่คอถึงน่อง ใช้เวลาประมาณ 10 นาที",
      en: "One area at a time from neck to calves, in about 10 minutes.",
    },
  },
} as const;

export type ToolPageId = keyof typeof toolPages;
