import Image from "next/image";
import { wall } from "@/content/media";
import { site } from "@/content/site";
import { Container, CtaLink } from "./primitives";

export function Hero() {
  return (
    <section className="relative isolate flex min-h-[700px] flex-col justify-end overflow-hidden md:h-[860px] md:max-h-[100svh] md:min-h-[660px]">
      <Image
        src={wall.src}
        alt={wall.alt}
        fill
        preload
        placeholder="blur"
        sizes="100vw"
        className="-z-20 object-cover object-[14%_0%] md:object-[20%_0%]"
      />
      <div aria-hidden className="hero-shade absolute inset-0 -z-10" />

      <Container className="pb-10 md:pb-16">
        <p className="font-heading text-[17px] tracking-[0.3em] text-volt">PERSONAL TRAINING GYM</p>
        <h1 className="mb-3.5 mt-1.5 text-[clamp(3.6rem,18vw,4.5rem)] font-bold leading-[1.12] text-text-hi md:text-[clamp(5rem,9.4vw,8.5rem)]">
          แข็งแรงขึ้น
          <br />
          <span className="text-volt">ทุกวัน</span>
        </h1>
        <p className="max-w-[560px] text-[1.03rem] font-light leading-relaxed text-[#d9d7cf] md:text-[1.19rem]">
          ยิมที่มีทั้งเครื่องเวท ฟรีเวท และโซนฟังก์ชันนัล พร้อม
          <span className="whitespace-nowrap">เทรนเนอร์ส่วนตัว</span>ที่วางโปรแกรมให้ตาม
          <span className="whitespace-nowrap">เป้าหมายของคุณ</span>
        </p>

        <div className="mt-7 flex flex-wrap gap-3.5">
          <CtaLink href={site.lineHref} external>
            แอดไลน์ {site.lineId}
          </CtaLink>
          <CtaLink href={site.phoneHref} variant="secondary">
            โทร {site.phoneDisplay}
          </CtaLink>
        </div>
      </Container>
    </section>
  );
}
