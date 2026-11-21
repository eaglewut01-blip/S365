import type { GuideItem } from "@/content/guides";
import type { Locale } from "@/content/site-texts";
import { Panel } from "./form";

const labels = {
  th: { before: "ก่อนเริ่ม", watch: "ข้อควรระวัง" },
  en: { before: "Before you start", watch: "Watch for" },
};

// A list of exercises or stretches: what it works, how much to do, numbered steps and one thing to watch.
export function GuideList({ locale, rules, items }: { locale: Locale; rules: string[]; items: GuideItem[] }) {
  const l = labels[locale];
  return (
    <div className="space-y-3.5">
      <Panel>
        <h2 className="text-lg font-semibold text-text-hi">{l.before}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 font-light leading-relaxed text-text-lo marker:text-volt">
          {rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </Panel>

      <ul className="grid gap-3.5 md:grid-cols-2">
        {items.map((item, i) => (
          <li key={item.id} id={item.id} className="scroll-mt-28">
            <Panel className="h-full">
              <p className="font-heading text-[15px] tracking-[0.24em] text-volt">
                {String(i + 1).padStart(2, "0")} · {item.area[locale]}
              </p>
              <h2 className="mt-0.5 text-2xl font-semibold text-text-hi">{item.name[locale]}</h2>
              <p className="mt-1 text-sm text-text-lo">{item.dose[locale]}</p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-text-hi marker:font-semibold marker:text-volt">
                {item.steps[locale].map((step) => (
                  <li key={step} className="pl-1 font-light">
                    {step}
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-l-2 border-volt/60 pl-3 text-sm font-light leading-relaxed text-text-lo">
                <span className="font-medium text-text-hi">{l.watch}: </span>
                {item.watch[locale]}
              </p>
            </Panel>
          </li>
        ))}
      </ul>
    </div>
  );
}
