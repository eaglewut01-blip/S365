import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { SiteNav } from "@/components/site/SiteNav";
import { Hero } from "@/components/site/Hero";
import { Ticker } from "@/components/site/Ticker";
import { Gym } from "@/components/site/Gym";
import { Trainers } from "@/components/site/Trainers";
import { Results } from "@/components/site/Results";
import { Community } from "@/components/site/Community";
import { Location } from "@/components/site/Location";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";
import { MobileCtaBar } from "@/components/site/MobileCtaBar";
import { getSiteContent } from "@/lib/site-content";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const description =
  "S365 Fitness ยิมที่มีเครื่องเวท ฟรีเวท และโซนฟังก์ชันนัล พร้อมเทรนเนอร์ส่วนตัวและเซสชันกลุ่ม ติดต่อ LINE @s365fitness หรือโทร 062-365-365-0";

export const metadata: Metadata = {
  title: "S365 Fitness | ยิมและเทรนเนอร์ส่วนตัว",
  description,
  openGraph: {
    title: "S365 Fitness",
    description,
    type: "website",
    locale: "th_TH",
  },
};

// The page is prerendered and refreshed in the background: at most every
// 5 minutes, and immediately after the owner saves a change in /owner/website.
export const revalidate = 300;

export default async function HomePage() {
  const content = await getSiteContent();

  return (
    <div id="top" className={`${kanit.variable} font-thai`}>
      <SiteNav content={content} />
      <main>
        <Hero content={content} />
        <Ticker items={content.tickerItems} />
        <Trainers content={content} />
        <Gym content={content} />
        <Results content={content} />
        <Community content={content} />
        <Location content={content} />
        <Contact content={content} />
      </main>
      <SiteFooter />
      <MobileCtaBar content={content} />
    </div>
  );
}
