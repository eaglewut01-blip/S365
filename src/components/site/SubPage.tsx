import type { Locale } from "@/content/site-texts";
import { getSiteContent, type SiteContent } from "@/lib/site-content";
import { kanit } from "./fonts";
import { Container, CtaLink } from "./primitives";
import { SiteNav, localizedPath } from "./SiteNav";
import { SiteFooter } from "./SiteFooter";
import { MobileCtaBar } from "./MobileCtaBar";

// Frame for every public page other than the home page: header, page title,
// the page's own content, a contact band and the footer.
export async function SubPage({
  locale,
  path,
  eyebrow,
  title,
  intro,
  back,
  healthNote,
  sections,
  noContactBand,
  children,
}: {
  locale: Locale;
  /** Page path without the language prefix, e.g. "/tools/bmi". */
  path: string;
  eyebrow: string;
  title: string;
  intro?: string;
  /** Show a link back to the tools list above the title. */
  back?: boolean;
  /** Show the general health disclaimer under the content. */
  healthNote?: boolean;
  /** Full-width sections rendered under the page header (they bring their own container). */
  sections?: (content: SiteContent) => React.ReactNode;
  /** Leave out the contact band, for pages that already end with contact details. */
  noContactBand?: boolean;
  children?: React.ReactNode | ((content: SiteContent) => React.ReactNode);
}) {
  const content = await getSiteContent(locale);
  const { ui, contact } = content;

  return (
    <div id="top" lang={ui.htmlLang} className={`${kanit.variable} font-thai`}>
      <SiteNav content={content} path={path} />
      <main className="pt-[76px] md:pt-[88px]">
        <Container className={sections ? "pb-10 pt-10 md:pb-14 md:pt-16" : "pb-16 pt-10 md:pb-24 md:pt-16"}>
          {back && (
            <a href={localizedPath(locale, "/tools")} className="text-sm text-text-lo transition hover:text-volt">
              ← {ui.backToTools}
            </a>
          )}
          <p className="mt-4 font-heading text-[17px] tracking-[0.3em] text-volt">{eyebrow}</p>
          <h1 className="mt-1 text-[clamp(2.1rem,7vw,3.75rem)] font-bold leading-[1.2] text-balance text-text-hi">{title}</h1>
          {intro && <p className="mt-3 max-w-2xl text-[1.05rem] font-light leading-relaxed text-pretty text-text-lo">{intro}</p>}

          {children && <div className="mt-9 md:mt-12">{typeof children === "function" ? children(content) : children}</div>}

          {healthNote && (
            <p className="mt-10 max-w-3xl border-l-2 border-white/15 pl-4 text-sm font-light leading-relaxed text-text-lo">
              {ui.healthNote}
            </p>
          )}
        </Container>
        {sections?.(content)}

        {!noContactBand && (
        <section className="border-t border-white/[0.08] bg-[#111112] py-14 md:py-20">
          <Container className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-[clamp(1.5rem,4.5vw,2.25rem)] font-bold leading-snug text-text-hi">{ui.askTrainerTitle}</h2>
              <p className="mt-2 max-w-xl font-light leading-relaxed text-text-lo">{ui.askTrainerDesc}</p>
            </div>
            <div className="flex flex-wrap gap-3.5">
              <CtaLink href={contact.lineHref} external>
                {ui.addLine} {contact.lineId}
              </CtaLink>
              <CtaLink href={contact.phoneHref} variant="secondary">
                {ui.call} {contact.phoneDisplay}
              </CtaLink>
            </div>
          </Container>
        </section>
        )}
      </main>
      <SiteFooter />
      <MobileCtaBar content={content} />
    </div>
  );
}
