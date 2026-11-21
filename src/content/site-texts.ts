// Every piece of text on the public website that the owner can change from
// the back office (/owner/website). `default` is what the site shows until a
// field is edited; the admin form is generated from this list.

export type TextGroupId = "hero" | "trainers" | "gym" | "results" | "community" | "location" | "contact";

export interface TextField {
  key: string;
  group: TextGroupId;
  label: string;
  default: string;
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
  { key: "hero.eyebrow", group: "hero", label: "ข้อความเล็กเหนือพาดหัว", default: "PERSONAL TRAINING GYM" },
  { key: "hero.line1", group: "hero", label: "พาดหัว บรรทัดที่ 1 (สีขาว)", default: "แข็งแรงขึ้น" },
  { key: "hero.line2", group: "hero", label: "พาดหัว บรรทัดที่ 2 (สีเหลือง)", default: "ทุกวัน", allowEmpty: true },
  {
    key: "hero.sub",
    group: "hero",
    label: "คำโปรยใต้พาดหัว",
    default:
      "ยิมพื้นที่กว่า 1,000 ตารางเมตร ย่านบางนา เดินจาก BTS แบริ่งหรือ BTS บางนา 5 นาที มีเครื่องเวท ฟรีเวท โซนฟังก์ชันนัล และเทรนเนอร์ส่วนตัวที่วางโปรแกรมให้คุณ",
    multiline: true,
  },
  {
    key: "ticker.items",
    group: "hero",
    label: "ข้อความวิ่งบนแถบเหลือง",
    default: "PERSONAL TRAINING\nFUNCTIONAL TRAINING\nGROUP SESSION\nHYROX BANGKOK\nDEKA FIT",
    help: "บรรทัดละ 1 ข้อความ",
    multiline: true,
  },

  { key: "trainers.title", group: "trainers", label: "หัวข้อ", default: "ทีมเทรนเนอร์ของเรา" },
  {
    key: "trainers.desc",
    group: "trainers",
    label: "คำอธิบาย",
    default: "เทรนเนอร์ส่วนตัว {count} คน วางโปรแกรมและดูแลการฝึกให้ตามเป้าหมายของแต่ละคน",
    help: "พิมพ์ {count} ตรงที่ต้องการให้ระบบใส่จำนวนเทรนเนอร์ให้เอง",
    multiline: true,
  },

  { key: "gym.title", group: "gym", label: "หัวข้อ", default: "พื้นที่ฝึกครบในที่เดียว" },
  {
    key: "gym.desc",
    group: "gym",
    label: "คำอธิบาย",
    default: "พื้นที่กว่า 1,000 ตารางเมตร จัดวางเป็นโซนชัดเจน เลือกฝึกได้ตามโปรแกรมของคุณ",
    multiline: true,
  },
  { key: "zone1.title", group: "gym", label: "โซนที่ 1 ชื่อ", default: "แมชชีน" },
  { key: "zone1.text", group: "gym", label: "โซนที่ 1 คำอธิบาย", default: "เครื่องเวทแบบสแต็ก และแบบใส่แผ่น ฝึกเจาะทีละส่วน" },
  { key: "zone2.title", group: "gym", label: "โซนที่ 2 ชื่อ", default: "ฟรีเวท" },
  { key: "zone2.text", group: "gym", label: "โซนที่ 2 คำอธิบาย", default: "ดัมเบลล์ บาร์เบลล์ EZ bar และแร็กยกน้ำหนัก" },
  { key: "zone3.title", group: "gym", label: "โซนที่ 3 ชื่อ", default: "ฟังก์ชันนัล" },
  { key: "zone3.text", group: "gym", label: "โซนที่ 3 คำอธิบาย", default: "ลู่หญ้าเทียม สเลด เคตเทิลเบลล์ แซนด์แบ็ก และแบตเทิลโรป" },
  { key: "zone4.title", group: "gym", label: "โซนที่ 4 ชื่อ", default: "คาร์ดิโอ" },
  { key: "zone4.text", group: "gym", label: "โซนที่ 4 คำอธิบาย", default: "SkiErg เครื่องกรรเชียงบก จักรยาน และลู่วิ่ง" },

  { key: "results.title", group: "results", label: "หัวข้อ", default: "ผลลัพธ์ของสมาชิก" },
  {
    key: "results.desc",
    group: "results",
    label: "คำอธิบาย",
    default: "ผลลัพธ์ของแต่ละคนแตกต่างกันตามจุดเริ่มต้นและความสม่ำเสมอ",
    multiline: true,
  },

  { key: "community.title", group: "community", label: "หัวข้อ", default: "ซ้อมด้วยกัน ลงสนามด้วยกัน" },
  {
    key: "community.desc",
    group: "community",
    label: "คำอธิบาย",
    default: "สมาชิกและเทรนเนอร์รวมทีมลงแข่ง HYROX Bangkok และ DEKA FIT",
    multiline: true,
  },

