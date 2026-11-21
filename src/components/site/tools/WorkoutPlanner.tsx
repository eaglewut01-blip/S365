"use client";

import { useState } from "react";
import type { Locale } from "@/content/site-texts";
import { Choice, Panel } from "./form";

type Goal = "fat" | "muscle" | "general";
type Level = "beginner" | "intermediate";
type Place = "gym" | "home";
type Text = Record<Locale, string>;

// Exercise names. Timed holds are marked so they get seconds instead of repetitions.
const X: Record<string, Text & { hold?: boolean }> = {
  legPress: { th: "เลกเพรส", en: "Leg press" },
  gobletSquat: { th: "กอบเล็ตสควอต (ถือดัมเบลล์)", en: "Goblet squat" },
  rdl: { th: "โรมาเนียนเดดลิฟต์ (ดัมเบลล์)", en: "Dumbbell Romanian deadlift" },
  legCurl: { th: "เลกเคิร์ล", en: "Leg curl" },
  legExtension: { th: "เลกเอ็กซ์เทนชัน", en: "Leg extension" },
  gluteMachine: { th: "เครื่องฝึกสะโพก หรือฮิปทรัสต์", en: "Glute machine or hip thrust" },
  lunge: { th: "วอล์กกิงลันจ์", en: "Walking lunge" },
  calfRaise: { th: "เขย่งน่อง", en: "Calf raise" },
  chestPress: { th: "เชสต์เพรส (เครื่อง)", en: "Machine chest press" },
  inclinePress: { th: "อินไคลน์ดัมเบลล์เพรส", en: "Incline dumbbell press" },
  latPulldown: { th: "แลตพูลดาวน์", en: "Lat pulldown" },
  seatedRow: { th: "ซีทเต็ดโรว์", en: "Seated row" },
  dbRow: { th: "ดัมเบลล์โรว์", en: "Dumbbell row" },
  shoulderPress: { th: "ดัมเบลล์โชลเดอร์เพรส", en: "Dumbbell shoulder press" },
  lateralRaise: { th: "แลตเทอรัลเรส", en: "Lateral raise" },
  facePull: { th: "เฟซพูล", en: "Face pull" },
  curl: { th: "ดัมเบลล์เคิร์ล", en: "Dumbbell curl" },
  pushdown: { th: "ไตรเซปส์พุชดาวน์", en: "Triceps pushdown" },
  plank: { th: "แพลงก์", en: "Plank", hold: true },
  deadBug: { th: "เดดบั๊ก", en: "Dead bug" },
  // No equipment
  squat: { th: "สควอต", en: "Bodyweight squat" },
  reverseLunge: { th: "รีเวิร์สลันจ์", en: "Reverse lunge" },
  gluteBridge: { th: "กลูตบริดจ์", en: "Glute bridge" },
  singleBridge: { th: "กลูตบริดจ์ขาเดียว", en: "Single-leg glute bridge" },
  wallSit: { th: "วอลล์ซิต (นั่งพิงผนัง)", en: "Wall sit", hold: true },
  pushUp: { th: "วิดพื้น (วางเข่าได้)", en: "Push-up (knees down is fine)" },
  pikePushUp: { th: "ไพค์พุชอัป", en: "Pike push-up" },
  chairDip: { th: "แชร์ดิป (ใช้เก้าอี้)", en: "Chair dip" },
  superman: { th: "ซูเปอร์แมน", en: "Superman" },
  birdDog: { th: "เบิร์ดด็อก", en: "Bird dog" },
  sidePlank: { th: "ไซด์แพลงก์", en: "Side plank", hold: true },
  shoulderTap: { th: "แพลงก์แตะไหล่", en: "Plank shoulder tap" },
  mountain: { th: "เมาน์เทนไคลม์เบอร์", en: "Mountain climber" },
};

