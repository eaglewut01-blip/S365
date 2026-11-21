import type { SiteContent } from "@/lib/site-content";
import { Container, SectionHeader } from "./primitives";
import { SiteImage } from "./SiteImage";
import { localizedPath } from "./SiteNav";

export function Results({ content }: { content: SiteContent }) {
  return (
    <section id="results" className="scroll-mt-20 py-16 md:py-24">
      <Container>
        <SectionHeader
          eyebrow="RESULTS"
          more={{ href: localizedPath(content.locale, "/results"), label: content.ui.seeMore }}
          title={content.t["results.title"]}>
          {content.t["results.desc"]}
        </SectionHeader>
      </Container>

      {/* Phones: swipe sideways so each poster stays readable. Desktop: 4-column grid. */}
      <ul
        tabIndex={0}
        aria-label={content.ui.resultsListLabel}
        className="mx-auto mt-9 flex max-w-[1240px] snap-x snap-mandatory scroll-pl-5 gap-2.5 overflow-x-auto px-5 pb-4 [scrollbar-color:var(--color-border-strong)_transparent] [scrollbar-width:thin] md:grid md:grid-cols-4 md:gap-3.5 md:overflow-visible md:px-8 md:pb-0"
      >
        {content.photos.results.map((result, i) => (
          <li key={i} className="w-[78vw] max-w-[380px] shrink-0 snap-start overflow-hidden rounded-[3px] md:w-auto md:max-w-none">
            <a
              href={typeof result.src === "string" ? result.src : result.src.src}
              target="_blank"
              rel="noopener noreferrer"
              title={content.ui.openFullImage}
              className="block transition hover:brightness-110"
            >
              <SiteImage
                photo={result}
                sizes="(min-width: 1280px) 290px, (min-width: 768px) 25vw, 78vw"
                className="h-auto w-full"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
