import type { NextConfig } from "next";

// Photos uploaded from the back office are served from this project's
// Supabase Storage; allow next/image to optimise them.
const remotePatterns: NonNullable<NonNullable<NextConfig["images"]>["remotePatterns"]> = [];
try {
  const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
  if (supabase.protocol === "https:") {
    remotePatterns.push({
      protocol: "https",
      hostname: supabase.hostname,
      pathname: "/storage/v1/object/public/**",
    });
  }
} catch {
  // Supabase is not configured yet: the site only uses its built-in photos.
}

const nextConfig: NextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
