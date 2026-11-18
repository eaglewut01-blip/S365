import { ArrowUpRight } from "lucide-react";
import { site } from "@/content/site";
import { Container } from "./primitives";

const rowClass = "flex items-center justify-between gap-4 py-5";
const labelClass = "text-[13px] font-medium opacity-70";
const valueClass = "mt-0.5 block text-[1.6rem] font-semibold leading-tight";
const linkClass = `${rowClass} group focus-visible:outline-volt-ink`;

function Arrow() {
  return (
    <ArrowUpRight
      size={26}
      aria-hidden
      className="shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none"
    />
  );
}

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-16 bg-volt text-volt-ink">
      <Container className="grid gap-10 py-20 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16">
        <div>
          <p className="font-heading text-[15px] tracking-[0.3em]">CONTACT</p>
          <h2 className="mt-3 text-[clamp(2.1rem,5.4vw,3.5rem)] font-bold leading-[1.15]">
            อยากเริ่ม
            <br />
            ทักมาคุยกันก่อนได้
          </h2>
          <p className="mt-5 max-w-md leading-relaxed text-balance">
            สอบถามแพ็กเกจ ราคา เวลาทำการ หรือนัดเข้ามาดูยิม ได้ทุกช่องทาง
          </p>
        </div>

        <ul className="divide-y divide-volt-ink/25 border-y border-volt-ink/25">
          <li>
            <a href={site.lineHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
              <span>
                <span className={labelClass}>LINE</span>
                <span className={valueClass}>{site.lineId}</span>
              </span>
              <Arrow />
            </a>
          </li>
          <li>
            <a href={site.phoneHref} className={linkClass}>
              <span>
                <span className={labelClass}>โทร</span>
                <span className={valueClass}>{site.phoneDisplay}</span>
              </span>
              <Arrow />
            </a>
          </li>
          <li>
            {site.facebookHref ? (
              <a href={site.facebookHref} target="_blank" rel="noopener noreferrer" className={linkClass}>
                <span>
                  <span className={labelClass}>Facebook</span>
                  <span className={valueClass}>{site.facebookName}</span>
                </span>
                <Arrow />
              </a>
            ) : (
              <div className={rowClass}>
                <span>
                  <span className={labelClass}>Facebook</span>
                  <span className={valueClass}>{site.facebookName}</span>
                </span>
              </div>
            )}
          </li>
          {site.address && (
            <li className={rowClass}>
              <span>
                <span className={labelClass}>ที่อยู่</span>
                <span className="mt-1 block text-lg leading-snug">{site.address}</span>
                {site.mapHref && (
                  <a
                    href={site.mapHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block underline underline-offset-4 focus-visible:outline-volt-ink"
                  >
                    เปิดแผนที่
                  </a>
                )}
              </span>
            </li>
          )}
          {site.hours && (
            <li className={rowClass}>
              <span>
                <span className={labelClass}>เวลาเปิด–ปิด</span>
                <span className="mt-1 block text-lg leading-snug">{site.hours}</span>
              </span>
            </li>
          )}
        </ul>
      </Container>
    </section>
  );
}
