import type { SiteContent } from "@/lib/site-content";
import { Container, SectionHeader } from "./primitives";
import { SiteImage } from "./SiteImage";
import { localizedPath } from "./SiteNav";

export function Community({ content }: { content: SiteContent }) {
  const featured = content.photos.community.slice(0, 3);
  const more = content.photos.community.slice(3);

  return (
    <section id="community" className="scroll-mt-20 bg-[#111112] py-16 md:py-24">
      <Container>
        <SectionHeader
          eyebrow="COMMUNITY"
          more={{ href: localizedPath(content.locale, "/community"), label: content.ui.seeMore }}
          title={content.t["community.title"]}>
          {content.t["community.desc"]}
        </SectionHeader>

        <ul className="mt-9 grid grid-cols-2 gap-2.5 md:h-[440px] md:grid-cols-[1.25fr_1fr_1fr] md:gap-3.5">
          {featured.map((photo, i) => (
            <li
              key={i}
              className={
                i === 0
                  ? "relative col-span-2 aspect-[3/2] overflow-hidden rounded-[3px] md:col-span-1 md:aspect-auto"
                  : "relative aspect-[3/4] overflow-hidden rounded-[3px] md:aspect-auto"
              }
            >
              <SiteImage
                photo={photo}
                fill
                sizes="(min-width: 1280px) 450px, (min-width: 768px) 36vw, 100vw"
                className="object-cover"
              />
            </li>
          ))}
        </ul>

        {more.length > 0 && (
          <ul className="mt-2.5 grid grid-cols-2 gap-2.5 md:mt-3.5 md:grid-cols-4 md:gap-3.5">
            {more.map((photo, i) => (
              <li key={i} className="relative aspect-square overflow-hidden rounded-[3px]">
                <SiteImage
                  photo={photo}
                  fill
                  sizes="(min-width: 1280px) 290px, (min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
