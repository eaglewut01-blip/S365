import Image from "next/image";
import { communityHighlights } from "@/content/media";
import { Container, SectionHeader } from "./primitives";

export function Community() {
  return (
    <section id="community" className="scroll-mt-20 bg-[#111112] py-16 md:py-24">
      <Container>
        <SectionHeader eyebrow="COMMUNITY" title="ซ้อมด้วยกัน ลงสนามด้วยกัน">
          สมาชิกและเทรนเนอร์รวมทีมลงแข่ง HYROX Bangkok และ DEKA FIT
        </SectionHeader>

        <ul className="mt-9 grid grid-cols-2 gap-2.5 md:h-[440px] md:grid-cols-[1.25fr_1fr_1fr] md:gap-3.5">
          {communityHighlights.map((photo, i) => (
            <li
              key={photo.src.src}
              className={
                i === 0
                  ? "relative col-span-2 aspect-[3/2] overflow-hidden rounded-[3px] md:col-span-1 md:aspect-auto"
                  : "relative aspect-[3/4] overflow-hidden rounded-[3px] md:aspect-auto"
              }
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1280px) 450px, (min-width: 768px) 36vw, 100vw"
                className="object-cover"
                style={{ objectPosition: photo.position }}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
