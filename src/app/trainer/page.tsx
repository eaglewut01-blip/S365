import { Clock, Users } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/Badge";
import { dayLabelTh, todayDateLabelTh } from "@/lib/format";

export default async function TrainerHomePage() {
  const trainer = await requireRole("trainer");
  const supabase = await createClient();

  const { data: classes } = await supabase
    .from("classes")
    .select("*, class_bookings(status, member:members(name))")
    .eq("trainer_id", trainer.id)
    .order("day_of_week")
    .order("start_time");

  const todayDow = new Date().getDay();

  return (
    <div className="p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">ตารางของฉัน</h1>
      <p className="mt-1.5 mb-6 font-body text-[13.5px] text-text-lo">{todayDateLabelTh()}</p>

      <div className="grid grid-cols-2 gap-4">
        {(classes ?? []).map((cl) => {
          const booked = (cl.class_bookings ?? []).filter((b: { status: string }) => b.status === "booked");
          const isToday = cl.day_of_week === todayDow;
          return (
            <div key={cl.id} className="rounded-xl border border-border bg-panel p-[18px]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-heading text-[15.5px] font-bold text-text-hi">{cl.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-faint">
                    <Clock size={12} /> {dayLabelTh(cl.day_of_week)} · {cl.start_time?.slice(0, 5)} น.
                  </div>
                </div>
                {isToday && <Badge tone="active">วันนี้</Badge>}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-text-faint">
                <Users size={12} /> {booked.length}/{cl.capacity} คน
              </div>
              <div className="mt-2.5 border-t border-border pt-2.5">
                {booked.map((b: { member: { name: string } }, i: number) => (
                  <div key={i} className="py-1 text-[13px] text-text-hi">
                    {b.member?.name}
                  </div>
                ))}
                {booked.length === 0 && <div className="text-[13px] text-text-faint">ยังไม่มีคนจอง</div>}
              </div>
            </div>
          );
        })}
        {(classes ?? []).length === 0 && (
          <div className="col-span-2 rounded-xl border border-border bg-panel p-6 text-center text-[13.5px] text-text-faint">
            ยังไม่มีคลาสที่มอบหมายให้คุณ
          </div>
        )}
      </div>
    </div>
  );
}
