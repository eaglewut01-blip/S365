import Image from "next/image";
import { trainers } from "@/content/media";
import { Container, SectionHeader } from "./primitives";

export function Trainers() {
  return (
    <section id="trainers" className="scroll-mt-20 py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow="TRAINERS" title="ทีมเทรนเนอร์ของเรา">
          เทรนเนอร์ส่วนตัว {trainers.length} คน วางโปรแกรมและดูแลการฝึกให้ตามเป้าหมายของแต่ละคน
        </SectionHeader>

        <ul className="mt-9 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3.5">
          {trainers.map((trainer) => (
            <li key={trainer.name} className="group relative overflow-hidden rounded-[3px] bg-panel">
              <Image
                src={trainer.src}
                alt={trainer.alt}
                placeholder="blur"
                sizes="(min-width: 1280px) 290px, (min-width: 768px) 25vw, 50vw"
                className="aspect-[1/1.12] h-auto w-full object-cover object-[50%_18%] transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
              />
              <p className="absolute bottom-0 left-0 flex items-baseline gap-2 bg-volt px-3 pt-1 font-heading text-2xl leading-[1.25] tracking-[0.06em] text-[#141414] md:px-4 md:text-3xl">
                <span className="text-[0.5em] tracking-[0.2em] opacity-60">PT</span>
                {trainer.name.toUpperCase()}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
