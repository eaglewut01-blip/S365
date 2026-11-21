"use client";

import { useState } from "react";
import clsx from "clsx";
import type { Locale } from "@/content/site-texts";
import { Field, Panel, inputClass } from "./form";

// Asia-Pacific BMI cut-offs (WHO Western Pacific Region, 2000), the scale
// commonly used in Thailand. Overweight starts at 23 instead of 25.
const RANGES = [
  { max: 18.5, th: "น้ำหนักน้อยกว่าเกณฑ์", en: "Underweight", tone: "text-[#7fb7ff]" },
  { max: 23, th: "น้ำหนักปกติ", en: "Normal weight", tone: "text-mint" },
  { max: 25, th: "น้ำหนักเกิน", en: "Overweight", tone: "text-volt" },
  { max: 30, th: "อ้วนระดับ 1", en: "Obese, class I", tone: "text-[#ff9b4a]" },
  { max: Infinity, th: "อ้วนระดับ 2", en: "Obese, class II", tone: "text-coral" },
] as const;

const copy = {
  th: {
    weight: "น้ำหนัก (กิโลกรัม)",
    height: "ส่วนสูง (เซนติเมตร)",
    empty: "ใส่น้ำหนักและส่วนสูงเพื่อดูค่า BMI",
    yourBmi: "ค่า BMI ของคุณ",
    healthy: (low: string, high: string) => `ช่วงน้ำหนักปกติสำหรับส่วนสูงนี้คือ ${low} ถึง ${high} กิโลกรัม`,
    tableTitle: "เกณฑ์ที่ใช้",
    tableNote: "เกณฑ์สำหรับคนเอเชีย ซึ่งเริ่มนับน้ำหนักเกินที่ 23 (เกณฑ์สากลเริ่มที่ 25)",
    below: "ต่ำกว่า",
    andUp: "ขึ้นไป",
    limit:
      "BMI ดูแค่น้ำหนักกับส่วนสูง แยกไม่ได้ว่าเป็นกล้ามเนื้อหรือไขมัน คนที่กล้ามเนื้อเยอะอาจได้ค่าสูงทั้งที่ไขมันไม่มาก ถ้าอยากรู้ละเอียดขึ้น ให้วัดองค์ประกอบร่างกาย",
  },
  en: {
    weight: "Weight (kg)",
    height: "Height (cm)",
    empty: "Enter your weight and height to see your BMI",
    yourBmi: "Your BMI",
    healthy: (low: string, high: string) => `The normal weight range for this height is ${low} to ${high} kg`,
    tableTitle: "Ranges used",
    tableNote: "Asia-Pacific cut-offs, where overweight starts at 23 (the international scale starts at 25)",
    below: "Below",
    andUp: "and above",
    limit:
      "BMI only looks at weight and height. It cannot tell muscle from fat, so a muscular person can score high without carrying much fat. A body composition test gives a fuller picture.",
  },
};

export function BmiCalculator({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  const kg = Number.parseFloat(weight);
  const cm = Number.parseFloat(height);
  const valid = kg >= 20 && kg <= 300 && cm >= 100 && cm <= 230;
  const metres = cm / 100;
  const bmi = valid ? kg / (metres * metres) : null;
  const range = bmi === null ? null : RANGES.find((r) => bmi < r.max)!;

  return (
    <div className="grid gap-3.5 lg:grid-cols-[1fr_1fr]">
      <Panel>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={c.weight} htmlFor="bmi-weight">
            <input id="bmi-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" className={inputClass} />
          </Field>
          <Field label={c.height} htmlFor="bmi-height">
            <input id="bmi-height" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className={inputClass} />
          </Field>
        </div>

        <div aria-live="polite" className="mt-6 min-h-[150px] border-t border-white/10 pt-6">
          {bmi === null || !range ? (
            <p className="font-light text-text-lo">{c.empty}</p>
          ) : (
            <>
              <p className="text-sm text-text-lo">{c.yourBmi}</p>
              <p className="font-heading text-[5.5rem] leading-none tracking-wide text-text-hi">{bmi.toFixed(1)}</p>
              <p className={clsx("mt-1 text-2xl font-semibold", range.tone)}>{range[locale]}</p>
              <p className="mt-3 font-light text-text-lo">
                {c.healthy((18.5 * metres * metres).toFixed(1), (22.9 * metres * metres).toFixed(1))}
              </p>
            </>
          )}
        </div>
      </Panel>

      <Panel>
        <h2 className="text-lg font-semibold text-text-hi">{c.tableTitle}</h2>
        <ul className="mt-3 divide-y divide-white/10">
          {RANGES.map((r, i) => {
            const low = i === 0 ? null : RANGES[i - 1].max;
            const label =
              low === null ? `${c.below} 18.5` : r.max === Infinity ? `${low.toFixed(1)} ${c.andUp}` : `${low.toFixed(1)} – ${(r.max - 0.1).toFixed(1)}`;
            return (
              <li key={r.en} className={clsx("flex justify-between gap-4 py-2.5", range === r && "font-semibold")}>
                <span className={r.tone}>{r[locale]}</span>
                <span className="tabular-nums text-text-hi">{label}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-sm font-light text-text-lo">{c.tableNote}</p>
        <p className="mt-4 text-sm font-light leading-relaxed text-text-lo">{c.limit}</p>
      </Panel>
    </div>
  );
}
