import type { Metadata } from "next";
import { SITE_NAME } from "@/content/site";
import type { Locale, TextKey } from "@/content/site-texts";
import { getSiteContent, type SitePhoto } from "@/lib/site-content";
import { Classes } from "../Classes";
import { Contact } from "../Contact";
import { Location } from "../Location";
import { SiteImage } from "../SiteImage";
import { localizedPath } from "../SiteNav";
import { SubPage } from "../SubPage";

// One page per header link. Each one shows the same owner-editable texts and
// photos as its section on the home page, in full instead of as a preview.
const pages = {
  gym: { path: "/gym", eyebrow: "THE GYM", title: "gym.title", desc: "gym.desc" },
  trainers: { path: "/trainers", eyebrow: "TRAINERS", title: "trainers.title", desc: "trainers.desc" },
  results: { path: "/results", eyebrow: "RESULTS", title: "results.title", desc: "results.desc" },
  community: { path: "/community", eyebrow: "COMMUNITY", title: "community.title", desc: "community.desc" },
} as const satisfies Record<string, { path: string; eyebrow: string; title: TextKey; desc: TextKey }>;

type MenuPageId = keyof typeof pages | "contact";

function alternates(locale: Locale, path: string) {
  return { canonical: localizedPath(locale, path), languages: { th: localizedPath("th", path), en: localizedPath("en", path) } };
}

export async function menuMetadata(locale: Locale, id: MenuPageId): Promise<Metadata> {
  const content = await getSiteContent(locale);
  if (id === "contact") {
    return {
      title: `${content.ui.contactPageTitle} | ${SITE_NAME}`,
      description: `${content.t["location.address"]} ${content.t["location.transit"]}`.replace(/\s+/g, " "),
      alternates: alternates(locale, "/contact"),
    };
  }
  const page = pages[id];
  return {
    title: `${content.t[page.title]} | ${SITE_NAME}`,
    description: content.t[page.desc].replaceAll("{count}", String(content.photos.trainers.length)),
    alternates: alternates(locale, page.path),
  };
}

function PhotoGrid({ photos, className = "grid-cols-2 md:grid-cols-3" }: { photos: SitePhoto[]; className?: string }) {
  return (
    <ul className={`grid gap-2.5 md:gap-3.5 ${className}`}>
      {photos.map((photo, i) => (
        <li key={i} className="relative aspect-[4/3] overflow-hidden rounded-[3px] bg-panel">
          <SiteImage photo={photo} fill sizes="(min-width: 1280px) 390px, (min-width: 768px) 33vw, 50vw" className="object-cover" />
        </li>
      ))}
    </ul>
  );
}

export async function GymPage({ locale }: { locale: Locale }) {
  const content = await getSiteContent(locale);
  const { t, ui } = content;
  return (
    <SubPage locale={locale} path="/gym" eyebrow={pages.gym.eyebrow} title={t["gym.title"]} intro={t["gym.desc"]}>
      <ul className="space-y-2.5 md:space-y-3.5">
        {content.zones.map((zone, i) => (
          <li key={zone.label} className="grid overflow-hidden rounded-[3px] bg-[#111112] md:grid-cols-2">
            <div className={`relative aspect-[16/10] md:aspect-auto md:min-h-[340px] ${i % 2 === 1 ? "md:order-2" : ""}`}>
              <SiteImage photo={content.photos.zones[i]} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="flex flex-col justify-center p-6 md:p-10">
              <p className="font-heading text-[17px] tracking-[0.26em] text-volt">
                {String(i + 1).padStart(2, "0")}
                {locale === "th" && ` · ${zone.label}`}
              </p>
              <h2 className="mt-1 text-[clamp(1.6rem,4.5vw,2.25rem)] font-bold leading-snug text-text-hi">{zone.title}</h2>
              <p className="mt-2 max-w-[46ch] text-[1.05rem] font-light leading-relaxed text-pretty text-[#cfcdc5]">{zone.text}</p>
            </div>
          </li>
        ))}
      </ul>

      <Classes content={content} />

      {content.photos.gymGallery.length > 0 && (
        <>
          <h2 className="mb-5 mt-14 text-2xl font-semibold text-text-hi md:mt-20">{ui.galleryTitle}</h2>
          <PhotoGrid photos={content.photos.gymGallery} className="grid-cols-2 lg:grid-cols-4" />
        </>
      )}

      <a href={localizedPath(locale, "/community")} className="mt-8 inline-block font-medium text-volt underline-offset-4 hover:underline">
        {t["community.title"]} →
      </a>
    </SubPage>
  );
}

