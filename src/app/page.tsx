import type { Metadata } from "next";
import { HomePage } from "@/components/site/HomePage";

const description =
  "S365 Fitness ยิมย่านบางนา พื้นที่กว่า 1,000 ตารางเมตร เดินจาก BTS แบริ่งหรือ BTS บางนา 5 นาที มีเครื่องเวท ฟรีเวท โซนฟังก์ชันนัล และเทรนเนอร์ส่วนตัว ติดต่อ LINE @s365fitness หรือโทร 062-365-365-0";

export const metadata: Metadata = {
  title: "S365 Fitness | ยิมและเทรนเนอร์ส่วนตัว ย่านบางนา",
  description,
  alternates: { canonical: "/", languages: { th: "/", en: "/en" } },
  openGraph: {
    title: "S365 Fitness",
    description,
    type: "website",
    locale: "th_TH",
    alternateLocale: "en_US",
  },
};

// The page is prerendered and refreshed in the background: at most every
// 5 minutes, and immediately after the owner saves a change in /owner/website.
export const revalidate = 300;

export default function Page() {
  return <HomePage locale="th" />;
}
