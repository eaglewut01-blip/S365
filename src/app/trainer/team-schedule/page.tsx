import Link from "next/link";
import { DayNav, dateParam } from "@/components/DayNav";
import { TeamDayGrid, type GridSlot } from "@/components/TeamDayGrid";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { todayBangkok } from "@/lib/dates";
import { hourLabel } from "@/lib/labels";
import type { TrainerSlot } from "@/types/database";

export const metadata = { title: "ตารางทั้งทีม | S365 Fitness" };

// The whole team's day, read-only, so a trainer can see which hours are open.
// Other trainers' client names are left out; only their own are shown.
export default async function TeamSchedulePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const me = await requireRole("trainer");
  const date = dateParam((await searchParams).d);
  const supabase = await createClient();

  const [trainers, everyone, mine] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("branch_id", me.branch_id ?? "").eq("role", "trainer").order("full_name"),
    supabase.rpc("team_schedule", { p_date: date }),
    supabase.from("trainer_slots").select("*").eq("trainer_id", me.id).eq("work_date", date),
  ]);

  // Me first, then the rest by name.
  const others = ((trainers.data ?? []) as { id: string; full_name: string }[]).filter((t) => t.id !== me.id);
  const team = [{ id: me.id, full_name: me.full_name }, ...others];
  const ownSlots = (mine.data ?? []) as TrainerSlot[];
  const slots: GridSlot[] = [...ownSlots, ...((everyone.data ?? []) as GridSlot[]).filter((s) => s.trainer_id !== me.id)];

  const isToday = date === todayBangkok();
  const hourNow = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", hour12: false }).format(new Date()));
  const freeNow = isToday ? others.filter((t) => slots.some((s) => s.trainer_id === t.id && s.hour === hourNow && s.kind === "free")) : [];

  return (
    <div className="p-4 sm:p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">ตารางทั้งทีม</h1>
      <p className="mt-1.5 mb-4 font-body text-[13.5px] text-text-lo">ดูว่าแต่ละชั่วโมงเทรนเนอร์คนไหนเทรนอยู่ คนไหนว่าง ดูได้อย่างเดียว ลงตารางของตัวเองที่เมนู ลงตารางของฉัน</p>
      <DayNav basePath="/trainer/team-schedule" date={date} />

      {everyone.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">ยังดูตารางของคนอื่นไม่ได้ แจ้งเจ้าของให้รันคำสั่งฐานข้อมูลรอบล่าสุดใน Supabase ก่อน</div>
      ) : (
        <>
          {isToday && (
            <div className="mb-4 rounded-xl border border-border bg-panel px-4 py-3">
              <div className="text-[12.5px] text-text-lo">คนอื่นที่ว่างตอนนี้ ({hourLabel(hourNow)})</div>
              <div className="mt-1 text-[14px] font-medium text-mint">{freeNow.length ? freeNow.map((t) => t.full_name).join(", ") : <span className="text-text-faint">ไม่มีคนที่ลงว่าว่าง</span>}</div>
            </div>
          )}
          <TeamDayGrid team={team} slots={slots} date={date} hourNow={isToday ? hourNow : null} highlightId={me.id} />
          <Link href={`/trainer/schedule?d=${date}`} className="mt-4 inline-block text-[13.5px] text-volt">
            ไปลงตารางของฉัน
          </Link>
        </>
      )}
    </div>
  );
}
