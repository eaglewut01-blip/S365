import Link from "next/link";
import { navLinks } from "@/content/site";
import type { SiteContent } from "@/lib/site-content";
import { CtaLink, Wordmark } from "./primitives";

// Sits transparent over the hero photo and turns solid as the page scrolls (see .site-nav in globals.css).
export function SiteNav({ content }: { content: SiteContent }) {
  return (
    <header className="site-nav fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex h-[76px] max-w-[1240px] items-center justify-between gap-4 px-5 md:h-[88px] md:px-8">
        <a href="#top" aria-label="S365 Fitness กลับไปด้านบน">
          <Wordmark className="text-[13px] md:text-base" />
        </a>

        <nav aria-label="เมนูหลัก" className="hidden items-center gap-9 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] text-white transition [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] hover:text-volt"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-white/80 transition [text-shadow:0_1px_8px_rgba(0,0,0,0.8)] hover:text-white"
          >
            เข้าสู่ระบบ
          </Link>
          <CtaLink href={content.contact.lineHref} external className="!px-5 !py-2.5 !text-[15px]">
            แอดไลน์
          </CtaLink>
        </div>
      </div>
    </header>
  );
}
