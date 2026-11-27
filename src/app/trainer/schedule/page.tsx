import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DayNav, dateParam } from "@/components/DayNav";
import type { TrainerSlot } from "@/types/database";
import { DayForm } from "./DayForm";

export const metadata = { title: "ลงตารางวันนี้ | S365 Fitness" };

export default async function TrainerSchedulePage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const trainer = await requireRole("trainer");
  const date = dateParam((await searchParams).d);
  const supabase = await createClient();

  const { data, error } = await supabase.from("trainer_slots").select("*").eq("trainer_id", trainer.id).eq("work_date", date);

  return (
    <div className="max-w-2xl p-4 sm:p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">ลงตารางของฉัน</h1>
      <p className="mt-1.5 mb-4 font-body text-[13.5px] text-text-lo">
        ลงทุกเช้าว่าแต่ละชั่วโมงเทรนใคร เทสต์ลูกค้า หรือว่าง ผู้จัดการจะเห็นว่าใครว่างช่วงไหน
      </p>
      <DayNav basePath="/trainer/schedule" date={date} />
      {error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ แจ้งเจ้าของให้รันไฟล์ <code>supabase/memberships.sql</code> ใน Supabase ก่อน
        </div>
      ) : (
        <DayForm key={date} date={date} slots={(data ?? []) as TrainerSlot[]} />
      )}
    </div>
  );
}
