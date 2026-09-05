import { Clock } from "lucide-react";
import { requireRole } from "@/lib/session";
import { getCurrentMember } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { dayLabelTh, formatBaht, todayDateLabelTh } from "@/lib/format";

export default async function MemberHomePage() {
  const profile = await requireRole("member");
  const member = await getCurrentMember(profile.id);

  if (!member) {
    return (
      <div className="p-7">
        <div className="rounded-xl border border-border bg-panel p-6 text-[13.5px] text-text-faint">
          บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลสมาชิก — กรุณาติดต่อพนักงานหน้าเคาน์เตอร์
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: bookingsRaw } = await supabase
    .from("class_bookings")
    .select("status, class:classes(id, name, day_of_week, start_time)")
    .eq("member_id", member.id)
    .eq("status", "booked");

  const bookings = (bookingsRaw ?? []) as unknown as {
    status: string;
    class: { id: string; name: string; day_of_week: number; start_time: string } | null;
  }[];

  return (
    <div className="p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">สวัสดี, {member.name}</h1>
      <p className="mt-1.5 mb-6 font-body text-[13.5px] text-text-lo">{todayDateLabelTh()}</p>

      <div className="mb-6 flex flex-wrap gap-3.5">
        <StatTile label="แพ็กเกจ" value={member.plan} />
        <StatTile label="เข้าใช้ทั้งหมด" value={member.visit_count} sub={member.last_visit ? `ล่าสุด ${member.last_visit}` : undefined} />
        {member.pt_total > 0 && (
          <StatTile label="ชั่วโมง PT คงเหลือ" value={`${member.pt_remaining}/${member.pt_total}`} tone={member.pt_remaining <= 2 ? "amber" : "mint"} />
        )}
        <StatTile
          label="ค่าบริการงวดถัดไป"
          value={formatBaht(Number(member.amount))}
          sub={member.next_bill_date ?? undefined}
          tone={member.billing_status === "overdue" ? "coral" : member.billing_status === "due" ? "amber" : "mint"}
        />
      </div>

      <div className="rounded-xl border border-border bg-panel p-[18px]">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 font-heading text-[15px] text-text-hi">คลาสที่จองไว้</h3>
          <Badge tone={member.status}>{member.status === "active" ? "สมาชิกใช้งานอยู่" : member.status === "frozen" ? "พักการใช้งาน" : "ยกเลิกแล้ว"}</Badge>
        </div>
        {bookings.map((b, i) => (
          <div key={i} className="flex items-center gap-2 border-t border-border py-2.5 text-[13.5px] text-text-hi">
            <Clock size={13} className="text-text-faint" />
            {b.class?.name} · {dayLabelTh(b.class?.day_of_week ?? 0)} {b.class?.start_time?.slice(0, 5)} น.
          </div>
        ))}
        {(bookings ?? []).length === 0 && (
          <div className="text-[13px] text-text-faint">ยังไม่มีคลาสที่จองไว้ — ไปที่หน้า &quot;จองคลาส&quot;</div>
        )}
      </div>
    </div>
  );
}
