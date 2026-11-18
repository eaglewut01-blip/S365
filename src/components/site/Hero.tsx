import Image from "next/image";
import { MessageCircle, Phone } from "lucide-react";
import { hero } from "@/content/media";
import { site } from "@/content/site";
import { CtaLink, DigitWall } from "./primitives";

const tags = ["Personal Training", "Functional Training", "Group Session"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid lg:min-h-[100svh] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div className="relative z-10 flex flex-col justify-center px-5 pb-10 pt-28 md:px-8 lg:py-28 lg:pl-[max(2rem,calc((100vw-1240px)/2+2rem))] lg:pr-14">
          <DigitWall className="text-[13vw] sm:text-[5.5rem] lg:text-[clamp(5rem,7.4vw,8.5rem)]" />

          <h1 className="mt-8 text-[clamp(2.7rem,10vw,3.75rem)] font-bold leading-[1.12] text-text-hi lg:text-[clamp(3.75rem,5.2vw,5.25rem)]">
            แข็งแรงขึ้น
            <br />
            <span className="text-volt">ทุกวัน</span>
          </h1>

          <p className="mt-5 max-w-[32rem] text-[1.05rem] font-light leading-relaxed text-pretty text-text-lo">
            ยิมที่มีทั้งเครื่องเวท ฟรีเวท และโซนฟังก์ชันนัล พร้อมเทรนเนอร์ส่วนตัวที่วางโปรแกรมให้ตามเป้าหมายของคุณ
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <CtaLink href={site.lineHref} external>
              <MessageCircle size={18} aria-hidden />
              แอดไลน์ {site.lineId}
            </CtaLink>
            <CtaLink href={site.phoneHref} variant="secondary">
              <Phone size={17} aria-hidden />
              โทร {site.phoneDisplay}
            </CtaLink>
          </div>

          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-text-faint">
            {tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </div>

        <div className="relative h-[125vw] max-h-[720px] lg:h-auto lg:max-h-none">
          <Image
            src={hero.src}
            alt={hero.alt}
            fill
            preload
            placeholder="blur"
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover object-[50%_45%]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-base via-transparent to-base lg:hidden" />
          <div className="absolute inset-0 hidden bg-gradient-to-r from-base via-base/10 to-transparent lg:block" />
        </div>
      </div>
    </section>
  );
}
