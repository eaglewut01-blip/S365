import Image from "next/image";
import { gymPhotos, wall } from "@/content/media";
import { zones } from "@/content/site";
import { Container, SectionHeader } from "./primitives";

export function Gym() {
  return (
    <section id="gym" className="scroll-mt-16 py-20 md:py-28">
      <Container>
        <SectionHeader eyebrow="THE GYM" title="พื้นที่ฝึกครบในที่เดียว">
          เครื่องเวทหลากหลาย โซนฟรีเวท ลู่หญ้าเทียมสำหรับงานฟังก์ชันนัล และเครื่องคาร์ดิโอ จัดวางเป็นโซนชัดเจน
        </SectionHeader>

        <figure className="relative mt-10 overflow-hidden rounded-2xl border border-border">
          <div className="relative aspect-[4/3] md:aspect-[21/9]">
            <Image
              src={wall.src}
              alt={wall.alt}
              fill
              placeholder="blur"
              sizes="(min-width: 1280px) 1176px, 100vw"
              className="object-cover object-[20%_0%] md:object-top"
            />
          </div>
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-16 text-[15px] text-text-hi md:p-7 md:pt-20">
            ผนังตัวเลขประจำยิม ลองมองหา{" "}
            <span className="font-heading text-xl tracking-[0.2em] text-volt">3 6 5</span>
          </figcaption>
        </figure>

        <ul className="mt-12 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {zones.map((zone, i) => (
            <li key={zone.title} className="border-t border-border-strong pt-5">
              <span aria-hidden className="font-heading text-xl text-volt">
                0{i + 1}
              </span>
              <h3 className="mt-1.5 text-xl font-semibold text-text-hi">{zone.title}</h3>
              <p className="mt-2 break-keep text-[15px] font-light leading-relaxed text-balance text-text-lo">{zone.text}</p>
            </li>
          ))}
        </ul>

        <div className="mt-14 columns-2 gap-3 md:columns-3 md:gap-4">
          {gymPhotos.map((photo) => (
            <Image
              key={photo.src.src}
              src={photo.src}
              alt={photo.alt}
              placeholder="blur"
              sizes="(min-width: 1280px) 380px, (min-width: 768px) 33vw, 50vw"
              className="mb-3 h-auto w-full break-inside-avoid rounded-xl md:mb-4"
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
