import { site } from "@/content/site";
import { Container, CtaLink } from "./primitives";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-white/[0.08] py-20 text-center md:py-28">
      <Container>
        <h2 className="text-lg font-light text-text-lo md:text-xl">อยากเริ่ม ทักมาคุยกันก่อนได้</h2>

        <a
          href={site.phoneHref}
          aria-label={`โทร ${site.phoneDisplay}`}
          className="mt-1 inline-block font-heading text-[clamp(3.5rem,16.5vw,11.9rem)] leading-[0.95] tracking-[0.02em] text-volt transition hover:brightness-110"
        >
          {site.phoneDisplay}
        </a>

        <div className="mt-7 flex flex-wrap justify-center gap-3.5">
          <CtaLink href={site.lineHref} external>
            แอดไลน์ {site.lineId}
          </CtaLink>
          {site.facebookHref ? (
            <CtaLink href={site.facebookHref} variant="secondary" external>
              Facebook {site.facebookName}
            </CtaLink>
          ) : (
            <span className="inline-flex items-center rounded-[3px] border border-white/25 px-6 py-3.5 text-base font-semibold text-white md:px-7 md:py-[15px] md:text-[17px]">
              Facebook {site.facebookName}
            </span>
          )}
        </div>

        {(site.address || site.hours) && (
          <dl className="mx-auto mt-12 grid max-w-3xl gap-8 border-t border-white/[0.08] pt-10 text-left sm:grid-cols-2">
            {site.address && (
              <div>
                <dt className="font-heading text-[15px] tracking-[0.3em] text-volt">ADDRESS</dt>
                <dd className="mt-2 text-lg leading-snug text-text-hi">
                  {site.address}
                  {site.mapHref && (
                    <a
                      href={site.mapHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block text-base text-text-lo underline underline-offset-4 hover:text-text-hi"
                    >
                      เปิดแผนที่
                    </a>
                  )}
                </dd>
              </div>
            )}
            {site.hours && (
              <div>
                <dt className="font-heading text-[15px] tracking-[0.3em] text-volt">HOURS</dt>
                <dd className="mt-2 text-lg leading-snug text-text-hi">{site.hours}</dd>
              </div>
            )}
          </dl>
        )}
      </Container>
    </section>
  );
}
