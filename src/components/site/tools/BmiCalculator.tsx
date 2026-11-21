"use client";

import { useState } from "react";
import clsx from "clsx";
import type { Locale } from "@/content/site-texts";
import { CtaLink } from "../primitives";
import { Choice, Field, Panel, inputClass } from "./form";

// Asia-Pacific BMI cut-offs (WHO Western Pacific Region, 2000), the scale
// commonly used in Thailand. Overweight starts at 23 instead of 25.
const RANGES = [
  { key: "under", max: 18.5, th: "น้ำหนักน้อยกว่าเกณฑ์", en: "Underweight", tone: "text-[#7fb7ff]" },
  { key: "normal", max: 23, th: "น้ำหนักปกติ", en: "Normal weight", tone: "text-mint" },
  { key: "over", max: 25, th: "น้ำหนักเกิน", en: "Overweight", tone: "text-volt" },
  { key: "high1", max: 30, th: "BMI สูง ระดับ 1", en: "High BMI, level 1", tone: "text-[#ff9b4a]" },
  { key: "high2", max: Infinity, th: "BMI สูง ระดับ 2", en: "High BMI, level 2", tone: "text-coral" },
] as const;

const copy = {
  th: {
    weight: "น้ำหนัก (กิโลกรัม)",
    height: "ส่วนสูง (เซนติเมตร)",
    age: "อายุ (ปี) ไม่ต้องกรอกก็ได้",
    lifts: "ฝึกเวทสม่ำเสมอไหม",
    yes: "ฝึกสม่ำเสมอ",
    no: "ยังไม่ได้ฝึก",
    empty: "ใส่น้ำหนักและส่วนสูงเพื่อดูค่า BMI",
    yourBmi: "ค่า BMI ของคุณ",
    healthy: (low: string, high: string) => `ช่วงน้ำหนักปกติสำหรับส่วนสูงนี้คือ ${low} ถึง ${high} กิโลกรัม`,
    liftsNote:
      "คุณฝึกเวทสม่ำเสมอ ค่า BMI อาจสูงกว่าความจริง เพราะกล้ามเนื้อมีน้ำหนักมาก BMI แยกกล้ามเนื้อกับไขมันไม่ได้ ควรวัดองค์ประกอบร่างกายเพื่อดูภาพที่ชัดกว่า",
    minor:
      "ค่า BMI และเกณฑ์ข้างต้นใช้กับผู้ใหญ่ ถ้าอายุต่ำกว่า 18 ปี การแปลผลต้องใช้เกณฑ์ตามอายุและเพศ ควรปรึกษาแพทย์หรือเทรนเนอร์",
    tableTitle: "เกณฑ์ที่ใช้",
    tableNote: "เกณฑ์สำหรับคนเอเชีย ซึ่งเริ่มนับน้ำหนักเกินที่ 23 (เกณฑ์สากลเริ่มที่ 25)",
    below: "ต่ำกว่า",
    andUp: "ขึ้นไป",
    limit:
      "BMI ดูแค่น้ำหนักกับส่วนสูง แยกไม่ได้ว่าเป็นกล้ามเนื้อหรือไขมัน คนที่กล้ามเนื้อเยอะอาจได้ค่าสูงทั้งที่ไขมันไม่มาก ถ้าอยากรู้ละเอียดขึ้น ให้วัดองค์ประกอบร่างกาย",
    nextTitle: "ขั้นต่อไป",
    next: {
      under: "ถ้าอยากเพิ่มน้ำหนักแบบมีกล้ามเนื้อ เริ่มจาก",
      normal: "ถ้าอยากแข็งแรงขึ้นหรือรักษาหุ่นให้คงที่ เริ่มจาก",
      high: "ถ้าอยากปรับน้ำหนักและสร้างกล้ามเนื้อ เริ่มจาก",
    },
    workout: "แผนออกกำลังกาย",
    meal: "แผนการกิน",
    inbodyTitle: "อยากรู้ว่าเป็นกล้ามเนื้อหรือไขมัน",
    inbodyText: "ครั้งแรกมาเล่นฟรี และวัดองค์ประกอบร่างกายด้วยเครื่อง InBody ฟรี",
    inbodyCta: "ทักไลน์ถามเรื่องมาวัด",
    lineMessage: (bmi: string, label: string) => `สนใจมาเล่นฟรีและวัด InBody ครั้งแรก ค่า BMI ของฉันคือ ${bmi} (${label})`,
  },
  en: {
    weight: "Weight (kg)",
    height: "Height (cm)",
    age: "Age (years), optional",
    lifts: "Do you lift weights regularly?",
    yes: "Yes, regularly",
    no: "Not yet",
    empty: "Enter your weight and height to see your BMI",
    yourBmi: "Your BMI",
    healthy: (low: string, high: string) => `The normal weight range for this height is ${low} to ${high} kg`,
    liftsNote:
      "You lift regularly, so your BMI may read higher than your real condition, because muscle is heavy. BMI cannot tell muscle from fat. A body composition test gives a clearer picture.",
    minor:
      "BMI and the ranges above are for adults. Under 18, results need age and sex specific charts, so please talk to a doctor or a trainer.",
    tableTitle: "Ranges used",
    tableNote: "Asia-Pacific cut-offs, where overweight starts at 23 (the international scale starts at 25)",
    below: "Below",
    andUp: "and above",
    limit:
      "BMI only looks at weight and height. It cannot tell muscle from fat, so a muscular person can score high without carrying much fat. A body composition test gives a fuller picture.",
    nextTitle: "Next step",
    next: {
      under: "To gain weight with muscle, start with",
      normal: "To get stronger or keep your shape, start with",
      high: "To adjust your weight and build muscle, start with",
    },
    workout: "the workout plan",
    meal: "the meal plan",
    inbodyTitle: "Want to know if it is muscle or fat?",
    inbodyText: "Your first visit is free to train, and the InBody body composition scan is free too.",
    inbodyCta: "Ask us on LINE about a scan",
    lineMessage: (bmi: string, label: string) => `I'm interested in the free first visit and InBody scan. My BMI is ${bmi} (${label})`,
  },
};

