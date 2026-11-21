"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { SITE_MEDIA_BUCKET } from "@/content/site-texts";
import { collections, type CollectionId, type ItemData } from "@/content/collections";

type ActionResult = { success: true } | { error: string };

const PATH_PATTERN = /^(videos|machines|articles|products)\/[0-9a-f-]{36}\.(jpg|mp4|webm|mov)$/;

function refresh() {
  revalidatePath("/", "layout");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function cleanImage(value: unknown) {
  const image = value as { path?: unknown; width?: unknown; height?: unknown } | null;
  if (!image || typeof image.path !== "string" || !PATH_PATTERN.test(image.path)) return null;
  const width = Math.round(Number(image.width));
  const height = Math.round(Number(image.height));
  return width > 0 && height > 0 ? { path: image.path, width, height } : null;
}

// Keeps only the fields defined for the list and checks each one, so the
// stored JSON can be trusted by the public pages.
function cleanData(collection: CollectionId, input: ItemData): { data: ItemData } | { error: string } {
  const data: ItemData = {};
  for (const field of collections[collection].fields) {
    const raw = input[field.key];
    let value: unknown = null;

    if (field.type === "toggle") value = raw === true;
    else if (field.type === "image") value = cleanImage(raw);
    else if (field.type === "clip") {
      const clip = raw as { path?: unknown; poster?: unknown } | null;
      value = clip && typeof clip.path === "string" && PATH_PATTERN.test(clip.path) ? { path: clip.path, poster: cleanImage(clip.poster) } : null;
    } else if (field.type === "number") {
      const text = String(raw ?? "").replace(/,/g, "").trim();
      if (text) {
        const number = Number(text);
        if (!Number.isFinite(number) || number < 0) return { error: `"${field.label}" ต้องเป็นตัวเลข` };
        value = number;
      }
    } else {
      const text = String(raw ?? "").replace(/\r\n/g, "\n").trim();
      if (text && field.type === "url" && !/^https?:\/\/\S+$/.test(text)) {
        return { error: `"${field.label}" ต้องเป็นลิงก์ที่ขึ้นต้นด้วย https://` };
      }
      value = text || null;
    }

    if (field.required && (value === null || value === "")) return { error: `กรุณาใส่ "${field.label}"` };
    if (value !== null && value !== false) data[field.key] = value;
  }
  return { data };
}

export async function saveItem(input: { id?: string; collection: CollectionId; data: ItemData }): Promise<ActionResult> {
  const owner = await requireRole("owner");
  const def = collections[input.collection];
  if (!def) return { error: "ไม่รู้จักรายการนี้" };

  const cleaned = cleanData(input.collection, input.data);
  if ("error" in cleaned) return cleaned;
  const supabase = await createClient();

  if (input.id) {
    const { error } = await supabase
      .from("site_items")
      .update({ data: cleaned.data, updated_at: new Date().toISOString() })
      .eq("id", input.id)
      .eq("collection", input.collection);
    if (error) return { error: error.message };
  } else {
    let slug: string | null = null;
    if (def.slugFrom) {
      // The address of the item's page: from the English name when it has one, never changed afterwards
      // so printed QR codes and shared links keep working.
      const base = def.slugFrom.map((key) => slugify(String(cleaned.data[key] ?? ""))).find(Boolean) || def.id.replace(/s$/, "");
      const { data: taken } = await supabase.from("site_items").select("slug").eq("collection", input.collection).like("slug", `${base}%`);
      const used = new Set((taken ?? []).map((row) => row.slug as string));
      slug = base;
      for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    }

    const { data: last } = await supabase
      .from("site_items")
      .select("sort_order")
      .eq("collection", input.collection)
      .order("sort_order", { ascending: false })
      .limit(1);

    const { error } = await supabase.from("site_items").insert({
      collection: input.collection,
      slug,
      data: cleaned.data,
      sort_order: (last?.[0]?.sort_order ?? 0) + 1,
      created_by: owner.id,
    });
    if (error) return { error: error.message };
  }

  refresh();
  return { success: true };
}

export async function setItemVisible(id: string, isVisible: boolean): Promise<ActionResult> {
  await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("site_items").update({ is_visible: isVisible }).eq("id", id);
  if (error) return { error: error.message };
  refresh();
  return { success: true };
}

export async function moveItem(id: string, direction: "up" | "down"): Promise<ActionResult> {
  await requireRole("owner");
  const supabase = await createClient();

  const { data: item } = await supabase.from("site_items").select("collection").eq("id", id).single();
  if (!item) return { error: "ไม่พบรายการนี้" };
  const { data: rows, error } = await supabase
    .from("site_items")
    .select("id")
    .eq("collection", item.collection)
    .order("sort_order")
    .order("created_at");
  if (error || !rows) return { error: error?.message ?? "โหลดรายการไม่สำเร็จ" };

  const ids = rows.map((row) => row.id as string);
  const from = ids.indexOf(id);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= ids.length) return { success: true };
  [ids[from], ids[to]] = [ids[to], ids[from]];
  for (const [index, rowId] of ids.entries()) {
    const { error: updateError } = await supabase.from("site_items").update({ sort_order: index + 1 }).eq("id", rowId);
    if (updateError) return { error: updateError.message };
  }

  refresh();
  return { success: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  await requireRole("owner");
  const supabase = await createClient();

  const { data: item } = await supabase.from("site_items").select("data").eq("id", id).single();
  if (!item) return { error: "ไม่พบรายการนี้" };
  const { error } = await supabase.from("site_items").delete().eq("id", id);
  if (error) return { error: error.message };

  // Remove the uploaded files that belonged to the row; the row is already gone if this fails.
  const paths: string[] = [];
  for (const value of Object.values((item.data ?? {}) as ItemData)) {
    const media = value as { path?: unknown; poster?: { path?: unknown } | null } | null;
    if (media && typeof media.path === "string") paths.push(media.path);
    if (media?.poster && typeof media.poster.path === "string") paths.push(media.poster.path);
  }
  if (paths.length > 0) await supabase.storage.from(SITE_MEDIA_BUCKET).remove(paths);

  refresh();
  return { success: true };
}
