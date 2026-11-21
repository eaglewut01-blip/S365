import type { Metadata } from "next";
import { SITE_NAME } from "@/content/site";
import type { Locale } from "@/content/site-texts";
import { uiStrings } from "@/content/ui-strings";
import { getCrowd, type CrowdData } from "@/lib/site-items";
import { localizedPath } from "../SiteNav";
import { SubPage } from "../SubPage";

const PATH = "/tools/crowd";

export function crowdMetadata(locale: Locale): Metadata {
  const ui = uiStrings[locale];
  return {
    title: `${ui.crowdTitle} | ${SITE_NAME}`,
    description: ui.crowdDesc,
    alternates: { canonical: localizedPath(locale, PATH), languages: { th: localizedPath("th", PATH), en: localizedPath("en", PATH) } },
  };
}

// "Busy" is relative to this gym's own busiest 90 minutes of the last four
// weeks. Without enough history there is nothing to compare against, so only
// the raw count is shown.
function level(crowd: CrowdData): "quiet" | "moderate" | "busy" | null {
  if (crowd.daysOfData < 7 || crowd.peak < 4) return null;
  const ratio = crowd.now / crowd.peak;
  return ratio < 0.35 ? "quiet" : ratio < 0.7 ? "moderate" : "busy";
}

function bangkok(now: Date, locale: Locale) {
  const tag = locale === "th" ? "th-TH" : "en-GB";
  return {
    hour: Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok" }).format(now)),
    time: new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Bangkok" }).format(now),
    day: new Intl.DateTimeFormat(tag, { weekday: "long", timeZone: "Asia/Bangkok" }).format(now),
  };
}

const hourLabel = (hour: number) => `${String(hour).padStart(2, "0")}:00`;

function HourlyChart({ crowd, currentHour, locale }: { crowd: CrowdData; currentHour: number; locale: Locale }) {
  const ui = uiStrings[locale];
  const byHour = new Map(crowd.hourly.map((row) => [row.hour, row.avg]));
  const first = Math.min(6, ...byHour.keys());
  const last = Math.max(22, ...byHour.keys());
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const max = Math.max(1, ...byHour.values());
  const format = (value: number) => value.toLocaleString(locale === "th" ? "th-TH" : "en-US", { maximumFractionDigits: 1 });

  return (
    <div>
      {/* One series, so no legend: the heading names it. Each bar is focusable and shows its value on hover or focus. */}
      <ul className="flex h-44 items-end gap-[2px] border-b border-white/15 md:h-56">
        {hours.map((hour) => {
          const avg = byHour.get(hour) ?? 0;
          const current = hour === currentHour;
          return (
            <li key={hour} tabIndex={0} className="group relative flex h-full flex-1 items-end outline-none">
              <span className="sr-only">
                {hourLabel(hour)}: {format(avg)} {ui.crowdPerHour}
              </span>
              <span
                aria-hidden
                className={`w-full rounded-t-[4px] transition-colors ${
                  current ? "bg-volt" : "bg-white/25 group-hover:bg-white/45 group-focus-visible:bg-white/45"
                }`}
                style={{ height: `${avg > 0 ? Math.max((avg / max) * 100, 2) : 0}%` }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-[3px] bg-[#242423] px-2 py-1 text-xs text-text-hi shadow-lg group-hover:block group-focus-visible:block"
              >
                {hourLabel(hour)} · {format(avg)} {ui.crowdPerHour}
              </span>
            </li>
          );
        })}
      </ul>
      <div aria-hidden className="mt-1.5 flex gap-[2px] text-[11px] tabular-nums text-text-lo">
        {hours.map((hour) => (
          <span key={hour} className={`flex-1 text-center ${hour === currentHour ? "font-semibold text-text-hi" : ""}`}>
            {hour % 3 === 0 || hour === currentHour ? hour : ""}
          </span>
        ))}
      </div>

      <details className="mt-5 text-sm text-text-lo">
        <summary className="cursor-pointer underline-offset-4 hover:underline">
          {ui.crowdHour} / {ui.crowdAvg}
        </summary>
        <table className="mt-3 w-full max-w-xs tabular-nums">
          <thead>
            <tr className="text-left text-text-faint">
              <th className="py-1 font-normal">{ui.crowdHour}</th>
              <th className="py-1 text-right font-normal">{ui.crowdAvg}</th>
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => (
              <tr key={hour} className="border-t border-white/[0.06]">
                <td className="py-1">{hourLabel(hour)}</td>
                <td className="py-1 text-right text-text-hi">{format(byHour.get(hour) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export async function CrowdPage({ locale }: { locale: Locale }) {
  const ui = uiStrings[locale];
  const crowd = await getCrowd();
  const now = bangkok(new Date(), locale);
  const current = crowd ? level(crowd) : null;
  const levelText = { quiet: ui.crowdQuiet, moderate: ui.crowdModerate, busy: ui.crowdBusy };
  const filled = { quiet: 1, moderate: 2, busy: 3 };

  return (
    <SubPage locale={locale} path={PATH} eyebrow={ui.crowdEyebrow} title={ui.crowdTitle} intro={ui.crowdDesc} back>
      {!crowd ? (
        <p className="rounded-[3px] border border-dashed border-white/15 p-6 font-light text-text-lo">{ui.crowdUnavailable}</p>
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-[minmax(0,360px)_1fr]">
          <section className="rounded-[3px] bg-[#111112] p-5 md:p-7">
            <h2 className="text-sm font-medium text-text-lo">{ui.crowdNow}</h2>
            {current ? (
              <>
                <p className="mt-1 text-[clamp(2.4rem,9vw,3.5rem)] font-bold leading-tight text-text-hi">{levelText[current]}</p>
                <div aria-hidden className="mt-3 flex gap-1.5">
                  {[1, 2, 3].map((step) => (
                    <span key={step} className={`h-2 flex-1 rounded-full ${step <= filled[current] ? "bg-volt" : "bg-white/15"}`} />
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-1 text-[clamp(2.4rem,9vw,3.5rem)] font-bold leading-tight tabular-nums text-text-hi">{crowd.now}</p>
            )}
            <p className="mt-4 font-light leading-relaxed text-text-hi">{ui.crowdCount.replace("{n}", String(crowd.now))}</p>
            <p className="mt-1 text-sm text-text-faint">{ui.crowdUpdated.replace("{time}", now.time)}</p>
          </section>

          <section className="rounded-[3px] bg-[#111112] p-5 md:p-7">
            <h2 className="text-lg font-semibold text-text-hi">{ui.crowdChartTitle.replace("{day}", now.day)}</h2>
            <p className="mt-0.5 text-sm font-light text-text-lo">{ui.crowdChartDesc}</p>
            <div className="mt-6">
              {crowd.hourly.length === 0 ? (
                <p className="font-light text-text-lo">{ui.crowdNoChart}</p>
              ) : (
                <HourlyChart crowd={crowd} currentHour={now.hour} locale={locale} />
              )}
            </div>
          </section>
        </div>
      )}
      <p className="mt-8 max-w-3xl border-l-2 border-white/15 pl-4 text-sm font-light leading-relaxed text-text-lo">{ui.crowdNote}</p>
    </SubPage>
  );
}
