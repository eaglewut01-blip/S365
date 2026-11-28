import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DayNav, dateParam } from "@/components/DayNav";
import { PageHeader } from "@/components/ui/Card";
import { todayBangkok } from "@/lib/dates";
import { TeamDayGrid } from "@/components/TeamDayGrid";
import { hourLabel } from "@/lib/labels";
import type { TrainerSlot } from "@/types/database";

export const metadata = { title: "ตารางเทรนเนอร์ | S365 Fitness" };

// One day for the whole team: who is training, who is free, hour by hour.
export default async function TrainerSchedulePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const profile = await requireRole("owner", "staff");
  const date = dateParam((await searchParams).d);
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const [trainers, slots] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("branch_id", branchId).eq("role", "trainer").order("full_name"),
    supabase.from("trainer_slots").select("*").eq("branch_id", branchId).eq("work_date", date),
  ]);

  const team = trainers.data ?? [];
  const bySlot = new Map(((slots.data ?? []) as TrainerSlot[]).map((s) => [`${s.trainer_id}:${s.hour}`, s]));
  const filled = new Set(((slots.data ?? []) as TrainerSlot[]).map((s) => s.trainer_id));
  const notFilled = team.filter((t) => !filled.has(t.id));

  const isToday = date === todayBangkok();
  const hourNow = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bangkok", hour: "2-digit", hour12: false }).format(new Date()));
  const freeNow = isToday ? team.filter((t) => bySlot.get(`${t.id}:${hourNow}`)?.kind === "free") : [];

  return (
    <div className="p-4 sm:p-7">
      <PageHeader title="ตารางเทรนเนอร์" subtitle="เทรนเนอร์ล็อกอินด้วยบัญชีของตัวเองแล้วลงตารางที่เมนู ลงตารางของฉัน หน้านี้รวมทั้งทีมไว้ในวันเดียว ผู้จัดการกด ลงหรือแก้ให้ ใต้ชื่อเทรนเนอร์ได้" />
      <DayNav basePath="/owner/trainer-schedule" date={date} />

      {slots.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : team.length === 0 ? (
        <div className="rounded-xl border border-border bg-panel p-[18px] text-[13.5px] text-text-lo">
          ยังไม่มีบัญชีเทรนเนอร์ เจ้าของเชิญเทรนเนอร์ได้ที่เมนู ทีมงาน
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {isToday && (
              <div className="rounded-xl border border-border bg-panel px-4 py-3">
                <div className="text-[12.5px] text-text-lo">ว่างตอนนี้ ({hourLabel(hourNow)})</div>
                <div className="mt-1 text-[14px] font-medium text-mint">
                  {freeNow.length ? freeNow.map((t) => t.full_name).join(", ") : <span className="text-text-faint">ไม่มีคนที่ลงว่าว่าง</span>}
                </div>
              </div>
            )}
            <div className="rounded-xl border border-border bg-panel px-4 py-3">
              <div className="text-[12.5px] text-text-lo">{isToday ? "ยังไม่ลงตารางวันนี้" : "ยังไม่ลงตารางของวันที่เลือก"}</div>
              <div className="mt-1 text-[14px] font-medium text-amber">
                {notFilled.length ? notFilled.map((t) => t.full_name).join(", ") : <span className="text-mint">ลงครบทุกคนแล้ว</span>}
              </div>
            </div>
          </div>

          <TeamDayGrid team={team} slots={(slots.data ?? []) as TrainerSlot[]} date={date} hourNow={isToday ? hourNow : null} editBase="/owner/trainer-schedule" />
        </>
      )}
    </div>
  );
}