  { key: "location.title", group: "location", label: "หัวข้อ", default: "มาที่ยิม" },
  {
    key: "location.address",
    group: "location",
    label: "ที่อยู่",
    default: "ซอยสุขุมวิท 70/3 แขวงบางนาใต้ เขตบางนา กรุงเทพมหานคร 10260",
    multiline: true,
  },
  {
    key: "location.transit",
    group: "location",
    label: "การเดินทาง",
    default: "เดินจาก BTS แบริ่ง หรือ BTS บางนา 5 นาที",
    allowEmpty: true,
  },
  { key: "location.hours1_days", group: "location", label: "เวลาเปิด แถวที่ 1: วัน", default: "จันทร์ ถึง ศุกร์" },
  { key: "location.hours1_time", group: "location", label: "เวลาเปิด แถวที่ 1: เวลา", default: "06:00 – 23:00 น." },
  { key: "location.hours2_days", group: "location", label: "เวลาเปิด แถวที่ 2: วัน", default: "เสาร์ และ อาทิตย์", allowEmpty: true },
  { key: "location.hours2_time", group: "location", label: "เวลาเปิด แถวที่ 2: เวลา", default: "08:00 – 22:00 น.", allowEmpty: true },
  {
    key: "location.map_url",
    group: "location",
    label: "ลิงก์หน้าร้านบน Google Maps",
    default: "https://www.google.com/maps/search/?api=1&query=S365%20Fitness&query_place_id=ChIJhVhELruh4jARzOOXA0T1hP8",
  },
  {
    key: "location.directions_url",
    group: "location",
    label: "ลิงก์นำทางบน Google Maps",
    default: "https://www.google.com/maps/dir/?api=1&destination=S365%20Fitness&destination_place_id=ChIJhVhELruh4jARzOOXA0T1hP8",
  },
  {
    key: "location.lat",
    group: "location",
    label: "ตำแหน่งหมุดบนแผนที่ 3 มิติ: ละติจูด",
    default: "13.6653423",
    help: "แก้เฉพาะเมื่อย้ายที่ตั้ง คัดลอกตัวเลขได้จาก Google Maps (คลิกขวาที่ตำแหน่งยิม)",
  },
  { key: "location.lng", group: "location", label: "ตำแหน่งหมุดบนแผนที่ 3 มิติ: ลองจิจูด", default: "100.6012298" },

  { key: "contact.title", group: "contact", label: "ข้อความเชิญชวน", default: "อยากเริ่ม ทักมาคุยกันก่อนได้" },
  {
    key: "contact.note",
    group: "contact",
    label: "ข้อความใต้ปุ่มติดต่อ",
    default: "สอบถามแพ็กเกจและราคาได้ทางไลน์หรือโทร",
    allowEmpty: true,
  },
  { key: "contact.phone", group: "contact", label: "เบอร์โทร", default: "062-365-365-0" },
  {
    key: "contact.line_id",
    group: "contact",
    label: "LINE ID",
    default: "@s365fitness",
    help: "ปุ่มแอดไลน์และคิวอาร์โค้ดบนหน้าเว็บจะเปลี่ยนตามค่านี้เอง",
  },
  { key: "contact.facebook_name", group: "contact", label: "ชื่อเพจ Facebook", default: "S365 Fitness", allowEmpty: true },
  {
    key: "contact.facebook_url",
    group: "contact",
    label: "ลิงก์เพจ Facebook",
    default: "",
    help: "เช่น https://www.facebook.com/ชื่อเพจ ถ้าเว้นว่าง หน้าเว็บจะแสดงแค่ชื่อเพจ กดไม่ได้",
    allowEmpty: true,
  },
] as const satisfies readonly TextField[];

export type TextKey = (typeof textFields)[number]["key"];

export const defaultTexts = Object.fromEntries(textFields.map((field) => [field.key, field.default])) as Record<
  TextKey,
  string
>;

// Photo sections the owner can fill from the back office.
export type PhotoSection = "hero" | "trainers" | "zones" | "results" | "community";

export const photoSections: {
  id: PhotoSection;
  title: string;
  help: string;
  /** Label for the per-photo text field, when the section shows one. */
  titleLabel?: string;
  max?: number;
}[] = [
  { id: "hero", title: "ภาพหน้าแรก", help: "ใช้ภาพแรกในรายการ ควรเป็นภาพแนวนอน กว้างอย่างน้อย 2000 พิกเซล", max: 1 },
  { id: "trainers", title: "ภาพเทรนเนอร์", help: "ภาพแนวตั้ง 1 คนต่อ 1 ภาพ ใส่ชื่อเทรนเนอร์ในช่องชื่อ", titleLabel: "ชื่อเทรนเนอร์" },
  { id: "zones", title: "ภาพโซนในยิม", help: "เรียงตามลำดับโซนที่ 1 ถึง 4 ใช้ 4 ภาพแรก", max: 4 },
  { id: "results", title: "ภาพผลลัพธ์ของสมาชิก", help: "โปสเตอร์ก่อนและหลัง ควรได้รับอนุญาตจากสมาชิกก่อนเผยแพร่" },
  { id: "community", title: "ภาพคอมมูนิตี้", help: "ภาพแรกแสดงใหญ่ที่สุด ภาพที่ 2 และ 3 เป็นภาพแนวตั้ง ภาพถัดไปแสดงเป็นแถวเล็กด้านล่าง" },
];

export const SITE_MEDIA_BUCKET = "site-media";