const SESSIONS: Record<Place, Record<string, { name: Text; moves: string[] }>> = {
  gym: {
    fullA: { name: { th: "ทั้งตัว A", en: "Full body A" }, moves: ["legPress", "chestPress", "latPulldown", "shoulderPress", "legCurl", "plank"] },
    fullB: { name: { th: "ทั้งตัว B", en: "Full body B" }, moves: ["gobletSquat", "seatedRow", "inclinePress", "rdl", "lateralRaise", "deadBug"] },
    fullC: { name: { th: "ทั้งตัว C", en: "Full body C" }, moves: ["lunge", "chestPress", "dbRow", "gluteMachine", "facePull", "plank"] },
    upper: { name: { th: "ช่วงบน", en: "Upper body" }, moves: ["chestPress", "latPulldown", "shoulderPress", "seatedRow", "curl", "pushdown"] },
    lower: { name: { th: "ช่วงล่าง", en: "Lower body" }, moves: ["legPress", "rdl", "legCurl", "legExtension", "gluteMachine", "calfRaise"] },
    push: { name: { th: "ดัน (อก ไหล่ หลังแขน)", en: "Push (chest, shoulders, triceps)" }, moves: ["chestPress", "inclinePress", "shoulderPress", "lateralRaise", "pushdown"] },
    pull: { name: { th: "ดึง (หลัง หน้าแขน)", en: "Pull (back, biceps)" }, moves: ["latPulldown", "seatedRow", "dbRow", "facePull", "curl"] },
    legs: { name: { th: "ขาและสะโพก", en: "Legs and glutes" }, moves: ["gobletSquat", "legPress", "rdl", "legCurl", "lunge", "calfRaise"] },
  },
  home: {
    fullA: { name: { th: "ทั้งตัว A", en: "Full body A" }, moves: ["squat", "pushUp", "gluteBridge", "superman", "plank"] },
    fullB: { name: { th: "ทั้งตัว B", en: "Full body B" }, moves: ["reverseLunge", "pikePushUp", "singleBridge", "birdDog", "sidePlank"] },
    fullC: { name: { th: "ทั้งตัว C", en: "Full body C" }, moves: ["squat", "chairDip", "reverseLunge", "superman", "mountain"] },
    upper: { name: { th: "ช่วงบนและแกนกลาง", en: "Upper body and core" }, moves: ["pushUp", "pikePushUp", "chairDip", "superman", "shoulderTap"] },
    lower: { name: { th: "ช่วงล่าง", en: "Lower body" }, moves: ["squat", "reverseLunge", "gluteBridge", "wallSit", "calfRaise"] },
    push: { name: { th: "ช่วงบน", en: "Upper body" }, moves: ["pushUp", "pikePushUp", "chairDip", "shoulderTap"] },
    pull: { name: { th: "หลังและแกนกลาง", en: "Back and core" }, moves: ["superman", "birdDog", "plank", "sidePlank", "mountain"] },
    legs: { name: { th: "ขาและสะโพก", en: "Legs and glutes" }, moves: ["squat", "reverseLunge", "singleBridge", "wallSit", "calfRaise"] },
  },
};

const SPLITS: Record<number, { sessions: string[]; days: number[] }> = {
  2: { sessions: ["fullA", "fullB"], days: [0, 3] },
  3: { sessions: ["fullA", "fullB", "fullC"], days: [0, 2, 4] },
  4: { sessions: ["upper", "lower", "upper", "lower"], days: [0, 1, 3, 4] },
  5: { sessions: ["push", "pull", "legs", "upper", "lower"], days: [0, 1, 2, 3, 4] },
};

const WEEKDAYS: Record<Locale, string[]> = {
  th: ["จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์"],
  en: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
};

const copy = {
  th: {
    goal: "เป้าหมาย",
    goals: { fat: "ลดไขมัน", muscle: "เพิ่มกล้ามเนื้อ", general: "แข็งแรงทั่วไป" },
    days: "ฝึกกี่วันต่อสัปดาห์",
    daysUnit: "วัน",
    level: "ประสบการณ์",
    levels: { beginner: "เพิ่งเริ่ม", intermediate: "ฝึกมาแล้ว 6 เดือนขึ้นไป" },
    place: "ฝึกที่ไหน",
    places: { gym: "ที่ยิม", home: "ที่บ้าน ไม่มีอุปกรณ์" },
    day: "วันที่",
    sets: "เซต",
    reps: "ครั้ง",
    seconds: "วินาที",
    rest: "พักระหว่างเซต",
    howTitle: "วิธีใช้ตารางนี้",
    warm: "อบอุ่นร่างกาย 5 ถึง 10 นาทีก่อนเริ่ม เช่น เดินเร็ว ปั่นจักรยานเบาๆ หรือทำท่าแรกด้วยน้ำหนักเบา",
    load: "เลือกน้ำหนักที่ทำครบจำนวนครั้งได้โดยยังคุมท่าได้ ถ้าทำครบทุกเซตได้สบาย ครั้งถัดไปให้เพิ่มน้ำหนักเล็กน้อย",
    loadHome: "ถ้าทำครบทุกเซตได้สบาย ให้ทำช้าลง เพิ่มจำนวนครั้ง หรือเปลี่ยนเป็นท่าที่ยากขึ้น",
    cardio: {
      fat: "เพิ่มคาร์ดิโอ 20 ถึง 30 นาทีหลังเวท หรือในวันพัก 2 ถึง 3 ครั้งต่อสัปดาห์ เดินเร็วหรือปั่นจักรยานในระดับที่ยังพูดเป็นประโยคได้",
      muscle: "คาร์ดิโอเบาๆ 15 ถึง 20 นาที 1 ถึง 2 ครั้งต่อสัปดาห์ก็พอ และกินโปรตีนให้ถึงทุกวัน",
      general: "เพิ่มคาร์ดิโอ 20 นาที 2 ครั้งต่อสัปดาห์ เลือกแบบที่ชอบ เช่น เดินเร็ว ปั่นจักรยาน หรือกรรเชียงบก",
    },
    restDay: "พักอย่างน้อย 1 วันระหว่างการฝึกกล้ามเนื้อกลุ่มเดียวกัน และหยุดทันทีถ้าเจ็บแปลบหรือเวียนหัว",
    stretch: "จบด้วยการยืดเหยียด 5 นาที",
  },
  en: {
    goal: "Goal",
    goals: { fat: "Lose fat", muscle: "Build muscle", general: "General strength" },
    days: "Training days per week",
    daysUnit: "days",
    level: "Experience",
    levels: { beginner: "Just starting", intermediate: "Training for 6 months or more" },
    place: "Where you train",
    places: { gym: "At the gym", home: "At home, no equipment" },
    day: "Day",
    sets: "sets",
    reps: "reps",
    seconds: "seconds",
    rest: "Rest between sets",
    howTitle: "How to use this plan",
    warm: "Warm up for 5 to 10 minutes first: brisk walking, easy cycling, or the first exercise with a light weight.",
    load: "Pick a weight you can lift for all the reps with good form. When every set feels comfortable, add a little weight next time.",
    loadHome: "When every set feels comfortable, slow the movement down, add reps, or move to a harder variation.",
    cardio: {
      fat: "Add 20 to 30 minutes of cardio after weights or on rest days, 2 to 3 times a week. Walk briskly or cycle at a pace where you can still speak in sentences.",
      muscle: "Light cardio for 15 to 20 minutes once or twice a week is enough. Hit your protein target every day.",
      general: "Add 20 minutes of cardio twice a week. Pick what you enjoy: brisk walking, cycling or rowing.",
    },
    restDay: "Leave at least one day between sessions for the same muscle group. Stop straight away if you feel sharp pain or dizziness.",
    stretch: "Finish with 5 minutes of stretching.",
  },
};

