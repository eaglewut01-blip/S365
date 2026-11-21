import { site } from "@/content/site";

// Phones only: the two contact actions stay within thumb reach on every part of the page.
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-2 gap-2.5 border-t border-white/[0.12] bg-base/95 px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <a
        href={site.lineHref}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-12 items-center justify-center rounded-[3px] bg-volt text-base font-semibold text-volt-ink"
      >
        แอดไลน์
      </a>
      <a
        href={site.phoneHref}
        className="flex h-12 items-center justify-center rounded-[3px] border border-white/45 text-base font-semibold text-white"
      >
        โทร {site.phoneDisplay}
      </a>
    </div>
  );
}
