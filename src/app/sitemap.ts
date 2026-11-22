import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// The fixed public pages, in Thai and English. Pages generated from the database
// (articles, machines) are found by search engines through the links on these pages.
const paths = [
  "",
  "/gym",
  "/trainers",
  "/machines",
  "/results",
  "/articles",
  "/videos",
  "/community",
  "/contact",
  "/tools",
  "/tools/bmi",
  "/tools/workout-plan",
  "/tools/crowd",
  "/guides/home-workout",
  "/guides/pre-workout-stretching",
  "/guides/stretching",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return paths.flatMap((path) => {
    const th = `${siteUrl}${path || "/"}`;
    const en = `${siteUrl}/en${path}`;
    const alternates = { languages: { th, en } };
    return [
      { url: th, alternates, priority: path === "" ? 1 : 0.7 },
      { url: en, alternates, priority: path === "" ? 0.9 : 0.6 },
    ];
  });
}
