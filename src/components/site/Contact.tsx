import type { SiteContent } from "@/lib/site-content";
import { Container, CtaLink } from "./primitives";

export function Contact({ content }: { content: SiteContent }) {
  const { t, ui, contact } = content;
  return (
    <section id="contact" className="scroll-mt-20 border-t border-white/[0.08] py-20 text-center md:py-28">
      <Container>
        <h2 className="text-lg font-light text-text-lo md:text-xl">{t["contact.title"]}</h2>

        <a
          href={contact.phoneHref}
          aria-label={`${ui.call} ${contact.phoneDisplay}`}
          className="mt-1 inline-block font-heading text-[clamp(3.5rem,16.5vw,11.9rem)] leading-[0.95] tracking-[0.02em] text-volt transition hover:brightness-110"
        >
          {contact.phoneDisplay}
        </a>

        <div className="mt-7 flex flex-wrap justify-center gap-3.5">
          <CtaLink href={contact.lineHref} external>
            {ui.addLine} {contact.lineId}
          </CtaLink>
          {contact.facebookName &&
            (contact.facebookHref ? (
              <CtaLink href={contact.facebookHref} variant="secondary" external>
                Facebook {contact.facebookName}
              </CtaLink>
            ) : (
              <span className="inline-flex items-center rounded-[3px] border border-white/25 px-6 py-3.5 text-base font-semibold text-white md:px-7 md:py-[15px] md:text-[17px]">
                Facebook {contact.facebookName}
              </span>
            ))}
        </div>

        {t["contact.note"] && <p className="mt-6 font-light text-text-lo">{t["contact.note"]}</p>}

        {/* Desktop visitors can't tap a LINE link on their phone, so give them something to scan. */}
        <div className="mx-auto mt-10 hidden w-max items-center gap-5 rounded-[3px] border border-white/[0.12] p-4 pr-7 text-left md:flex">
          <div
            role="img"
            aria-label={`${ui.qrLabel} ${contact.lineId}`}
            className="size-[132px] overflow-hidden rounded-[2px] [&>svg]:size-full"
            dangerouslySetInnerHTML={{ __html: contact.lineQrSvg }}
          />
          <p className="leading-relaxed text-text-lo">
            <span className="block font-heading text-[15px] tracking-[0.3em] text-volt">LINE</span>
            <span className="block text-xl font-semibold text-text-hi">{contact.lineId}</span>
            {ui.qrHint}
          </p>
        </div>
      </Container>
    </section>
  );
}
