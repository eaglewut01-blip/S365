import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { CollectionId, ItemData } from "@/content/collections";

export interface SiteItem {
  id: string;
  slug: string | null;
  data: ItemData;
  createdAt: string;
}

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co/.test(url)) return null;
  return { url: url.replace(/\/$/, ""), key };
}

function publicClient() {
  const config = supabaseConfig();
  return config ? createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

// Visible rows of one list, in the owner's order (articles: newest first).
// Read with the public key and no cookies so pages stay cacheable; any
// failure (including Supabase not being set up yet) gives an empty list.
export const getItems = cache(async (collection: CollectionId): Promise<SiteItem[]> => {
  const supabase = publicClient();
  if (!supabase) return [];
  try {
    let query = supabase.from("site_items").select("id, slug, data, created_at").eq("collection", collection).eq("is_visible", true);
    query =
      collection === "articles"
        ? query.order("created_at", { ascending: false })
        : query.order("sort_order").order("created_at");
    const { data } = await query.abortSignal(AbortSignal.timeout(5000));
    return (data ?? []).map((row) => ({
      id: row.id as string,
      slug: (row.slug as string | null) ?? null,
      data: (row.data ?? {}) as ItemData,
      createdAt: row.created_at as string,
    }));
  } catch {
    return [];
  }
});

export async function getItemBySlug(collection: CollectionId, slug: string): Promise<SiteItem | null> {
  const items = await getItems(collection);
  return items.find((item) => item.slug === slug) ?? null;
}

export interface CrowdData {
  now: number;
  peak: number;
  daysOfData: number;
  hourly: { hour: number; avg: number }[];
}

// Counts only (see gym_crowd() in supabase/website-cms.sql). Null when the
// database is not reachable or the function has not been installed.
export async function getCrowd(): Promise<CrowdData | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("gym_crowd").abortSignal(AbortSignal.timeout(5000));
    if (error || !data) return null;
    const raw = data as { now?: number; peak?: number; days_of_data?: number; hourly?: { hour: number; avg: number }[] };
    return {
      now: Number(raw.now ?? 0),
      peak: Number(raw.peak ?? 0),
      daysOfData: Number(raw.days_of_data ?? 0),
      hourly: (raw.hourly ?? []).map((row) => ({ hour: Number(row.hour), avg: Number(row.avg) })),
    };
  } catch {
    return null;
  }
}