function prescription(goal: Goal, level: Level) {
  const extra = level === "intermediate" ? 1 : 0;
  if (goal === "fat") return { sets: 2 + extra, reps: "12–15", hold: "30–40", rest: "45–60" };
  if (goal === "muscle") return { sets: 3 + extra, reps: "8–12", hold: "40–60", rest: "60–90" };
  return { sets: 2 + extra, reps: "8–10", hold: "30–45", rest: "90" };
}

export function WorkoutPlanner({ locale }: { locale: Locale }) {
  const c = copy[locale];
  const [goal, setGoal] = useState<Goal>("general");
  const [days, setDays] = useState(3);
  const [level, setLevel] = useState<Level>("beginner");
  const [place, setPlace] = useState<Place>("gym");

  const split = SPLITS[days];
  const rx = prescription(goal, level);

  return (
    <div className="grid gap-3.5 lg:grid-cols-[360px_1fr]">
      <Panel className="space-y-5 lg:self-start">
        <Choice
          label={c.goal}
          value={goal}
          onChange={setGoal}
          options={(["fat", "muscle", "general"] as const).map((value) => ({ value, label: c.goals[value] }))}
        />
        <Choice
          label={c.days}
          value={days}
          onChange={setDays}
          options={[2, 3, 4, 5].map((value) => ({ value, label: `${value} ${c.daysUnit}` }))}
        />
        <Choice
          label={c.level}
          value={level}
          onChange={setLevel}
          options={(["beginner", "intermediate"] as const).map((value) => ({ value, label: c.levels[value] }))}
        />
        <Choice
          label={c.place}
          value={place}
          onChange={setPlace}
          options={(["gym", "home"] as const).map((value) => ({ value, label: c.places[value] }))}
        />
      </Panel>

      <div aria-live="polite" className="space-y-3.5">
        <div className="grid gap-3.5 md:grid-cols-2">
          {split.sessions.map((id, i) => {
            const session = SESSIONS[place][id];
            return (
              <Panel key={i}>
                <p className="text-sm font-medium text-volt">
                  {c.day} {i + 1} · {WEEKDAYS[locale][split.days[i]]}
                </p>
                <h2 className="mt-0.5 text-xl font-semibold text-text-hi">{session.name[locale]}</h2>
                <ul className="mt-3 divide-y divide-white/10">
                  {session.moves.map((move) => (
                    <li key={move} className="flex items-baseline justify-between gap-4 py-2">
                      <span className="text-text-hi">{X[move][locale]}</span>
                      <span className="shrink-0 text-sm tabular-nums text-text-lo">
                        {rx.sets} {c.sets} × {X[move].hold ? `${rx.hold} ${c.seconds}` : `${rx.reps} ${c.reps}`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-text-lo">
                  {c.rest} {rx.rest} {c.seconds}
                </p>
              </Panel>
            );
          })}
        </div>

        <Panel>
          <h2 className="text-lg font-semibold text-text-hi">{c.howTitle}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 font-light leading-relaxed text-text-lo marker:text-volt">
            <li>{c.warm}</li>
            <li>{place === "gym" ? c.load : c.loadHome}</li>
            <li>{c.cardio[goal]}</li>
            <li>{c.restDay}</li>
            <li>{c.stretch}</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
