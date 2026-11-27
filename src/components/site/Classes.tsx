import { Activity, Disc3, Dumbbell, Flower2, HandFist, HeartPulse, Music, Music2, PersonStanding, Sparkles, Target, Timer, Trophy, Wind, Zap, type LucideIcon } from "lucide-react";
import type { SiteContent } from "@/lib/site-content";
import { CtaLink } from "./primitives";
import { SiteImage } from "./SiteImage";

// Picks an icon from the class name. The order matters: the first match wins.
// A class the list does not know about gets the default icon, so new classes added from the back office still look right.
const ICONS: [RegExp, LucideIcon][] = [
  [/power\s*flow/i, Wind],
  [/yoga|โยคะ/i, Flower2],
  [/aero/i, Zap],
  [/box|มวย/i, HandFist],
  [/functional/i, PersonStanding],
  [/circuit/i, Timer],
  [/cardio|คาร์ดิโอ/i, HeartPulse],
  [/pump|muscle|weight|กล้าม/i, Dumbbell],
  [/hyrox/i, Trophy],
  [/core|\babs?\b/i, Target],
  [/zumba|ซุมบ้า/i, Music],
  [/90/, Disc3],
  [/dance|แดนซ์|เต้น/i, Music2],
  [/hiit|strength|bootcamp/i, Activity],
];

function iconFor(name: string): LucideIcon {
  return ICONS.find(([pattern]) => pattern.test(name))?.[1] ?? Sparkles;
}

// The group classes the gym runs, as a list of names. Hidden when the owner clears the list.
export function Classes({ content }: { content: SiteContent }) {
  const { classes, contact } = content;
  if (classes.items.length === 0 && !classes.schedule) return null;
  const scheduleUrl = classes.schedule && typeof classes.schedule.src === "string" ? classes.schedule.src : null;
  const updated = classes.scheduleUpdated
    ? new Date(classes.scheduleUpdated).toLocaleDateString(content.locale === "en" ? "en-GB" : "th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "long", year: "numeric" })
    : "";
  return (
    <div className="mt-12 md:mt-16">
      <h3 className="text-2xl font-semibold text-text-hi md:text-3xl">{classes.title}</h3>
      {classes.schedule && (
        <figure className="mt-5 max-w-3xl">
          <a href={scheduleUrl ?? undefined} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[3px] ring-1 ring-white/[0.08]">
            <SiteImage photo={classes.schedule} sizes="(min-width: 768px) 768px, 100vw" className="h-auto w-full" />
          </a>
          <figcaption className="mt-2 text-sm font-light text-text-lo">
            {content.locale === "en" ? "This week's class timetable" : "ตารางคลาสสัปดาห์นี้"}
            {updated ? (content.locale === "en" ? ` · updated ${updated}` : ` · อัปเดต ${updated}`) : ""}
            {content.locale === "en" ? " · tap the image to enlarge" : " · แตะภาพเพื่อดูขนาดใหญ่"}
          </figcaption>
        </figure>
      )}
      <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3.5 lg:grid-cols-4">
        {classes.items.map((name) => {
          const Icon = iconFor(name);
          return (
            <li
              key={name}
              className="group flex min-w-0 items-center gap-2.5 rounded-[3px] bg-[#111112] px-3 py-3.5 ring-1 sm:gap-3.5 sm:px-4 ring-white/[0.06] transition hover:ring-volt active:ring-volt"
            >
              <span className="flex size-9 shrink-0 sm:size-10 items-center justify-center rounded-full bg-volt/10 text-volt transition motion-safe:group-hover:-rotate-6 motion-safe:group-hover:scale-110 motion-safe:group-active:scale-110">
                <Icon className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <span className="min-w-0 break-words text-sm font-medium leading-snug text-text-hi sm:text-[15px]">{name}</span>
            </li>
          );
        })}
      </ul>
      {classes.note.trim() && <p className="mt-4 max-w-2xl font-light leading-relaxed text-text-lo">{classes.note}</p>}
      <div className="mt-4 flex flex-wrap gap-3">
        {contact.facebookHref && (
          <CtaLink href={contact.facebookHref} variant="secondary" external>
            Facebook {contact.facebookName}
          </CtaLink>
        )}
        <CtaLink href={contact.lineHref} variant="secondary" external>
          {content.ui.addLine} {contact.lineId}
        </CtaLink>
      </div>
    </div>
  );
}
