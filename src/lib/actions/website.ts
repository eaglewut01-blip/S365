"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { communityHighlights, results, trainers, wall, zonePhotos } from "@/content/media";
import {
  englishDefault,
  photoSections,
  SITE_MEDIA_BUCKET,
  storageKey,
  textFields,
  type Locale,
  type PhotoSection,
} from "@/content/site-texts";

type ActionResult = { success: true } | { error: string };

const SECTION_IDS = new Set<string>(photoSections.map((section) => section.id));
const URL_KEYS = new Set(["location.map_url", "location.directions_url", "contact.facebook_url"]);
const NUMBER_KEYS = new Set(["location.lat", "location.lng"]);

// The public pages (Thai and English) are prerendered; refresh them and this admin page after every change.
function refresh() {
  // "layout" refreshes every public page, since they all show the contact details.
  revalidatePath("/", "layout");
  revalidatePath("/owner/website");
}

export async function saveSiteTexts(formData: FormData): Promise<ActionResult> {
  const owner = await requireRole("owner");
  const supabase = await createClient();

  const locale: Locale = formData.get("locale") === "en" ? "en" : "th";
  const changed: { key: string; value: string; updated_at: string; updated_by: string }[] = [];
  const backToDefault: string[] = [];

  for (const field of textFields) {
    const raw = formData.get(field.key);
    if (raw === null) continue;
    // Phone, links and map position have one value for both languages and are saved from the Thai tab only.
    const shared = "shared" in field && field.shared === true;
    if (locale === "en" && shared) continue;
    const builtIn = locale === "en" ? englishDefault(field) : field.default;
    const key = storageKey(locale, field.key);
    const value = String(raw).replace(/\r\n/g, "\n").trim();
    const allowEmpty = "allowEmpty" in field && field.allowEmpty === true;

    if (value && URL_KEYS.has(field.key) && !/^https?:\/\/\S+$/.test(value)) {
      return { error: `"${field.label}" ต้องเป็นลิงก์ที่ขึ้นต้นด้วย https://` };
    }
    if (value && NUMBER_KEYS.has(field.key) && !Number.isFinite(Number(value))) {
      return { error: `"${field.label}" ต้องเป็นตัวเลข` };
    }

    // A value equal to the built-in default is not stored, so later changes to the default still apply.
    if (value === builtIn || (value === "" && !allowEmpty)) backToDefault.push(key);
    else changed.push({ key, value, updated_at: new Date().toISOString(), updated_by: owner.id });
  }

  if (changed.length > 0) {
    const { error } = await supabase.from("site_texts").upsert(changed);
    if (error) return { error: error.message };
  }
  if (backToDefault.length > 0) {
    const { error } = await supabase.from("site_texts").delete().in("key", backToDefault);
    if (error) return { error: error.message };
  }

  refresh();
  return { success: true };
}

async function nextSortOrder(supabase: Awaited<ReturnType<typeof createClient>>, section: PhotoSection) {
  const { data } = await supabase
    .from("site_photos")
    .select("sort_order")
    .eq("section", section)
    .order("sort_order", { ascending: false })
    .limit(1);
  return (data?.[0]?.sort_order ?? 0) + 1;
}