export async function TrainersPage({ locale }: { locale: Locale }) {
  const content = await getSiteContent(locale);
  const trainers = content.photos.trainers;
  return (
    <SubPage
      locale={locale}
      path="/trainers"
      eyebrow={pages.trainers.eyebrow}
      title={content.t["trainers.title"]}
      intro={content.t["trainers.desc"].replaceAll("{count}", String(trainers.length))}
    >
      <ul className="grid grid-cols-2 gap-2.5 md:gap-3.5 lg:grid-cols-3">
        {trainers.map((trainer, i) => (
          <li key={i} className="overflow-hidden rounded-[3px] bg-[#111112]">
            <SiteImage
              photo={trainer}
              sizes="(min-width: 1280px) 390px, (min-width: 1024px) 33vw, 50vw"
              className="aspect-[1/1.12] h-auto w-full object-cover object-[50%_18%]"
            />
            {(trainer.title || trainer.caption) && (
              <div className="p-3.5 md:p-5">
                {trainer.title && (
                  <h2 className="flex items-baseline gap-2 font-heading text-3xl leading-none tracking-[0.06em] text-text-hi md:text-4xl">
                    <span className="text-[0.5em] tracking-[0.2em] text-volt">PT</span>
                    {trainer.title.toUpperCase()}
                  </h2>
                )}
                {trainer.caption && <p className="mt-1.5 font-light leading-relaxed text-text-lo">{trainer.caption}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </SubPage>
  );
}

export async function ResultsPage({ locale }: { locale: Locale }) {
  const content = await getSiteContent(locale);
  return (
    <SubPage locale={locale} path="/results" eyebrow={pages.results.eyebrow} title={content.t["results.title"]} intro={content.t["results.desc"]}>
      <ul className="grid gap-2.5 sm:grid-cols-2 md:gap-3.5 lg:grid-cols-3">
        {content.photos.results.map((result, i) => (
          <li key={i} className="overflow-hidden rounded-[3px]">
            <a
              href={typeof result.src === "string" ? result.src : result.src.src}
              target="_blank"
              rel="noopener noreferrer"
              title={content.ui.openFullImage}
              className="block transition hover:brightness-110"
            >
              <SiteImage photo={result} sizes="(min-width: 1280px) 390px, (min-width: 640px) 50vw, 100vw" className="h-auto w-full" />
            </a>
          </li>
        ))}
      </ul>
    </SubPage>
  );
}

export async function CommunityPage({ locale }: { locale: Locale }) {
  const content = await getSiteContent(locale);
  return (
    <SubPage
      locale={locale}
      path="/community"
      eyebrow={pages.community.eyebrow}
      title={content.t["community.title"]}
      intro={content.t["community.desc"]}
    >
      <PhotoGrid photos={content.photos.communityAll} />
    </SubPage>
  );
}

export async function ContactPage({ locale }: { locale: Locale }) {
  const content = await getSiteContent(locale);
  return (
    <SubPage
      locale={locale}
      path="/contact"
      eyebrow="CONTACT"
      title={content.ui.contactPageTitle}
      noContactBand
      sections={(loaded) => (
        <>
          <Contact content={loaded} />
          <Location content={loaded} />
        </>
      )}
    />
  );
}
