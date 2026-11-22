import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Public pages are open to search engines; the staff and member areas are not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/owner", "/trainer", "/member", "/login", "/auth", "/forgot-password", "/reset-password", "/dev-preview"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
