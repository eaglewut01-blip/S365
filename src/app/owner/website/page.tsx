import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { publicPhotoUrl } from "@/lib/site-content";
import type { PhotoSection } from "@/content/site-texts";
import type { CollectionId, ItemData } from "@/content/collections";
import type { AdminItem } from "./CollectionEditor";
import { WebsiteClient, type AdminPhoto } from "./WebsiteClient";

export default async function WebsitePage() {
  await requireRole("owner");
  const supabase = await createClient();

  const [texts, photos, items] = await Promise.all([
    supabase.from("site_texts").select("key, value"),
    supabase
      .from("site_photos")
      .select("id, section, storage_path, title, caption, width, height, is_visible")
      .order("sort_order")
      .order("created_at"),
    supabase.from("site_items").select("id, collection, slug, data, is_visible, sort_order, created_at").order("sort_order").order("created_at"),
  ]);

  // Both tables come from supabase/website-cms.sql; an error here almost always means it has not been run yet.
  const setupNeeded = Boolean(texts.error || photos.error || items.error);

  const overrides: Record<string, string> = {};
  for (const row of texts.data ?? []) overrides[row.key as string] = row.value as string;

  const adminPhotos: AdminPhoto[] = (photos.data ?? []).map((row) => ({
    id: row.id as string,
    section: row.section as PhotoSection,
    url: publicPhotoUrl(row.storage_path as string),
    title: (row.title as string | null) ?? "",
    caption: (row.caption as string | null) ?? "",
    width: row.width as number,
    height: row.height as number,
    isVisible: row.is_visible as boolean,
  }));

  const adminItems: AdminItem[] = (items.data ?? []).map((row) => ({
    id: row.id as string,
    collection: row.collection as CollectionId,
    slug: (row.slug as string | null) ?? null,
    data: (row.data ?? {}) as ItemData,
    isVisible: row.is_visible as boolean,
  }));
  // Articles read newest first, like on the public site.
  const created = new Map((items.data ?? []).map((row) => [row.id as string, row.created_at as string]));
  adminItems.sort((a, b) =>
    a.collection === "articles" && b.collection === "articles" ? (created.get(b.id) ?? "").localeCompare(created.get(a.id) ?? "") : 0
  );

  return (
    <WebsiteClient
      overrides={overrides}
      photos={adminPhotos}
      items={adminItems}
      mediaBase={publicPhotoUrl("").replace(/\/$/, "")}
      setupNeeded={setupNeeded}
    />
  );
}
