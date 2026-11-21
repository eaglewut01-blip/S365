import type { SiteContent } from "@/lib/site-content";
import { Container, CtaLink } from "./primitives";
import { SiteImage } from "./SiteImage";

export function Hero({ content }: { content: SiteContent }) {
  const { t, contact } = content;
  return (
    <section className="relative isolate flex min-h-[700px] flex-col justify-end overflow-hidden md:h-[860px] md:max-h-[100svh] md:min-h-[660px]">
      <SiteImage
        photo={content.photos.hero}
        fill
        preload
        sizes="100vw"
        className="-z-20 object-cover object-[14%_0%] md:object-[20%_0%]"
      />
      <div aria-hidden className="hero-shade absolute inset-0 -z-10" />

      <Container className="pb-10 md:pb-16">
        <p className="font-heading text-[17px] tracking-[0.3em] text-volt">{t["hero.eyebrow"]}</p>
        <h1 className="mb-3.5 mt-1.5 text-[clamp(3.6rem,18vw,4.5rem)] font-bold leading-[1.12] text-text-hi md:text-[clamp(5rem,9.4vw,8.5rem)]">
          {t["hero.line1"]}
          {t["hero.line2"] && (
            <>
              <br />
              <span className="text-volt">{t["hero.line2"]}</span>
            </>
          )}
        </h1>
        <p className="max-w-[560px] text-[1.03rem] font-light leading-relaxed text-pretty text-[#d9d7cf] md:text-[1.19rem]">
          {t["hero.sub"]}
        </p>

        <div className="mt-7 flex flex-wrap gap-3.5">
          <CtaLink href={contact.lineHref} external>
            แอดไลน์ {contact.lineId}
          </CtaLink>
          <CtaLink href={contact.phoneHref} variant="secondary">
            โทร {contact.phoneDisplay}
          </CtaLink>
        </div>
      </Container>
    </section>
  );
}
