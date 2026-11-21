import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { publicPhotoUrl } from "@/lib/site-content";
import type { PhotoSection } from "@/content/site-texts";
import { WebsiteClient, type AdminPhoto } from "./WebsiteClient";

export default async function WebsitePage() {
  await requireRole("owner");
  const supabase = await createClient();

  const [texts, photos] = await Promise.all([
    supabase.from("site_texts").select("key, value"),
    supabase
      .from("site_photos")
      .select("id, section, storage_path, title, width, height, is_visible")
      .order("sort_order")
      .order("created_at"),
  ]);

  // Both tables come from supabase/website-cms.sql; an error here almost always means it has not been run yet.
  const setupNeeded = Boolean(texts.error || photos.error);

  const overrides: Record<string, string> = {};
  for (const row of texts.data ?? []) overrides[row.key as string] = row.value as string;

  const adminPhotos: AdminPhoto[] = (photos.data ?? []).map((row) => ({
    id: row.id as string,
    section: row.section as PhotoSection,
    url: publicPhotoUrl(row.storage_path as string),
    title: (row.title as string | null) ?? "",
    width: row.width as number,
    height: row.height as number,
    isVisible: row.is_visible as boolean,
  }));

  return <WebsiteClient overrides={overrides} photos={adminPhotos} setupNeeded={setupNeeded} />;
}
