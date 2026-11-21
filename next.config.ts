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
  // The meal planner page was taken down; send old links to the tools list.
  async redirects() {
    return [
      { source: "/tools/meal-plan", destination: "/tools", permanent: false },
      { source: "/en/tools/meal-plan", destination: "/en/tools", permanent: false },
    ];
  },
};

export default nextConfig;
