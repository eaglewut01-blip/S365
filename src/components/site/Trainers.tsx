import Image from "next/image";
import { trainers } from "@/content/media";
import { Container, SectionHeader } from "./primitives";

export function Trainers() {
  return (
    <section id="trainers" className="scroll-mt-16 border-y border-border bg-panel/40 py-20 md:py-28">
      <Container>
        <SectionHeader eyebrow="TRAINERS" title="เทรนเนอร์ที่ดูแลคุณตัวต่อตัว">
          วางโปรแกรมตามเป้าหมายของแต่ละคน และติดตามความเปลี่ยนแปลงด้วยผลวัดองค์ประกอบร่างกาย
        </SectionHeader>

        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {trainers.map((trainer) => (
            <li key={trainer.name} className="group relative overflow-hidden rounded-xl bg-panel">
              <Image
                src={trainer.src}
                alt={trainer.alt}
                placeholder="blur"
                sizes="(min-width: 1280px) 290px, (min-width: 768px) 25vw, 50vw"
                className="aspect-[3/4] h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent p-3.5 pt-16 md:p-4 md:pt-20">
                <p className="font-body text-[10px] font-semibold tracking-[0.3em] text-volt">PT</p>
                <p className="font-heading text-[1.75rem] leading-none tracking-wide text-text-hi md:text-[2rem]">
                  {trainer.name.toUpperCase()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
