// Every piece of text on the public website that the owner can change from
// the back office (/owner/website). `default` is what the site shows until a
// field is edited; the admin form is generated from this list.

export type TextGroupId = "hero" | "trainers" | "gym" | "results" | "community" | "location" | "contact";

export type Locale = "th" | "en";
export const locales: Locale[] = ["th", "en"];

export interface TextField {
  key: string;
  group: TextGroupId;
  label: string;
  /** Thai text shown until the owner edits the field. */
  default: string;
  /** English text for /en. Left out for fields marked `shared`. */
  en?: string;
  /** Same value in every language (phone number, links, map position). Edited once, on the Thai tab. */
  shared?: boolean;
  /** Shown under the field in the admin form. */
  help?: string;
  multiline?: boolean;
  /** Saving an empty value hides this text instead of restoring the default. */
  allowEmpty?: boolean;
}

export const textGroups: { id: TextGroupId; title: string }[] = [
  { id: "hero", title: "หน้าแรก" },
  { id: "trainers", title: "ทีมเทรนเนอร์" },
  { id: "gym", title: "ยิมและโซน" },
  { id: "results", title: "ผลลัพธ์ของสมาชิก" },
  { id: "community", title: "คอมมูนิตี้" },
  { id: "location", title: "ที่ตั้งและเวลาเปิดปิด" },
  { id: "contact", title: "ช่องทางติดต่อ" },
];

