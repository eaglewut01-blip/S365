import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DayNav, dateParam } from "@/components/DayNav";
import { PageHeader } from "@/components/ui/Card";
import { todayBangkok } from "@/lib/dates";
import { SLOT_LABEL, WORK_HOURS, hourLabel } from "@/lib/labels";
import type { SlotKind, TrainerSlot } from "@/types/database";

export const metadata = { title: "ตารางเทรนเนอร์ | S365 Fitness" };

const CELL: Record<SlotKind, string> = {
  pt: "bg-volt/25 text-text-hi",
  trial: "bg-amber-bg text-amber",
  free: "bg-mint-bg text-mint",
  off: "bg-white/[0.04] text-text-faint",
};

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
      <PageHeader title="ตารางเทรนเนอร์" subtitle="เทรนเนอร์ลงตารางของตัวเองทุกเช้า หน้านี้รวมทั้งทีมไว้ในวันเดียว" />
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

          <div className="mb-3 flex flex-wrap gap-3 text-xs text-text-lo">
            {(Object.keys(SLOT_LABEL) as SlotKind[]).map((kind) => (
              <span key={kind} className="inline-flex items-center gap-1.5">
                <span className={`inline-block h-3 w-3 rounded-sm ${CELL[kind]}`} /> {SLOT_LABEL[kind]}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-sm border border-border" /> ยังไม่ลง
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] border-collapse bg-panel text-left">
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[64px] bg-panel px-3 py-2.5 text-xs font-normal text-text-faint">
                    เวลา
                  </th>
                  {team.map((t) => (
                    <th key={t.id} scope="col" className="min-w-[110px] border-l border-border px-2.5 py-2.5 font-body text-[13px] font-semibold text-text-hi">
                      {t.full_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WORK_HOURS.map((hour) => (
                  <tr key={hour} className={isToday && hour === hourNow ? "outline outline-1 -outline-offset-1 outline-volt" : ""}>
                    <th scope="row" className="sticky left-0 z-10 border-t border-border bg-panel px-3 py-2 font-body text-[13px] font-semibold text-text-hi">
                      {hourLabel(hour)}
                    </th>
                    {team.map((t) => {
                      const slot = bySlot.get(`${t.id}:${hour}`);
                      return (
                        <td key={t.id} className="border-t border-l border-border p-1 align-top">
                          {slot ? (
                            <div className={`rounded-md px-2 py-1.5 text-[12.5px] leading-tight ${CELL[slot.kind]}`}>
                              <div className="font-semibold">{SLOT_LABEL[slot.kind]}</div>
                              {slot.client_name && <div className="mt-0.5 opacity-90">{slot.client_name}</div>}
                            </div>
                          ) : (
                            <div className="px-2 py-1.5 text-[12.5px] text-text-faint">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
