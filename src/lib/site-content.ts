import { cache } from "react";
import type { StaticImageData } from "next/image";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import {
  classPhotos,
  communityHighlights,
  eventPhotos,
  gymPhotos,
  results as defaultResults,
  trainers as defaultTrainers,
  wall,
  zonePhotos,
} from "@/content/media";
import { getItems } from "./site-items";
import {
  defaultTexts,
  englishDefault,
  SITE_MEDIA_BUCKET,
  storageKey,
  textFields,
  type Locale,
  type PhotoSection,
  type TextKey,
} from "@/content/site-texts";
import { uiStrings, type UiStrings } from "@/content/ui-strings";

// A photo on the public site: either one built into the code (static import)
// or one the owner uploaded to Supabase Storage (URL plus stored dimensions).
export interface SitePhoto {
  src: StaticImageData | string;
  width?: number;
  height?: number;
  alt: string;
  title?: string;
  /** Short line under the title, e.g. a trainer's specialties. */
  caption?: string;
  /** CSS object-position for cropped tiles, when the subject is off-centre. */
  position?: string;
}

export interface SiteContent {
  locale: Locale;
  /** Fixed interface wording for this language. */
  ui: UiStrings;
  /** Editable texts for this language. */
  t: Record<TextKey, string>;
  contact: {
    phoneDisplay: string;
    phoneHref: string;
    lineId: string;
    lineHref: string;
    /** QR code (inline SVG) for lineHref, so desktop visitors can scan it. */
    lineQrSvg: string;
    facebookName: string;
    facebookHref: string | null;
  };
  hours: { days: string; time: string }[];
  geo: { lat: number; lng: number };
  tickerItems: string[];
  classes: { title: string; items: string[]; note: string };
  zones: { title: string; label: string; text: string }[];
  photos: {
    hero: SitePhoto;
    trainers: SitePhoto[];
    zones: SitePhoto[];
    results: SitePhoto[];
    community: SitePhoto[];
    /** Every community photo, for the community page. */
    communityAll: SitePhoto[];
    /** More photos of the gym floor, for the gym page. */
    gymGallery: SitePhoto[];
  };
  /** Which optional parts of the site have something to show (decides the header links). */
  has: { videos: boolean; articles: boolean; shop: boolean };
}

interface TextRow {
  key: string;
  value: string;
}

interface PhotoRow {
  section: PhotoSection;
  storage_path: string;
  title: string | null;
  caption?: string | null;
  alt: string | null;
  width: number;
  height: number;
}

const ZONE_LABELS = ["MACHINE", "FREE WEIGHT", "FUNCTIONAL", "CARDIO"];
const allowEmptyKeys = new Set<string>(textFields.filter((f) => "allowEmpty" in f && f.allowEmpty).map((f) => f.key));

function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co/.test(url)) return null;
  return { url: url.replace(/\/$/, ""), key };
}

export function publicPhotoUrl(storagePath: string) {
  const config = supabaseConfig();
  return config ? `${config.url}/storage/v1/object/public/${SITE_MEDIA_BUCKET}/${storagePath}` : "";
}

// Reads the owner's edits with the public (anon) key and no cookies, so the
// home page stays cacheable. Any failure falls back to the built-in content.
async function loadOverrides(): Promise<{ texts: TextRow[]; photos: PhotoRow[] }> {
  const config = supabaseConfig();
  if (!config) return { texts: [], photos: [] };

  try {
    const supabase = createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false } });
    const [texts, photos] = await Promise.all([
      supabase.from("site_texts").select("key, value").abortSignal(AbortSignal.timeout(5000)),
      supabase
        .from("site_photos")
        // All columns, so the page keeps working whether or not the newer optional columns exist yet.
        .select("*")
        .eq("is_visible", true)
        .order("sort_order")
        .order("created_at")
        .abortSignal(AbortSignal.timeout(5000)),
    ]);
    return { texts: (texts.data ?? []) as TextRow[], photos: (photos.data ?? []) as PhotoRow[] };
  } catch {
    return { texts: [], photos: [] };
  }
}

function toSitePhoto(row: PhotoRow, fallbackAlt: string): SitePhoto {
  return {
    src: publicPhotoUrl(row.storage_path),
    width: row.width,
    height: row.height,
    alt: row.alt?.trim() || fallbackAlt,
    title: row.title?.trim() || undefined,
    caption: row.caption?.trim() || undefined,
  };
}

// English alt text for the built-in photos, whose own descriptions are written in Thai.
function withEnglishAlt(photos: SitePhoto[], describe: (photo: SitePhoto, index: number) => string): SitePhoto[] {
  return photos.map((photo, i) => (typeof photo.src === "string" ? photo : { ...photo, alt: describe(photo, i) }));
}

