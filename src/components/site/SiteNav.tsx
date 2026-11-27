import clsx from "clsx";
import { locales } from "@/content/site-texts";
import { localePaths } from "@/content/ui-strings";
import type { SiteContent } from "@/lib/site-content";
import { CtaLink, Wordmark } from "./primitives";

/** Path of a public page in the given language: Thai has no prefix, English lives under /en. */
export function localizedPath(locale: SiteContent["locale"], path: string) {
  if (path === "" || path === "/") return localePaths[locale];
  return locale === "en" ? `/en${path}` : path;
}

/** The header links, in order. Clips, articles and the shop only appear once they have something to show. */
export function navLinks(content: SiteContent) {
  const { ui, has } = content;
  return [
    { path: "/gym", label: ui.nav.gym, also: ["/community"] },
    { path: "/trainers", label: ui.nav.trainers },
    { path: "/results", label: ui.nav.results },
    { path: "/tools", label: ui.navTools, also: ["/guides", "/machines"] },
    ...(has.videos ? [{ path: "/videos", label: ui.navVideos }] : []),
    ...(has.articles ? [{ path: "/articles", label: ui.navArticles }] : []),
    ...(has.shop ? [{ path: "/shop", label: ui.navShop }] : []),
    { path: "/contact", label: ui.nav.contact },
  ] as { path: string; label: string; also?: string[] }[];
}

// On the home page the header sits transparent over the hero photo and turns
// solid as the page scrolls (see .site-nav in globals.css). On other pages it
// is solid from the start. `path` is the current page without the language
// prefix ("" for home), used for the language switch and to mark the current link.
export function SiteNav({ content, path = "" }: { content: SiteContent; path?: string }) {
  const { ui, locale } = content;
  const onHome = path === "";
  const home = localePaths[locale];
  const shadow = "[text-shadow:0_1px_8px_rgba(0,0,0,0.8)]";
  const links = navLinks(content).map((link) => ({
    ...link,
    href: localizedPath(locale, link.path),
    current: [link.path, ...(link.also ?? [])].some((prefix) => path === prefix || path.startsWith(`${prefix}/`)),
  }));

  return (
    <header className={clsx("fixed inset-x-0 top-0 z-50", onHome ? "site-nav" : "site-nav-solid")}>
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-3 px-5 md:h-[88px] md:gap-4 md:px-8">
        <a href={onHome ? "#top" : home} aria-label={onHome ? ui.backToTop : ui.home}>
          <Wordmark className="text-[13px] md:text-base" />
        </a>

        <nav aria-label={ui.navLabel} className="hidden items-center gap-6 xl:flex">
          {links.map((link) => (
            <a
              key={link.path}
              href={link.href}
              aria-current={link.current ? "page" : undefined}
              className={clsx("text-[15px] transition hover:text-volt", shadow, link.current ? "text-volt" : "text-white")}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <div role="group" aria-label={ui.switchLanguage} className={clsx("flex items-center gap-1.5 font-heading text-[17px] tracking-[0.08em]", shadow)}>
            {locales.map((language, i) => (
              <span key={language} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden className="text-white/35">/</span>}
                <a
                  href={localizedPath(language, path)}
                  hrefLang={language}
                  lang={language}
                  aria-current={language === locale ? "true" : undefined}
                  className={language === locale ? "text-volt" : "text-white/70 transition hover:text-white"}
                >
                  {language.toUpperCase()}
                </a>
              </span>
            ))}
          </div>
          <CtaLink href={content.contact.lineHref} external className="!hidden !px-4 !py-2.5 !text-[15px] sm:!inline-flex md:!px-5">
            {ui.addLine}
          </CtaLink>

          {/* Phones and tablets: the same links in a drop-down panel. Works without JavaScript. */}
          <details className="site-menu xl:hidden">
            <summary
              aria-label={ui.menu}
              className="flex size-11 cursor-pointer list-none items-center justify-center rounded-[3px] border border-white/40 bg-black/35 text-white [&::-webkit-details-marker]:hidden"
            >
              <svg aria-hidden viewBox="0 0 24 24" className="size-6 fill-none stroke-current stroke-2">
                <path className="site-menu-open" d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                <path className="site-menu-close" d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </summary>
            <nav
              aria-label={ui.navLabel}
              className="absolute inset-x-0 top-full max-h-[calc(100dvh-76px)] overflow-y-auto border-t border-white/10 bg-base px-5 pb-6 pt-2 shadow-2xl md:px-8"
            >
              <ul className="mx-auto grid max-w-[1240px] sm:grid-cols-2 sm:gap-x-8">
                {links.map((link) => (
                  <li key={link.path} className="border-b border-white/[0.08]">
                    <a
                      href={link.href}
                      aria-current={link.current ? "page" : undefined}
                      className={clsx("block py-3.5 text-lg font-medium", link.current ? "text-volt" : "text-text-hi")}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
