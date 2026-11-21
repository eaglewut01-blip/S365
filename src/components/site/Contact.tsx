import Image from "next/image";
import { lineQr } from "@/content/media";
import { site } from "@/content/site";
import { Container, CtaLink } from "./primitives";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-white/[0.08] py-20 text-center md:py-28">
      <Container>
        <h2 className="text-lg font-light text-text-lo md:text-xl">อยากเริ่ม ทักมาคุยกันก่อนได้</h2>

        <a
          href={site.phoneHref}
          aria-label={`โทร ${site.phoneDisplay}`}
          className="mt-1 inline-block font-heading text-[clamp(3.5rem,16.5vw,11.9rem)] leading-[0.95] tracking-[0.02em] text-volt transition hover:brightness-110"
        >
          {site.phoneDisplay}
        </a>

        <div className="mt-7 flex flex-wrap justify-center gap-3.5">
          <CtaLink href={site.lineHref} external>
            แอดไลน์ {site.lineId}
          </CtaLink>
          {site.facebookHref ? (
            <CtaLink href={site.facebookHref} variant="secondary" external>
              Facebook {site.facebookName}
            </CtaLink>
          ) : (
            <span className="inline-flex items-center rounded-[3px] border border-white/25 px-6 py-3.5 text-base font-semibold text-white md:px-7 md:py-[15px] md:text-[17px]">
              Facebook {site.facebookName}
            </span>
          )}
        </div>

        <p className="mt-6 font-light text-text-lo">สอบถามแพ็กเกจและราคาได้ทางไลน์หรือโทร</p>

        {/* Desktop visitors can't tap a LINE link on their phone, so give them something to scan. */}
        <div className="mx-auto mt-10 hidden w-max items-center gap-5 rounded-[3px] border border-white/[0.12] p-4 pr-7 text-left md:flex">
          <Image src={lineQr.src} alt={lineQr.alt} sizes="132px" className="size-[132px] rounded-[2px]" />
          <p className="leading-relaxed text-text-lo">
            <span className="block font-heading text-[15px] tracking-[0.3em] text-volt">LINE</span>
            <span className="block text-xl font-semibold text-text-hi">{site.lineId}</span>
            เปิดกล้องมือถือแล้วสแกนเพื่อแอดไลน์
          </p>
        </div>
      </Container>
    </section>
  );
}