export const getSiteContent = cache(async (locale: Locale = "th"): Promise<SiteContent> => {
  const overrides = await loadOverrides();
  const saved = new Map(overrides.texts.map((row) => [row.key, row.value]));

  // Start from the built-in text for this language, then apply what the owner
  // saved. English falls back to the built-in English, never to edited Thai.
  const t = { ...defaultTexts };
  for (const field of textFields) {
    const value = saved.get(storageKey(locale, field.key));
    if (value !== undefined && (value.trim() !== "" || allowEmptyKeys.has(field.key))) t[field.key] = value;
    else if (locale === "en") t[field.key] = englishDefault(field);
  }

  const uploaded = (section: PhotoSection) => overrides.photos.filter((photo) => photo.section === section);
  const pick = (section: PhotoSection, fallback: SitePhoto[], describe: (row: PhotoRow) => string, max?: number) => {
    const rows = uploaded(section);
    if (rows.length === 0) return fallback;
    return rows.slice(0, max).map((row) => toSitePhoto(row, describe(row)));
  };

  const trainers = pick(
    "trainers",
    defaultTrainers.map((trainer) => ({ src: trainer.src, alt: trainer.alt, title: trainer.name })),
    (row) => `เทรนเนอร์ ${row.title ?? ""} ของ S365 Fitness`.replace(/\s+/g, " ")
  );
  const zoneTitles = [t["zone1.title"], t["zone2.title"], t["zone3.title"], t["zone4.title"]];
  const zoneTexts = [t["zone1.text"], t["zone2.text"], t["zone3.text"], t["zone4.text"]];
  // Uploaded zone photos replace the built-in ones position by position.
  const uploadedZones = uploaded("zones").slice(0, 4);
  const zonePhotoList = zonePhotos.map((fallback, i) =>
    uploadedZones[i] ? toSitePhoto(uploadedZones[i], `โซน${zoneTitles[i]}ของ S365 Fitness`) : fallback
  );

  const phoneDisplay = t["contact.phone"];
  const lineId = t["contact.line_id"].trim();
  const lineHref = `https://line.me/R/ti/p/${encodeURIComponent(lineId.startsWith("@") ? lineId : `~${lineId}`)}`;
  const facebookUrl = t["contact.facebook_url"].trim();
  const lat = Number.parseFloat(t["location.lat"]);
  const lng = Number.parseFloat(t["location.lng"]);

  const [videoItems, articleItems, productItems] = await Promise.all([getItems("videos"), getItems("articles"), getItems("products")]);
  const communityFallback = [...communityHighlights, ...classPhotos, ...eventPhotos].filter(
    (photo, i, all) => all.findIndex((other) => other.src === photo.src) === i
  );

  const localized = (photos: SitePhoto[], describe: (photo: SitePhoto, index: number) => string) =>
    locale === "en" ? withEnglishAlt(photos, describe) : photos;

  return {
    locale,
    ui: uiStrings[locale],
    t,
    contact: {
      phoneDisplay,
      phoneHref: `tel:${phoneDisplay.replace(/[^\d+]/g, "")}`,
      lineId,
      lineHref,
      lineQrSvg: await QRCode.toString(lineHref, {
        type: "svg",
        errorCorrectionLevel: "M",
        margin: 3,
        color: { dark: "#0a0a0b", light: "#ffffff" },
      }),
      facebookName: t["contact.facebook_name"],
      facebookHref: /^https?:\/\//.test(facebookUrl) ? facebookUrl : null,
    },
    hours: [
      { days: t["location.hours1_days"], time: t["location.hours1_time"] },
      { days: t["location.hours2_days"], time: t["location.hours2_time"] },
    ].filter((row) => row.days.trim() || row.time.trim()),
    geo: {
      lat: Number.isFinite(lat) ? lat : Number.parseFloat(defaultTexts["location.lat"]),
      lng: Number.isFinite(lng) ? lng : Number.parseFloat(defaultTexts["location.lng"]),
    },
    tickerItems: t["ticker.items"]
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    classes: {
      title: t["classes.title"],
      items: t["classes.items"]
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      note: t["classes.note"],
    },
    zones: zoneTitles.map((title, i) => ({ title, label: ZONE_LABELS[i], text: zoneTexts[i] })),
    photos: {
      hero: localized(pick("hero", [wall], () => "ภาพบรรยากาศภายในยิม S365 Fitness", 1), () =>
        "Machine zone at S365 Fitness with the digit wall 0123465789, the 3, 6 and 5 in yellow"
      )[0],
      trainers: localized(trainers, (photo) => `Trainer ${photo.title ?? ""} at S365 Fitness`.replace(/\s+/g, " ")),
      zones: localized(zonePhotoList, (_, i) => `${zoneTitles[i]} zone at S365 Fitness`),
      results: localized(
        pick("results", defaultResults, () => "ผลลัพธ์ก่อนและหลังของสมาชิก S365 Fitness"),
        () => "Before and after result of an S365 Fitness member"
      ),
      community: localized(
        pick("community", communityHighlights, () => "สมาชิกและเทรนเนอร์ของ S365 Fitness"),
        () => "S365 Fitness members and trainers"
      ),
      communityAll: localized(
        pick("community", communityFallback, () => "สมาชิกและเทรนเนอร์ของ S365 Fitness"),
        () => "S365 Fitness members and trainers"
      ),
      // Skip the built-in photos that already illustrate a zone.
      gymGallery: localized(
        gymPhotos.filter((photo) => !zonePhotoList.some((zone) => zone.src === photo.src)),
        () => "Inside S365 Fitness"
      ),
    },
    has: {
      videos: videoItems.length > 0,
      articles: articleItems.some((item) => locale === "th" || (typeof item.data.title_en === "string" && item.data.title_en.trim() !== "")),
      shop: productItems.length > 0,
    },
  };
});