// Called after the browser has uploaded the (already shrunk) file to Storage.
export async function addSitePhoto(input: {
  section: PhotoSection;
  storagePath: string;
  width: number;
  height: number;
  title?: string;
}): Promise<ActionResult> {
  const owner = await requireRole("owner");
  if (!SECTION_IDS.has(input.section)) return { error: "ไม่รู้จักหมวดภาพนี้" };
  if (!new RegExp(`^${input.section}/[0-9a-f-]{36}\\.jpg$`).test(input.storagePath)) return { error: "ที่อยู่ไฟล์ไม่ถูกต้อง" };
  if (!Number.isInteger(input.width) || !Number.isInteger(input.height) || input.width < 1 || input.height < 1) {
    return { error: "ขนาดภาพไม่ถูกต้อง" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("site_photos").insert({
    section: input.section,
    storage_path: input.storagePath,
    width: input.width,
    height: input.height,
    title: input.title?.trim() || null,
    sort_order: await nextSortOrder(supabase, input.section),
    created_by: owner.id,
  });
  if (error) return { error: error.message };

  refresh();
  return { success: true };
}

export async function updateSitePhoto(
  id: string,
  patch: { title?: string; is_visible?: boolean }
): Promise<ActionResult> {
  await requireRole("owner");
  const supabase = await createClient();

  const update: { title?: string | null; is_visible?: boolean } = {};
  if (patch.title !== undefined) update.title = patch.title.trim() || null;
  if (patch.is_visible !== undefined) update.is_visible = patch.is_visible;

  const { error } = await supabase.from("site_photos").update(update).eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return { success: true };
}

export async function moveSitePhoto(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireRole("owner");
  const supabase = await createClient();

  const { data: photo } = await supabase.from("site_photos").select("section").eq("id", id).single();
  if (!photo) return { error: "ไม่พบภาพนี้" };

  const { data: rows, error } = await supabase
    .from("site_photos")
    .select("id")
    .eq("section", photo.section)
    .order("sort_order")
    .order("created_at");
  if (error || !rows) return { error: error?.message ?? "โหลดรายการภาพไม่สำเร็จ" };

  const ids = rows.map((row) => row.id as string);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return { success: true };
  [ids[from], ids[to]] = [ids[to], ids[from]];

  // Renumber the whole section so the order never depends on old gaps or ties.
  for (const [index, rowId] of ids.entries()) {
    const { error: updateError } = await supabase.from("site_photos").update({ sort_order: index + 1 }).eq("id", rowId);
    if (updateError) return { error: updateError.message };
  }

  refresh();
  return { success: true };
}

export async function deleteSitePhoto(id: string): Promise<ActionResult> {
  await requireRole("owner");
  const supabase = await createClient();

  const { data: photo } = await supabase.from("site_photos").select("storage_path").eq("id", id).single();
  if (!photo) return { error: "ไม่พบภาพนี้" };

  const { error } = await supabase.from("site_photos").delete().eq("id", id);
  if (error) return { error: error.message };
  // The row is gone, so the site no longer shows the photo even if removing the file fails.
  await supabase.storage.from(SITE_MEDIA_BUCKET).remove([photo.storage_path]);

  refresh();
  return { success: true };
}

// Copies the photos built into the site for one section into Storage, so the
// owner can then hide, reorder, rename or delete them one by one instead of
// starting that section from nothing.
export async function importBuiltInPhotos(section: PhotoSection): Promise<ActionResult> {
  const owner = await requireRole("owner");
  if (!SECTION_IDS.has(section)) return { error: "ไม่รู้จักหมวดภาพนี้" };
  const supabase = await createClient();

  const { count } = await supabase.from("site_photos").select("id", { count: "exact", head: true }).eq("section", section);
  if ((count ?? 0) > 0) return { error: "หมวดนี้มีภาพที่อัปโหลดแล้ว จึงไม่คัดลอกภาพชุดเดิมซ้ำ" };

  const builtIn = {
    hero: [{ ...wall, title: undefined }],
    trainers: trainers.map((trainer) => ({ ...trainer, title: trainer.name })),
    zones: zonePhotos.map((photo) => ({ ...photo, title: undefined })),
    results: results.map((photo) => ({ ...photo, title: undefined })),
    community: communityHighlights.map((photo) => ({ ...photo, title: undefined })),
  }[section];

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  if (!host) return { error: "ไม่ทราบที่อยู่ของเว็บ จึงคัดลอกภาพไม่ได้" };
  const origin = `${requestHeaders.get("x-forwarded-proto") ?? "https"}://${host}`;

  let order = 1;
  for (const photo of builtIn) {
    const response = await fetch(new URL(photo.src.src, origin));
    if (!response.ok) return { error: `ดึงภาพชุดเดิมไม่สำเร็จ (${response.status})` };

    const storagePath = `${section}/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(SITE_MEDIA_BUCKET)
      .upload(storagePath, await response.arrayBuffer(), { contentType: "image/jpeg", cacheControl: "31536000" });
    if (uploadError) return { error: uploadError.message };

    const { error } = await supabase.from("site_photos").insert({
      section,
      storage_path: storagePath,
      width: photo.src.width,
      height: photo.src.height,
      title: photo.title ?? null,
      alt: photo.alt,
      sort_order: order++,
      created_by: owner.id,
    });
    if (error) return { error: error.message };
  }

  refresh();
  return { success: true };
}
