import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { results } from "@/content/media";
import { Container, SectionHeader } from "./primitives";

export function Results() {
  return (
    <section id="results" className="scroll-mt-16 py-20 md:py-28">
      <Container className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeader eyebrow="RESULTS" title="ผลลัพธ์ของสมาชิก">
          ตัวอย่างความเปลี่ยนแปลงของสมาชิกที่ฝึกกับเทรนเนอร์ของเรา ผลลัพธ์ของแต่ละคนแตกต่างกันตามจุดเริ่มต้นและความสม่ำเสมอ
        </SectionHeader>
        <p className="flex items-center gap-2 text-sm text-text-faint">
          เลื่อนดูเพิ่ม <ArrowRight size={15} aria-hidden />
        </p>
      </Container>

      <ul
        tabIndex={0}
        aria-label="ภาพผลลัพธ์ก่อนและหลังของสมาชิก เลื่อนซ้ายขวาเพื่อดูเพิ่ม"
        className="mt-10 flex snap-x snap-mandatory scroll-pl-5 gap-4 overflow-x-auto px-5 pb-5 [scrollbar-color:var(--color-border-strong)_transparent] [scrollbar-width:thin] md:scroll-pl-8 md:px-8 lg:scroll-pl-[max(2rem,calc((100vw-1240px)/2+2rem))] lg:px-[max(2rem,calc((100vw-1240px)/2+2rem))]"
      >
        {results.map((result) => (
          <li
            key={result.src.src}
            className="w-[82vw] max-w-[420px] shrink-0 snap-start overflow-hidden rounded-xl border border-border"
          >
            <Image
              src={result.src}
              alt={result.alt}
              placeholder="blur"
              sizes="(min-width: 640px) 420px, 82vw"
              className="h-auto w-full"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