export const textFields = [
  { key: "hero.eyebrow", group: "hero", label: "ข้อความเล็กเหนือพาดหัว", default: "PERSONAL TRAINING GYM", en: "PERSONAL TRAINING GYM" },
  { key: "hero.line1", group: "hero", label: "พาดหัว บรรทัดที่ 1 (สีขาว)", default: "แข็งแรงขึ้น", en: "Get stronger" },
  { key: "hero.line2", group: "hero", label: "พาดหัว บรรทัดที่ 2 (สีเหลือง)", default: "ทุกวัน", en: "every day", allowEmpty: true },
  {
    key: "hero.sub",
    group: "hero",
    label: "คำโปรยใต้พาดหัว",
    default:
      "ยิมพื้นที่กว่า 1,000 ตารางเมตร ย่านบางนา เดินจาก BTS แบริ่งหรือ BTS บางนา 5 นาที มีเครื่องเวท ฟรีเวท โซนฟังก์ชันนัล และเทรนเนอร์ส่วนตัวที่วางโปรแกรมให้คุณ",
    en: "A gym of over 1,000 square metres in Bang Na, five minutes on foot from BTS Bearing or BTS Bang Na, with machines, free weights, a functional zone and personal trainers who build a programme for you.",
    multiline: true,
  },
  {
    key: "ticker.items",
    group: "hero",
    label: "ข้อความวิ่งบนแถบเหลือง",
    default: "PERSONAL TRAINING\nFUNCTIONAL TRAINING\nGROUP SESSION\nHYROX BANGKOK\nDEKA FIT",
    help: "บรรทัดละ 1 ข้อความ ใช้ร่วมกันทั้งสองภาษา",
    multiline: true,
    shared: true,
  },

  { key: "trainers.title", group: "trainers", label: "หัวข้อ", default: "ทีมเทรนเนอร์ของเรา", en: "Our trainers" },
  {
    key: "trainers.desc",
    group: "trainers",
    label: "คำอธิบาย",
    default: "เทรนเนอร์ส่วนตัว {count} คน วางโปรแกรมและดูแลการฝึกให้ตามเป้าหมายของแต่ละคน",
    en: "{count} personal trainers who build your programme and coach each session toward your goal.",
    help: "พิมพ์ {count} ตรงที่ต้องการให้ระบบใส่จำนวนเทรนเนอร์ให้เอง",
    multiline: true,
  },

  { key: "gym.title", group: "gym", label: "หัวข้อ", default: "พื้นที่ฝึกครบในที่เดียว", en: "Everything you train with, in one place" },
  {
    key: "gym.desc",
    group: "gym",
    label: "คำอธิบาย",
    default: "พื้นที่กว่า 1,000 ตารางเมตร จัดวางเป็นโซนชัดเจน เลือกฝึกได้ตามโปรแกรมของคุณ",
    en: "Over 1,000 square metres laid out in clear zones, so you can follow your programme from one to the next.",
    multiline: true,
  },
  { key: "zone1.title", group: "gym", label: "โซนที่ 1 ชื่อ", default: "แมชชีน", en: "Machines" },
  {
    key: "zone1.text",
    group: "gym",
    label: "โซนที่ 1 คำอธิบาย",
    default: "เครื่องเวทแบบสแต็ก และแบบใส่แผ่น ฝึกเจาะทีละส่วน",
    en: "Weight-stack and plate-loaded machines for training one muscle group at a time.",
  },
  { key: "zone2.title", group: "gym", label: "โซนที่ 2 ชื่อ", default: "ฟรีเวท", en: "Free weights" },
  {
    key: "zone2.text",
    group: "gym",
    label: "โซนที่ 2 คำอธิบาย",
    default: "ดัมเบลล์ บาร์เบลล์ EZ bar และแร็กยกน้ำหนัก",
    en: "Dumbbells, barbells, EZ bars and lifting racks.",
  },
  { key: "zone3.title", group: "gym", label: "โซนที่ 3 ชื่อ", default: "ฟังก์ชันนัล", en: "Functional" },
  {
    key: "zone3.text",
    group: "gym",
    label: "โซนที่ 3 คำอธิบาย",
    default: "ลู่หญ้าเทียม สเลด เคตเทิลเบลล์ แซนด์แบ็ก และแบตเทิลโรป",
    en: "Turf track, sleds, kettlebells, sandbags and battle ropes.",
  },
  { key: "zone4.title", group: "gym", label: "โซนที่ 4 ชื่อ", default: "คาร์ดิโอ", en: "Cardio" },
  {
    key: "zone4.text",
    group: "gym",
    label: "โซนที่ 4 คำอธิบาย",
    default: "SkiErg เครื่องกรรเชียงบก จักรยาน และลู่วิ่ง",
    en: "SkiErg, rowing machines, bikes and treadmills.",
  },

  { key: "results.title", group: "results", label: "หัวข้อ", default: "ผลลัพธ์ของสมาชิก", en: "Member results" },
  {
    key: "results.desc",
    group: "results",
    label: "คำอธิบาย",
    default: "ผลลัพธ์ของแต่ละคนแตกต่างกันตามจุดเริ่มต้นและความสม่ำเสมอ",
    en: "Results differ from person to person, depending on where you start and how consistently you train.",
    multiline: true,
  },

  { key: "community.title", group: "community", label: "หัวข้อ", default: "ซ้อมด้วยกัน ลงสนามด้วยกัน", en: "Train together, race together" },
  {
    key: "community.desc",
    group: "community",
    label: "คำอธิบาย",
    default: "สมาชิกและเทรนเนอร์รวมทีมลงแข่ง HYROX Bangkok และ DEKA FIT",
    en: "Our members and trainers compete as a team at HYROX Bangkok and DEKA FIT.",
    multiline: true,
  },

  { key: "location.title", group: "location", label: "หัวข้อ", default: "มาที่ยิม", en: "Find us" },
  {
    key: "location.address",
    group: "location",
    label: "ที่อยู่",
    default: "ซอยสุขุมวิท 70/3 แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260",
    en: "Soi Sukhumvit 70/3, Bang Na Tai, Bang Na, Bangkok 10260",
    multiline: true,
  },
  {
    key: "location.transit",
    group: "location",
    label: "การเดินทาง",
    default: "เดินจาก BTS แบริ่ง หรือ BTS บางนา 5 นาที",
    en: "5 minutes on foot from BTS Bearing or BTS Bang Na",
    allowEmpty: true,
  },
  { key: "location.hours1_days", group: "location", label: "เวลาเปิด แถวที่ 1: วัน", default: "จันทร์ ถึง ศุกร์", en: "Monday to Friday" },
  { key: "location.hours1_time", group: "location", label: "เวลาเปิด แถวที่ 1: เวลา", default: "06:00 – 23:00 น.", en: "06:00 – 23:00" },
  {
    key: "location.hours2_days",
    group: "location",
    label: "เวลาเปิด แถวที่ 2: วัน",
    default: "เสาร์ และ อาทิตย์",
    en: "Saturday and Sunday",
    allowEmpty: true,
  },
  {
    key: "location.hours2_time",
    group: "location",
    label: "เวลาเปิด แถวที่ 2: เวลา",
    default: "08:00 – 22:00 น.",
    en: "08:00 – 22:00",
    allowEmpty: true,
  },
  {
    key: "location.map_url",
    group: "location",
    label: "ลิงก์หน้าร้านบน Google Maps",
    default: "https://www.google.com/maps/search/?api=1&query=S365%20Fitness&query_place_id=ChIJhVhELruh4jARzOOXA0T1hP8",
    shared: true,
  },
  {
    key: "location.directions_url",
    group: "location",
    label: "ลิงก์นำทางบน Google Maps",
    default: "https://www.google.com/maps/dir/?api=1&destination=S365%20Fitness&destination_place_id=ChIJhVhELruh4jARzOOXA0T1hP8",
    shared: true,
  },
  {
    key: "location.lat",
    group: "location",
    label: "ตำแหน่งหมุดบนแผนที่ 3 มิติ: ละติจูด",
    default: "13.6653423",
    help: "แก้เฉพาะเมื่อย้ายที่ตั้ง คัดลอกตัวเลขได้จาก Google Maps (คลิกขวาที่ตำแหน่งยิม)",
    shared: true,
  },
  { key: "location.lng", group: "location", label: "ตำแหน่งหมุดบนแผนที่ 3 มิติ: ลองจิจูด", default: "100.6012298", shared: true },

  {
    key: "contact.title",
    group: "contact",
    label: "ข้อความเชิญชวน",
    default: "อยากเริ่ม ทักมาคุยกันก่อนได้",
    en: "Thinking of starting? Message us first.",
  },
  {
    key: "contact.note",
    group: "contact",
    label: "ข้อความใต้ปุ่มติดต่อ",
    default: "สอบถามแพ็กเกจและราคาได้ทางไลน์หรือโทร",
    en: "Ask about packages and prices on LINE or by phone.",
    allowEmpty: true,
  },
  { key: "contact.phone", group: "contact", label: "เบอร์โทร", default: "062-365-365-0", shared: true },
  {
    key: "contact.line_id",
    group: "contact",
    label: "LINE ID",
    default: "@s365fitness",
    help: "ปุ่มแอดไลน์และคิวอาร์โค้ดบนหน้าเว็บจะเปลี่ยนตามค่านี้เอง",
    shared: true,
  },
  { key: "contact.facebook_name", group: "contact", label: "ชื่อเพจ Facebook", default: "S365 Fitness", allowEmpty: true, shared: true },
  {
    key: "contact.facebook_url",
    group: "contact",
    label: "ลิงก์เพจ Facebook",
    default: "",
    help: "เช่น https://www.facebook.com/ชื่อเพจ ถ้าเว้นว่าง หน้าเว็บจะแสดงแค่ชื่อเพจ กดไม่ได้",
    allowEmpty: true,
    shared: true,
  },
] as const satisfies readonly TextField[];

