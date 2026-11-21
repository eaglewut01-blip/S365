"use client";

import { useState } from "react";
import type { Locale } from "@/content/site-texts";
import { Choice, Field, Panel, Stat, inputClass } from "./form";

type Sex = "male" | "female";
type Goal = "lose" | "keep" | "gain";
type Activity = 1.2 | 1.375 | 1.55 | 1.725;

const copy = {
  th: {
    sex: "เพศ",
    sexes: { male: "ชาย", female: "หญิง" },
    age: "อายุ (ปี)",
    weight: "น้ำหนัก (กิโลกรัม)",
    height: "ส่วนสูง (เซนติเมตร)",
    activity: "ในหนึ่งสัปดาห์ ขยับตัวมากแค่ไหน",
    activities: {
      1.2: "นั่งทำงาน แทบไม่ออกกำลังกาย",
      1.375: "ออกกำลังกาย 1 ถึง 3 วัน",
      1.55: "ออกกำลังกาย 3 ถึง 5 วัน",
      1.725: "ออกกำลังกายหนัก 6 ถึง 7 วัน",
    },
    goal: "เป้าหมาย",
    goals: { lose: "ลดไขมัน", keep: "รักษาน้ำหนัก", gain: "เพิ่มกล้ามเนื้อ" },
    empty: "กรอกข้อมูลให้ครบเพื่อดูแผน",
    minor: "เครื่องมือนี้ออกแบบสำหรับผู้ใหญ่อายุ 18 ปีขึ้นไป ถ้าอายุต่ำกว่านี้ ควรให้แพทย์หรือนักกำหนดอาหารช่วยวางแผน",
    perDay: "เป้าหมายต่อวัน",
    kcal: "พลังงาน",
    kcalUnit: "กิโลแคลอรี",
    protein: "โปรตีน",
    carbs: "คาร์โบไฮเดรต",
    fat: "ไขมัน",
    gram: "กรัม",
    maintain: (kcal: number) => `ร่างกายคุณใช้พลังงานประมาณ ${kcal.toLocaleString()} กิโลแคลอรีต่อวัน`,
    floor: "เราไม่แนะนำให้กินต่ำกว่านี้โดยไม่มีผู้เชี่ยวชาญดูแล จึงปรับค่าขึ้นมาที่ระดับต่ำสุดที่ปลอดภัย",
    mealsTitle: "แบ่งเป็นมื้อ",
    meals: ["มื้อเช้า", "มื้อกลางวัน", "มื้อเย็น", "ของว่าง"],
    ideasTitle: "ตัวอย่างเมนูที่หาได้ทั่วไป",
    ideas: [
      ["มื้อเช้า", "ไข่ต้ม 2 ฟองกับข้าวกล้องและผัก โจ๊กหมูใส่ไข่ หรือโยเกิร์ตไม่หวานกับกล้วยและถั่ว"],
      ["มื้อกลางวัน", "ข้าวมันไก่ไม่หนัง ข้าวกะเพราไก่ไข่ดาว (ขอน้ำมันน้อย) หรือก๋วยเตี๋ยวน้ำใสใส่เนื้อสัตว์เพิ่ม"],
      ["มื้อเย็น", "ปลานึ่งหรือปลาย่างกับผัก แกงจืดเต้าหู้หมูสับ ต้มยำน้ำใส หรืออกไก่ย่างกับส้มตำ"],
      ["ของว่าง", "นมจืดหรือนมถั่วเหลืองหวานน้อย ไข่ต้ม ผลไม้ 1 ส่วน หรือถั่วอบไม่ใส่เกลือ 1 กำมือ"],
    ],
    tipsTitle: "หลักง่ายๆ",
    tips: {
      lose: "ลดเครื่องดื่มหวานและของทอดก่อน เพราะตัดพลังงานได้มากโดยไม่ต้องอดอาหาร ตั้งเป้าลดสัปดาห์ละไม่เกิน 0.5 ถึง 1 กิโลกรัม",
      keep: "กินให้ใกล้เคียงเป้าหมายในแต่ละวัน และชั่งน้ำหนักสัปดาห์ละครั้ง ถ้าน้ำหนักเปลี่ยนต่อเนื่อง 2 ถึง 3 สัปดาห์ ค่อยปรับปริมาณ",
      gain: "เพิ่มมื้อว่างที่มีโปรตีนแทนการกินมื้อหลักให้อิ่มเกิน และฝึกเวทสม่ำเสมอ ไม่อย่างนั้นพลังงานส่วนเกินจะกลายเป็นไขมัน",
    },
    plate: "ทุกมื้อให้มีโปรตีนขนาดประมาณฝ่ามือ ผักครึ่งจาน และข้าวหรือแป้งตามเป้าหมาย ดื่มน้ำเปล่าเป็นหลัก",
    estimate: "ตัวเลขทั้งหมดเป็นค่าประมาณจากสูตร Mifflin-St Jeor ร่างกายแต่ละคนต่างกัน ใช้เป็นจุดเริ่มต้นแล้วปรับตามผลจริง",
  },
  en: {
    sex: "Sex",
    sexes: { male: "Male", female: "Female" },
    age: "Age (years)",
    weight: "Weight (kg)",
    height: "Height (cm)",
    activity: "How active are you in a week",
    activities: {
      1.2: "Desk job, little exercise",
      1.375: "Exercise 1 to 3 days",
      1.55: "Exercise 3 to 5 days",
      1.725: "Hard exercise 6 to 7 days",
    },
    goal: "Goal",
    goals: { lose: "Lose fat", keep: "Maintain weight", gain: "Build muscle" },
    empty: "Fill in every field to see your plan",
    minor: "This tool is designed for adults aged 18 and over. If you are younger, ask a doctor or dietitian to plan this with you.",
    perDay: "Daily targets",
    kcal: "Energy",
    kcalUnit: "kcal",
    protein: "Protein",
    carbs: "Carbohydrate",
    fat: "Fat",
    gram: "g",
    maintain: (kcal: number) => `Your body uses about ${kcal.toLocaleString()} kcal a day`,
    floor: "We do not recommend eating less than this without professional supervision, so the target has been raised to the lowest safe level.",
    mealsTitle: "Split into meals",
    meals: ["Breakfast", "Lunch", "Dinner", "Snack"],
    ideasTitle: "Example meals that are easy to find",
    ideas: [
      ["Breakfast", "Two boiled eggs with brown rice and vegetables, pork congee with an egg, or unsweetened yoghurt with banana and nuts"],
      ["Lunch", "Chicken rice without the skin, basil chicken with rice and a fried egg (ask for less oil), or clear-soup noodles with extra meat"],
      ["Dinner", "Steamed or grilled fish with vegetables, clear soup with tofu and minced pork, clear tom yum, or grilled chicken breast with papaya salad"],
      ["Snack", "Plain milk or low-sugar soy milk, a boiled egg, one portion of fruit, or a handful of unsalted roasted nuts"],
    ],
    tipsTitle: "Simple rules",
    tips: {
      lose: "Cut sweet drinks and fried food first. That removes a lot of energy without skipping meals. Aim to lose no more than 0.5 to 1 kg a week.",
      keep: "Eat close to the target each day and weigh yourself once a week. Adjust only if your weight keeps moving for 2 to 3 weeks.",
      gain: "Add a protein snack instead of overfilling main meals, and lift regularly. Otherwise the extra energy is stored as fat.",
    },
    plate: "At every meal, have a palm-sized portion of protein, half a plate of vegetables, and rice or other starch to fit your target. Drink mostly water.",
    estimate: "All figures are estimates from the Mifflin-St Jeor equation. Bodies differ, so use this as a starting point and adjust to real results.",
  },
};

