import type { SiteContent } from "@/lib/site-content";
import { Container, SectionHeader } from "./primitives";
import { SiteImage } from "./SiteImage";
import { localizedPath } from "./SiteNav";

export function Gym({ content }: { content: SiteContent }) {
  return (
    <section id="gym" className="scroll-mt-20 bg-[#111112] py-16 md:py-24">
      <Container>
        <SectionHeader
          eyebrow="THE GYM"
          more={{ href: localizedPath(content.locale, "/gym"), label: content.ui.seeMore }}
          title={content.t["gym.title"]}>
          {content.t["gym.desc"]}
        </SectionHeader>

        <ul className="mt-9 grid gap-2.5 sm:grid-cols-2 md:gap-3.5 lg:grid-cols-4">
          {content.zones.map((zone, i) => (
            <li key={zone.label} className="relative isolate h-[300px] overflow-hidden rounded-[3px] lg:h-[420px]">
              <SiteImage
                photo={content.photos.zones[i]}
                fill
                sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 100vw"
                className="-z-20 object-cover"
              />
              <div aria-hidden className="tile-shade absolute inset-0 -z-10" />
              <div className="absolute inset-x-5 bottom-5">
                {/* The English label would only repeat the English zone name. */}
                {content.locale === "th" && (
                  <p className="font-heading text-[15px] tracking-[0.24em] text-volt">{zone.label}</p>
                )}
                <h3 className="text-[1.75rem] font-semibold leading-snug text-text-hi">{zone.title}</h3>
                <p className="mt-1 text-[14.5px] font-light leading-relaxed text-balance text-[#cfcdc5]">{zone.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
