import type { SiteContent } from "@/lib/site-content";
import { Container, CtaLink, SectionHeader } from "./primitives";
import { GymMap } from "./GymMap";

export function Location({ content }: { content: SiteContent }) {
  const { t, ui } = content;
  return (
    <section id="location" className="scroll-mt-20 bg-[#111112] py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow="LOCATION" title={t["location.title"]}>
          {ui.mapHint}
        </SectionHeader>

        <div className="mt-9 grid gap-2.5 md:gap-3.5 lg:grid-cols-[380px_1fr]">
          <div className="flex flex-col rounded-[3px] bg-base p-6 md:p-8">
            <dl className="space-y-7">
              <div>
                <dt className="font-heading text-[15px] tracking-[0.3em] text-volt">{ui.address}</dt>
                <dd className="mt-2 whitespace-pre-line text-lg leading-relaxed text-pretty text-text-hi">
                  {t["location.address"]}
                </dd>
              </div>
              {t["location.transit"] && (
                <div>
                  <dt className="font-heading text-[15px] tracking-[0.3em] text-volt">{ui.gettingHere}</dt>
                  <dd className="mt-2 text-lg leading-relaxed text-pretty text-text-hi">{t["location.transit"]}</dd>
                </div>
              )}
              {content.hours.length > 0 && (
                <div>
                  <dt className="font-heading text-[15px] tracking-[0.3em] text-volt">{ui.open}</dt>
                  <dd className="mt-2 space-y-1.5">
                    {content.hours.map((row) => (
                      <p key={row.days + row.time} className="flex justify-between gap-4 text-lg text-text-hi">
                        <span className="font-light text-text-lo">{row.days}</span>
                        <span className="tabular-nums">{row.time}</span>
                      </p>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-8 flex flex-col gap-2.5 lg:mt-auto lg:pt-8">
              <CtaLink href={t["location.directions_url"]} external>
                {ui.directions}
              </CtaLink>
              <CtaLink href={t["location.map_url"]} variant="secondary" external>
                {ui.viewListing}
              </CtaLink>
            </div>
          </div>

          <GymMap
            lat={content.geo.lat}
            lng={content.geo.lng}
            label="S365"
            fallbackHref={t["location.map_url"]}
            strings={{ label: ui.mapLabel, loading: ui.mapLoading, failed: ui.mapFailed, fallbackLink: ui.mapFallbackLink }}
          />
        </div>
      </Container>
    </section>
  );
}
