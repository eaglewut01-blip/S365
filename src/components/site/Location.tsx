import { site } from "@/content/site";
import { Container, CtaLink, SectionHeader } from "./primitives";
import { GymMap } from "./GymMap";

export function Location() {
  return (
    <section id="location" className="scroll-mt-20 py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow="LOCATION" title="มาที่ยิม">
          แผนที่ 3 มิติ ลากเพื่อหมุนและเอียงมุมมองได้
        </SectionHeader>

        <div className="mt-9 grid gap-2.5 md:gap-3.5 lg:grid-cols-[380px_1fr]">
          <div className="flex flex-col rounded-[3px] bg-[#111112] p-6 md:p-8">
            <dl className="space-y-7">
              <div>
                <dt className="font-heading text-[15px] tracking-[0.3em] text-volt">ADDRESS</dt>
                <dd className="mt-2 text-lg leading-relaxed text-pretty text-text-hi">{site.address}</dd>
              </div>
              <div>
                <dt className="font-heading text-[15px] tracking-[0.3em] text-volt">OPEN</dt>
                <dd className="mt-2 space-y-1.5">
                  {site.hours.map((row) => (
                    <p key={row.days} className="flex justify-between gap-4 text-lg text-text-hi">
                      <span className="font-light text-text-lo">{row.days}</span>
                      <span className="tabular-nums">{row.time}</span>
                    </p>
                  ))}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-2.5 lg:mt-auto lg:pt-8">
              <CtaLink href={site.directionsHref} external>
                นำทางด้วย Google Maps
              </CtaLink>
              <CtaLink href={site.mapHref} variant="secondary" external>
                ดูหน้าร้านบน Google Maps
              </CtaLink>
            </div>
          </div>

          <GymMap lat={site.geo.lat} lng={site.geo.lng} label="S365" fallbackHref={site.mapHref} />
        </div>
      </Container>
    </section>
  );
}
