import Image from "next/image";
import { results } from "@/content/media";
import { Container, SectionHeader } from "./primitives";

export function Results() {
  return (
    <section id="results" className="scroll-mt-20 py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow="RESULTS" title="ผลลัพธ์ของสมาชิก">
          ผลลัพธ์ของแต่ละคนแตกต่างกันตามจุดเริ่มต้นและความสม่ำเสมอ
        </SectionHeader>
      </Container>

      {/* Phones: swipe sideways so each poster stays readable. Desktop: 4-column grid. */}
      <ul
        tabIndex={0}
        aria-label="ภาพผลลัพธ์ก่อนและหลังของสมาชิก"
        className="mx-auto mt-9 flex max-w-[1240px] snap-x snap-mandatory scroll-pl-5 gap-2.5 overflow-x-auto px-5 pb-4 [scrollbar-color:var(--color-border-strong)_transparent] [scrollbar-width:thin] md:grid md:grid-cols-4 md:gap-3.5 md:overflow-visible md:px-8 md:pb-0"
      >
        {results.map((result) => (
          <li key={result.src.src} className="w-[78vw] max-w-[380px] shrink-0 snap-start overflow-hidden rounded-[3px] md:w-auto md:max-w-none">
            <a
              href={result.src.src}
              target="_blank"
              rel="noopener noreferrer"
              title="เปิดภาพขนาดเต็ม"
              className="block transition hover:brightness-110"
            >
              <Image
                src={result.src}
                alt={result.alt}
                placeholder="blur"
                sizes="(min-width: 1280px) 290px, (min-width: 768px) 25vw, 78vw"
                className="h-auto w-full"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