function toolPath(locale: Locale, path: string) {
  return locale === "en" ? `/en${path}` : path;
}

export function BmiCalculator({ locale, lineId, lineHref }: { locale: Locale; lineId: string; lineHref: string }) {
  const c = copy[locale];
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [lifts, setLifts] = useState<"yes" | "no" | "">("");

  const kg = Number.parseFloat(weight);
  const cm = Number.parseFloat(height);
  const years = Number.parseFloat(age);
  const valid = kg >= 20 && kg <= 300 && cm >= 100 && cm <= 230;
  const metres = cm / 100;
  const bmi = valid ? kg / (metres * metres) : null;
  const range = bmi === null ? null : RANGES.find((r) => bmi < r.max)!;
  const minor = years > 0 && years < 18;
  const group: keyof typeof c.next | null = range === null ? null : range.key === "under" ? "under" : range.key === "normal" ? "normal" : "high";

  // LINE official accounts (ids starting with @) can open a chat with the text already typed in.
  const chatHref =
    bmi !== null && range !== null && lineId.startsWith("@")
      ? `https://line.me/R/oaMessage/${lineId}/?${encodeURIComponent(c.lineMessage(bmi.toFixed(1), range[locale]))}`
      : lineHref;

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
          <Field label={c.age} htmlFor="bmi-age">
            <input id="bmi-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" className={inputClass} />
          </Field>
          <Choice
            label={c.lifts}
            options={[
              { value: "yes", label: c.yes },
              { value: "no", label: c.no },
            ]}
            value={lifts}
            onChange={setLifts}
          />
        </div>

        <div aria-live="polite" className="mt-6 min-h-[150px] border-t border-white/10 pt-6">
          {bmi === null || !range || !group ? (
            <p className="font-light text-text-lo">{c.empty}</p>
          ) : (
            <>
              <p className="text-sm text-text-lo">{c.yourBmi}</p>
              <p className="font-heading text-[5.5rem] leading-none tracking-wide text-text-hi">{bmi.toFixed(1)}</p>
              {minor ? (
                <p className="mt-3 font-light leading-relaxed text-text-lo">{c.minor}</p>
              ) : (
                <>
                  <p className={clsx("mt-1 text-2xl font-semibold", range.tone)}>{range[locale]}</p>
                  <p className="mt-3 font-light text-text-lo">
                    {c.healthy((18.5 * metres * metres).toFixed(1), (22.9 * metres * metres).toFixed(1))}
                  </p>
                  {lifts === "yes" && bmi >= 23 && (
                    <p className="mt-4 border-l-2 border-volt pl-4 font-light leading-relaxed text-text-hi">{c.liftsNote}</p>
                  )}
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <h2 className="text-lg font-semibold text-text-hi">{c.nextTitle}</h2>
                    <p className="mt-1.5 font-light leading-relaxed text-text-lo">{c.next[group]}</p>
                    <div className="mt-3 flex flex-wrap gap-2.5">
                      <a href={toolPath(locale, "/tools/workout-plan")} className="rounded-[3px] border border-white/20 px-4 py-2.5 text-[15px] font-medium text-text-hi transition hover:border-volt hover:text-volt">
                        {c.workout}
                      </a>
                      {group !== "normal" && (
                        <a href={toolPath(locale, "/tools/meal-plan")} className="rounded-[3px] border border-white/20 px-4 py-2.5 text-[15px] font-medium text-text-hi transition hover:border-volt hover:text-volt">
                          {c.meal}
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
              <div className="mt-6 rounded-[3px] border border-volt/40 p-4">
                <h2 className="text-lg font-semibold text-text-hi">{c.inbodyTitle}</h2>
                <p className="mt-1.5 font-light leading-relaxed text-text-lo">{c.inbodyText}</p>
                <CtaLink href={chatHref} external className="mt-3.5">
                  {c.inbodyCta}
                </CtaLink>
              </div>
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
              <li key={r.en} className={clsx("flex justify-between gap-4 py-2.5", !minor && range === r && "font-semibold")}>
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
