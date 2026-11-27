import { headers } from "next/headers";
import { siteUrl } from "@/lib/site-url";

// The address the visitor is using right now, e.g. "https://www.example.com".
// Links in invite and password emails point back here, so they always open
// on a host that is serving the app.
export async function requestOrigin() {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host");
  if (!host) return siteUrl;
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