const MEAL_SHARE = [0.25, 0.35, 0.3, 0.1];

export function MealPlanner({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activity, setActivity] = useState<Activity>(1.375);
  const [goal, setGoal] = useState<Goal>("lose");

  const years = Number.parseFloat(age);
  const kg = Number.parseFloat(weight);
  const cm = Number.parseFloat(height);
  const valid = years >= 10 && years <= 100 && kg >= 30 && kg <= 250 && cm >= 120 && cm <= 230;
  const minor = valid && years < 18;

  let plan: { tdee: number; kcal: number; protein: number; carbs: number; fat: number; floored: boolean } | null = null;
  if (valid && !minor) {
    // Mifflin-St Jeor resting energy, then scaled by activity.
    const bmr = 10 * kg + 6.25 * cm - 5 * years + (sex === "male" ? 5 : -161);
    const tdee = bmr * activity;
    const target = goal === "lose" ? tdee * 0.82 : goal === "gain" ? tdee * 1.1 : tdee;
    const floor = sex === "male" ? 1500 : 1200;
    const kcal = Math.round(Math.max(target, floor) / 10) * 10;
    const protein = Math.round(kg * (goal === "keep" ? 1.4 : 1.8));
    const fat = Math.round((kcal * 0.27) / 9);
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
    plan = { tdee: Math.round(tdee / 10) * 10, kcal, protein, carbs, fat, floored: target < floor };
  }

  return (
    <div className="grid gap-3.5 lg:grid-cols-[380px_1fr]">
      <Panel className="space-y-5 lg:self-start">
        <Choice label={c.sex} value={sex} onChange={setSex} options={(["male", "female"] as const).map((value) => ({ value, label: c.sexes[value] }))} />
        <div className="grid grid-cols-3 gap-3">
          <Field label={c.age} htmlFor="meal-age">
            <input id="meal-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} placeholder="30" className={inputClass} />
          </Field>
          <Field label={c.weight} htmlFor="meal-weight">
            <input id="meal-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="65" className={inputClass} />
          </Field>
          <Field label={c.height} htmlFor="meal-height">
            <input id="meal-height" inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="170" className={inputClass} />
          </Field>
        </div>
        <Choice
          label={c.activity}
          value={activity}
          onChange={setActivity}
          options={([1.2, 1.375, 1.55, 1.725] as const).map((value) => ({ value, label: c.activities[value] }))}
        />
        <Choice label={c.goal} value={goal} onChange={setGoal} options={(["lose", "keep", "gain"] as const).map((value) => ({ value, label: c.goals[value] }))} />
      </Panel>

      <div aria-live="polite" className="space-y-3.5">
        {!plan ? (
          <Panel>
            <p className="font-light leading-relaxed text-text-lo">{minor ? c.minor : c.empty}</p>
          </Panel>
        ) : (
          <>
            <Panel>
              <h2 className="text-lg font-semibold text-text-hi">{c.perDay}</h2>
              <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
                <Stat label={c.kcal} value={plan.kcal.toLocaleString()} unit={c.kcalUnit} />
                <Stat label={c.protein} value={String(plan.protein)} unit={c.gram} />
                <Stat label={c.carbs} value={String(plan.carbs)} unit={c.gram} />
                <Stat label={c.fat} value={String(plan.fat)} unit={c.gram} />
              </div>
              <p className="mt-3 text-sm font-light text-text-lo">{c.maintain(plan.tdee)}</p>
              {plan.floored && <p className="mt-2 text-sm text-volt">{c.floor}</p>}
            </Panel>

            <Panel>
              <h2 className="text-lg font-semibold text-text-hi">{c.mealsTitle}</h2>
              <ul className="mt-3 divide-y divide-white/10">
                {c.meals.map((meal, i) => (
                  <li key={meal} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="text-text-hi">{meal}</span>
                    <span className="text-sm tabular-nums text-text-lo">
                      {(Math.round((plan.kcal * MEAL_SHARE[i]) / 10) * 10).toLocaleString()} {c.kcalUnit} · {c.protein}{" "}
                      {Math.round(plan.protein * MEAL_SHARE[i])} {c.gram}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>
          </>
        )}

        <Panel>
          <h2 className="text-lg font-semibold text-text-hi">{c.ideasTitle}</h2>
          <dl className="mt-3 space-y-3">
            {c.ideas.map(([meal, text]) => (
              <div key={meal}>
                <dt className="font-medium text-volt">{meal}</dt>
                <dd className="font-light leading-relaxed text-text-lo">{text}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel>
          <h2 className="text-lg font-semibold text-text-hi">{c.tipsTitle}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-light leading-relaxed text-text-lo marker:text-volt">
            <li>{c.tips[goal]}</li>
            <li>{c.plate}</li>
            <li>{c.estimate}</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
