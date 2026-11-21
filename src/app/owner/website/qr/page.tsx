import { headers } from "next/headers";
import type { ItemData } from "@/content/collections";
import { requireRole } from "@/lib/session";
import { siteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { QrSheet } from "./QrSheet";

export const metadata = { title: "ป้าย QR วิธีเล่นเครื่อง | S365 Fitness" };

// The address printed into the QR codes. A configured site address wins;
// otherwise use the address the owner is browsing on right now.
async function baseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL) return siteUrl;
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  return host ? `${list.get("x-forwarded-proto") ?? "https"}://${host}` : siteUrl;
}

export default async function QrLabelsPage() {
  await requireRole("owner");
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_items")
    .select("id, slug, data, is_visible")
    .eq("collection", "machines")
    .order("sort_order")
    .order("created_at");

  const base = await baseUrl();
  const machines = (data ?? [])
    .filter((row) => row.slug)
    .map((row) => {
      const item = (row.data ?? {}) as ItemData;
      return {
        id: row.id as string,
        slug: row.slug as string,
        name: String(item.name ?? ""),
        nameEn: typeof item.name_en === "string" ? item.name_en : "",
        hidden: row.is_visible === false,
      };
    });

  return <QrSheet base={base} machines={machines} />;
}

