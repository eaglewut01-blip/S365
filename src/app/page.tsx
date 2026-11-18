import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import { SiteNav } from "@/components/site/SiteNav";
import { Hero } from "@/components/site/Hero";
import { Gym } from "@/components/site/Gym";
import { Trainers } from "@/components/site/Trainers";
import { Results } from "@/components/site/Results";
import { Community } from "@/components/site/Community";
import { Contact } from "@/components/site/Contact";
import { SiteFooter } from "@/components/site/SiteFooter";

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

export default function HomePage() {
  return (
    <div id="top" className={`${kanit.variable} font-thai`}>
      <SiteNav />
      <main>
        <Hero />
        <Gym />
        <Trainers />
        <Results />
        <Community />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
