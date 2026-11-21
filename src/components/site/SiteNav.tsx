import Link from "next/link";
import clsx from "clsx";
import { navAnchors } from "@/content/site";
import { locales } from "@/content/site-texts";
import { localePaths } from "@/content/ui-strings";
import type { SiteContent } from "@/lib/site-content";
import { CtaLink, Wordmark } from "./primitives";

// Sits transparent over the hero photo and turns solid as the page scrolls (see .site-nav in globals.css).
export function SiteNav({ content }: { content: SiteContent }) {
  const { ui } = content;
  const shadow = "[text-shadow:0_1px_8px_rgba(0,0,0,0.8)]";

  return (
    <header className="site-nav fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-3 px-5 md:h-[88px] md:gap-4 md:px-8">
        <a href="#top" aria-label={ui.backToTop}>
          <Wordmark className="text-[13px] md:text-base" />
        </a>

        <nav aria-label={ui.navLabel} className="hidden items-center gap-7 lg:flex xl:gap-9">
          {navAnchors.map((id) => (
            <a key={id} href={`#${id}`} className={clsx("text-[15px] text-white transition hover:text-volt", shadow)}>
              {ui.nav[id]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <div role="group" aria-label={ui.switchLanguage} className={clsx("flex items-center gap-1.5 font-heading text-[17px] tracking-[0.08em]", shadow)}>
            {locales.map((locale, i) => (
              <span key={locale} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="text-white/35">/</span>}
                {/* A plain link (not next/link) so the browser does a full load and picks up the page language. */}
                <a
                  href={localePaths[locale]}
                  hrefLang={locale}
                  lang={locale}
                  aria-current={locale === content.locale ? "true" : undefined}
                  className={locale === content.locale ? "text-volt" : "text-white/70 transition hover:text-white"}
                >
                  {locale.toUpperCase()}
                </a>
              </span>
            ))}
          </div>
          <Link href="/login" className={clsx("hidden text-sm text-white/80 transition hover:text-white sm:inline", shadow)}>
            {ui.login}
          </Link>
          <CtaLink href={content.contact.lineHref} external className="!px-4 !py-2.5 !text-[15px] md:!px-5">
            {ui.addLine}
          </CtaLink>
        </div>
      </div>
    </header>
  );
}