export type TextKey = (typeof textFields)[number]["key"];

export const defaultTexts = Object.fromEntries(textFields.map((field) => [field.key, field.default])) as Record<
  TextKey,
  string
>;

export const sharedTextKeys = new Set<string>(textFields.filter((field) => "shared" in field && field.shared).map((field) => field.key));

/** Built-in English text for a field; shared fields have one value for every language. */
export function englishDefault(field: TextField): string {
  return field.shared ? field.default : (field.en ?? field.default);
}

/** Row key in the site_texts table: Thai rows use the plain key, English rows are prefixed. */
export function storageKey(locale: Locale, key: string) {
  return locale === "en" && !sharedTextKeys.has(key) ? `en:${key}` : key;
}

// Photo sections the owner can fill from the back office.
export type PhotoSection = "hero" | "trainers" | "zones" | "results" | "community";

export const photoSections: {
  id: PhotoSection;
  title: string;
  help: string;
  /** Label for the per-photo text field, when the section shows one. */
  titleLabel?: string;
  /** Label for a second per-photo text field (shown on the section's own page). */
  captionLabel?: string;
  max?: number;
}[] = [
  { id: "hero", title: "ภาพหน้าแรก", help: "ใช้ภาพแรกในรายการ ควรเป็นภาพแนวนอน กว้างอย่างน้อย 2000 พิกเซล", max: 1 },
  { id: "trainers", title: "ภาพเทรนเนอร์", help: "ภาพแนวตั้ง 1 คนต่อ 1 ภาพ ใส่ชื่อเทรนเนอร์ในช่องชื่อ ส่วนความถนัดจะแสดงในหน้าเทรนเนอร์",
    titleLabel: "ชื่อเทรนเนอร์",
    captionLabel: "ความถนัด เช่น ลดไขมัน เพิ่มกล้ามเนื้อ",
  },
  { id: "zones", title: "ภาพโซนในยิม", help: "เรียงตามลำดับโซนที่ 1 ถึง 4 ใช้ 4 ภาพแรก", max: 4 },
  { id: "results", title: "ภาพผลลัพธ์ของสมาชิก", help: "โปสเตอร์ก่อนและหลัง ควรได้รับอนุญาตจากสมาชิกก่อนเผยแพร่" },
  { id: "community", title: "ภาพคอมมูนิตี้", help: "ภาพแรกแสดงใหญ่ที่สุด ภาพที่ 2 และ 3 เป็นภาพแนวตั้ง ภาพถัดไปแสดงเป็นแถวเล็กด้านล่าง" },
];

export const SITE_MEDIA_BUCKET = "site-media";
