import Link from "next/link";
import { navLinks, site } from "@/content/site";
import { CtaLink, Wordmark } from "./primitives";

export function SiteNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-base/75 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-5 md:px-8">
        <a href="#top" aria-label="S365 Fitness กลับไปด้านบน">
          <Wordmark className="text-[15px]" />
        </a>

        <nav aria-label="เมนูหลัก" className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-[15px] text-text-lo transition hover:text-text-hi">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-text-lo transition hover:text-text-hi">
            เข้าสู่ระบบ
          </Link>
          <CtaLink href={site.lineHref} external className="px-4 py-2 text-sm">
            แอดไลน์
          </CtaLink>
        </div>
      </div>
    </header>
  );
}
