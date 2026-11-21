// Lists the owner manages from the back office: clips, machine guides,
// articles and products. Each list is a set of rows in `site_items`; the
// fields below describe what is stored in a row's `data` and drive both the
// admin form and validation on save.

export type CollectionId = "videos" | "machines" | "articles" | "products";

export type FieldType = "text" | "textarea" | "url" | "number" | "image" | "clip" | "toggle";

export interface CollectionField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  rows?: number;
  placeholder?: string;
}

export interface CollectionDef {
  id: CollectionId;
  /** Tab label in the back office. */
  tab: string;
  /** Used in buttons: "เพิ่ม<itemLabel>". */
  itemLabel: string;
  help: string;
  /** Field shown as the row title in the admin list. */
  titleKey: string;
  /** Rows get a URL slug (their own public page). The slug is built from `slugFrom`. */
  slugFrom?: string[];
  fields: CollectionField[];
}

/** An uploaded image stored in a row. */
export interface StoredImage {
  path: string;
  width: number;
  height: number;
}

/** An uploaded short video, with a still frame captured at upload time. */
export interface StoredClip {
  path: string;
  poster: StoredImage | null;
}

export const collections: Record<CollectionId, CollectionDef> = {
  videos: {
    id: "videos",
    tab: "คลิป",
    itemLabel: "คลิป",
    help: "คลิปสั้นที่แสดงบนหน้าแรกและหน้าคลิป หน้าเว็บจะเล่นวนเฉพาะ 4 วินาทีแรกแบบไม่มีเสียง กดแล้วเปิดคลิปเต็มตามลิงก์",
    titleKey: "title",
    fields: [
      { key: "title", label: "ชื่อคลิป (ไทย)", type: "text", required: true },
      { key: "title_en", label: "ชื่อคลิป (อังกฤษ)", type: "text" },
      {
        key: "url",
        label: "ลิงก์คลิปเต็ม",
        type: "url",
        required: true,
        placeholder: "https://www.tiktok.com/@... หรือ https://www.facebook.com/...",
        help: "ลิงก์ Facebook, TikTok, Instagram หรือ YouTube ที่จะเปิดเมื่อกดคลิป",
      },
      {
        key: "clip",
        label: "ไฟล์คลิปสั้นสำหรับพรีวิว",
        type: "clip",
        help: "ไฟล์ MP4 ความยาวไม่เกิน 30 วินาที ขนาดไม่เกิน 50 MB ถ้าไม่ใส่ จะแสดงเป็นภาพนิ่ง",
      },
      { key: "cover", label: "ภาพปก (ใช้เมื่อไม่มีไฟล์คลิป)", type: "image" },
      { key: "home", label: "แสดงบนหน้าแรก", type: "toggle" },
    ],
  },
  machines: {
    id: "machines",
    tab: "เครื่อง",
    itemLabel: "เครื่อง",
    help: "วิธีเล่นของแต่ละเครื่อง แต่ละเครื่องมีหน้าของตัวเองและมี QR สำหรับพิมพ์ไปติดที่เครื่อง",
    titleKey: "name",
    slugFrom: ["name_en", "name"],
    fields: [
      { key: "name", label: "ชื่อเครื่อง (ไทย)", type: "text", required: true },
      { key: "name_en", label: "ชื่อเครื่อง (อังกฤษ)", type: "text", help: "ใช้สร้างที่อยู่หน้าเว็บของเครื่องนี้ด้วย เช่น Chest Press" },
      { key: "zone", label: "โซน", type: "text", placeholder: "แมชชีน / ฟรีเวท / ฟังก์ชันนัล / คาร์ดิโอ" },
      { key: "muscles", label: "กล้ามเนื้อที่ได้ (ไทย)", type: "text", placeholder: "อก ไหล่ด้านหน้า หลังแขน" },
      { key: "muscles_en", label: "กล้ามเนื้อที่ได้ (อังกฤษ)", type: "text" },
      { key: "steps", label: "ขั้นตอน (ไทย)", type: "textarea", rows: 6, required: true, help: "บรรทัดละ 1 ขั้นตอน" },
      { key: "steps_en", label: "ขั้นตอน (อังกฤษ)", type: "textarea", rows: 6, help: "บรรทัดละ 1 ขั้นตอน" },
      { key: "tip", label: "ข้อควรระวัง (ไทย)", type: "textarea", rows: 2 },
      { key: "tip_en", label: "ข้อควรระวัง (อังกฤษ)", type: "textarea", rows: 2 },
      { key: "photo", label: "ภาพเครื่อง", type: "image" },
      { key: "clip", label: "คลิปสาธิต", type: "clip", help: "ไฟล์ MP4 ขนาดไม่เกิน 50 MB เล่นในหน้าเว็บได้เลย" },
      { key: "url", label: "ลิงก์คลิปเต็ม (ถ้ามี)", type: "url", placeholder: "https://..." },
    ],
  },
  articles: {
    id: "articles",
    tab: "บทความ",
    itemLabel: "บทความ",
    help: "บทความเรื่องการออกกำลังกายและโภชนาการ แสดงในคอลัมน์บทความ บทความใหม่อยู่บนสุด",
    titleKey: "title",
    slugFrom: ["title_en", "title"],
    fields: [
      { key: "title", label: "หัวข้อ (ไทย)", type: "text", required: true },
      { key: "title_en", label: "หัวข้อ (อังกฤษ)", type: "text", help: "ถ้าเว้นว่าง บทความนี้จะไม่แสดงในหน้าภาษาอังกฤษ" },
      { key: "excerpt", label: "คำโปรย (ไทย)", type: "textarea", rows: 2, help: "1 ถึง 2 ประโยค แสดงในหน้ารวมบทความ" },
      { key: "excerpt_en", label: "คำโปรย (อังกฤษ)", type: "textarea", rows: 2 },
      { key: "cover", label: "ภาพปก", type: "image" },
      {
        key: "body",
        label: "เนื้อหา (ไทย)",
        type: "textarea",
        rows: 14,
        required: true,
        help: "เว้น 1 บรรทัดเพื่อขึ้นย่อหน้าใหม่ ขึ้นต้นบรรทัดด้วย ## เพื่อทำหัวข้อย่อย ขึ้นต้นด้วย - เพื่อทำรายการ",
      },
      { key: "body_en", label: "เนื้อหา (อังกฤษ)", type: "textarea", rows: 14 },
      { key: "author", label: "ผู้เขียน", type: "text", placeholder: "PT Jeeno" },
    ],
  },
  products: {
    id: "products",
    tab: "สินค้า",
    itemLabel: "สินค้า",
    help: "สินค้าที่แสดงในหน้าร้านค้า ลูกค้ากดสั่งซื้อผ่านไลน์ หรือผ่านลิงก์ที่ใส่ไว้",
    titleKey: "name",
    fields: [
      { key: "name", label: "ชื่อสินค้า (ไทย)", type: "text", required: true },
      { key: "name_en", label: "ชื่อสินค้า (อังกฤษ)", type: "text" },
      { key: "category", label: "หมวด", type: "text", placeholder: "เวย์โปรตีน / เสื้อผ้า" },
      { key: "price", label: "ราคาขาย (บาท)", type: "number", required: true },
      { key: "old_price", label: "ราคาเดิม (บาท) ถ้าลดราคา", type: "number" },
      { key: "desc", label: "รายละเอียด (ไทย)", type: "textarea", rows: 3, help: "ข้อมูลสรรพคุณให้ใช้ตามฉลากสินค้าเท่านั้น" },
      { key: "desc_en", label: "รายละเอียด (อังกฤษ)", type: "textarea", rows: 3 },
      { key: "photo", label: "ภาพสินค้า", type: "image", required: true },
      { key: "url", label: "ลิงก์สั่งซื้อ (ถ้าไม่ใส่ จะใช้ไลน์ของยิม)", type: "url", placeholder: "https://..." },
      { key: "sold_out", label: "สินค้าหมด", type: "toggle" },
    ],
  },
};

export const collectionIds = Object.keys(collections) as CollectionId[];

export type ItemData = Record<string, unknown>;

/** Text of a field in the given language; English falls back to Thai when it was left empty. */
export function itemText(data: ItemData, key: string, locale: "th" | "en"): string {
  const english = locale === "en" ? data[`${key}_en`] : undefined;
  const value = typeof english === "string" && english.trim() ? english : data[key];
  return typeof value === "string" ? value.trim() : "";
}

export function itemImage(data: ItemData, key: string): StoredImage | null {
  const value = data[key] as Partial<StoredImage> | undefined;
  return value && typeof value.path === "string" && Number(value.width) > 0 && Number(value.height) > 0
    ? { path: value.path, width: Number(value.width), height: Number(value.height) }
    : null;
}

export function itemClip(data: ItemData, key: string): StoredClip | null {
  const value = data[key] as { path?: unknown; poster?: unknown } | undefined;
  if (!value || typeof value.path !== "string") return null;
  return { path: value.path, poster: itemImage({ poster: value.poster }, "poster") };
}

/** Lines of a multi-line field, without empty lines or list markers. */
export function itemLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-•]|\d+[.)])\s*/, "").trim())
    .filter(Boolean);
}
