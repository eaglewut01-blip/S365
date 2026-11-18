import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas-neue",
  weight: "400",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Base for absolute URLs in link previews (og:image). Vercel provides its
// production domain; set NEXT_PUBLIC_SITE_URL when hosting elsewhere.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "S365 Fitness",
  description: "ระบบบริหารจัดการฟิตเนส S365 Fitness",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" data-scroll-behavior="smooth" className={`${bebasNeue.variable} ${inter.variable} h-full`}>
      <body className="min-h-full bg-base font-body text-text-hi antialiased">{children}</body>
    </html>
  );
}
