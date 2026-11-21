import type { Locale } from "@/content/site-texts";
import { getSiteContent } from "@/lib/site-content";
import { kanit } from "./fonts";
import { SiteNav } from "./SiteNav";
import { Hero } from "./Hero";
import { Ticker } from "./Ticker";
import { Gym } from "./Gym";
import { Trainers } from "./Trainers";
import { Results } from "./Results";
import { Community } from "./Community";
import { ToolsTeaser } from "./ToolsTeaser";
import { Location } from "./Location";
import { Contact } from "./Contact";
import { ArticlesSection, VideosSection } from "./pages/ContentPages";
import { SiteFooter } from "./SiteFooter";
import { MobileCtaBar } from "./MobileCtaBar";

// The whole public page, shared by the Thai route (/) and the English route (/en).
export async function HomePage({ locale }: { locale: Locale }) {
  const content = await getSiteContent(locale);

  return (
    <div id="top" lang={content.ui.htmlLang} className={`${kanit.variable} font-thai`}>
      <SiteNav content={content} />
      <main>
        <Hero content={content} />
        <Ticker items={content.tickerItems} />
        <Trainers content={content} />
        <Gym content={content} />
        <Results content={content} />
        <VideosSection content={content} />
        <Community content={content} />
        <ToolsTeaser content={content} />
        <ArticlesSection content={content} />
        <Location content={content} />
        <Contact content={content} />
      </main>
      <SiteFooter content={content} />
      <MobileCtaBar content={content} />
    </div>
  );
}
