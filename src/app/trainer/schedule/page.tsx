import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DayNav, dateParam } from "@/components/DayNav";
import { DayBoard, type BoardClient } from "@/components/DayBoard";
import type { TrainerSlot } from "@/types/database";

export const metadata = { title: "ลงตารางของฉัน | S365 Fitness" };

export default async function TrainerSchedulePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const trainer = await requireRole("trainer");
  const date = dateParam((await searchParams).d);
  const supabase = await createClient();

  const [slots, clients] = await Promise.all([
    supabase.from("trainer_slots").select("*").eq("trainer_id", trainer.id).eq("work_date", date),
    supabase.from("members").select("id, name, pt_remaining").eq("pt_trainer_id", trainer.id).gt("pt_remaining", 0).neq("status", "cancelled").order("name"),
  ]);

  return (
    <div className="max-w-2xl p-4 sm:p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">ลงตารางของฉัน</h1>
      <p className="mt-1.5 mb-4 font-body text-[13.5px] text-text-lo">ลงทุกเช้าว่าแต่ละชั่วโมงเทรนใคร เทสต์ลูกค้า หรือว่าง ผู้จัดการจะเห็นว่าใครว่างช่วงไหน</p>
      <DayNav basePath="/trainer/schedule" date={date} />
      <Link href={`/trainer/team-schedule?d=${date}`} className="mb-4 inline-block text-[13.5px] text-volt">
        ดูตารางของเทรนเนอร์ทุกคนในวันนี้
      </Link>
      {slots.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ แจ้งเจ้าของให้รันไฟล์ <code>supabase/memberships.sql</code> ใน Supabase ก่อน
        </div>
      ) : (
        <DayBoard
          key={date}
          date={date}
          slots={(slots.data ?? []) as TrainerSlot[]}
          clients={(clients.data ?? []).map((c) => ({ id: c.id, name: c.name, hoursLeft: c.pt_remaining })) as BoardClient[]}
        />
      )}
    </div>
  );
}
