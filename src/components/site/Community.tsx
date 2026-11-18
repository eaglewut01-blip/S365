import Image from "next/image";
import { classPhotos, eventPhotos } from "@/content/media";
import { Container, SectionHeader } from "./primitives";

export function Community() {
  return (
    <section id="community" className="scroll-mt-16 border-y border-border bg-panel/40 py-20 md:py-28">
      <Container>
        <SectionHeader eyebrow="COMMUNITY" title="ซ้อมด้วยกัน ลงสนามด้วยกัน">
          นอกจากการฝึกในยิม สมาชิกและเทรนเนอร์ของเรายังรวมทีมลงแข่ง HYROX Bangkok และ DEKA FIT
        </SectionHeader>

        <h3 className="mt-12 text-lg font-medium text-text-hi">เซสชันกลุ่มที่ยิม</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 md:gap-4">
          {classPhotos.map((photo) => (
            <Image
              key={photo.src.src}
              src={photo.src}
              alt={photo.alt}
              placeholder="blur"
              sizes="(min-width: 1280px) 580px, (min-width: 640px) 50vw, 100vw"
              className="aspect-[3/2] h-auto w-full rounded-xl object-cover"
            />
          ))}
        </div>

        <h3 className="mt-14 text-lg font-medium text-text-hi">ทีม S365 ในสนามแข่ง</h3>
        <div className="mt-4 columns-2 gap-3 md:columns-4 md:gap-4">
          {eventPhotos.map((photo) => (
            <Image
              key={photo.src.src}
              src={photo.src}
              alt={photo.alt}
              placeholder="blur"
              sizes="(min-width: 1280px) 280px, (min-width: 768px) 25vw, 50vw"
              className="mb-3 h-auto w-full break-inside-avoid rounded-xl md:mb-4"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
