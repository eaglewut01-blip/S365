// Base for absolute URLs (link previews, QR codes). Vercel provides its
// production domain; set NEXT_PUBLIC_SITE_URL when hosting elsewhere.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
