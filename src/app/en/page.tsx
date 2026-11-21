import type { Metadata } from "next";
import { HomePage } from "@/components/site/HomePage";

const description =
  "S365 Fitness is a gym of over 1,000 square metres in Bang Na, Bangkok, five minutes on foot from BTS Bearing or BTS Bang Na, with machines, free weights, a functional zone and personal trainers. LINE @s365fitness or call 062-365-365-0.";

export const metadata: Metadata = {
  title: "S365 Fitness | Gym and personal training in Bang Na, Bangkok",
  description,
  alternates: { canonical: "/en", languages: { th: "/", en: "/en" } },
  openGraph: {
    title: "S365 Fitness",
    description,
    type: "website",
    locale: "en_US",
    alternateLocale: "th_TH",
  },
};

// Same caching as the Thai page: refreshed at most every 5 minutes and right after the owner saves a change.
export const revalidate = 300;

export default function Page() {
  return <HomePage locale="en" />;
}
