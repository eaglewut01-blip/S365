import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { daysAgo, formatBaht, todayDateLabelTh } from "@/lib/format";
import type { Member } from "@/types/database";

export default async function OverviewPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id;

  const todayDow = new Date().getDay();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [{ data: members }, { data: classes }, { count: checkinsToday }] = await Promise.all([
    supabase.from("members").select("*").eq("branch_id", branchId ?? ""),
    supabase
      .from("classes")
      .select("*, trainer:profiles(full_name), bookings:class_bookings(status)")
      .eq("branch_id", branchId ?? "")
      .eq("day_of_week", todayDow),
    supabase
      .from("checkins")
      .select("id", { count: "exact", head: true })
      .eq("branch_id", branchId ?? "")
      .gte("checked_in_at", startOfDay.toISOString()),
  ]);

  const list = (members ?? []) as Member[];
  const active = list.filter((m) => m.status === "active");
  const overdue = list.filter((m) => m.billing_status === "overdue");
  const mrr = active.reduce((sum, m) => sum + Number(m.amount), 0);
  const atRisk = active.filter((m) => daysAgo(m.last_visit) >= 14).slice(0, 6);

  return (
    <div className="p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">ภาพรวมวันนี้</h1>
      <p className="mt-1.5 font-body text-[13.5px] text-text-lo">{todayDateLabelTh()}</p>

      <div className="mt-[22px] flex flex-wrap gap-3.5">
        <StatTile label="สมาชิกที่ใช้งานอยู่" value={active.length} sub={`จากทั้งหมด ${list.length} คน`} />
        <StatTile label="เช็คอินวันนี้" value={checkinsToday ?? 0} sub="อัปเดตแบบเรียลไทม์" tone="mint" />
        <StatTile label="คลาสวันนี้" value={classes?.length ?? 0} sub="ดูตารางเต็ม →" />
        <StatTile label="ค้างชำระ" value={overdue.length} sub="ต้องติดตาม" tone="coral" />
        <StatTile label="รายได้ประจำ (MRR)" value={formatBaht(mrr)} sub="จากสมาชิก active" tone="mint" />
      </div>

      <div className="mt-6 flex gap-4">
        <div className="flex-[1.4] rounded-xl border border-border bg-panel p-[18px]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="m-0 font-heading text-[15px] text-text-hi">คลาสวันนี้</h3>
            <Link
              href="/owner/schedule"
              className="flex items-center gap-1 font-body text-[12.5px] text-text-lo hover:text-text-hi"
            >
              ดูทั้งหมด <ChevronRight size={13} />
            </Link>
          </div>
          {(classes ?? []).map((cl) => {
            const booked = (cl.bookings ?? []).filter((b: { status: string }) => b.status === "booked").length;
            return (
              <div key={cl.id} className="flex items-center justify-between border-t border-border py-2.5">
                <div>
                  <div className="font-body text-[13.5px] font-medium text-text-hi">{cl.name}</div>
                  <div className="mt-0.5 text-xs text-text-faint">
                    {cl.trainer?.full_name ?? "-"} · {cl.start_time?.slice(0, 5)} น.
                  </div>
                </div>
                <Badge tone={booked >= cl.capacity ? "overdue" : "neutral"}>
                  {booked}/{cl.capacity} คน
                </Badge>
              </div>
            );
          })}
          {(classes ?? []).length === 0 && (
            <div className="py-2 text-[13px] text-text-faint">ไม่มีคลาสวันนี้</div>
          )}
        </div>

        <div className="flex-1 rounded-xl border border-border bg-panel p-[18px]">
          <h3 className="m-0 mb-3 font-heading text-[15px] text-text-hi">สมาชิกเสี่ยงหาย</h3>
          {atRisk.length === 0 && (
            <div className="text-[13px] text-text-faint">ไม่มีสมาชิกที่ห่างหายในตอนนี้</div>
          )}
          {atRisk.map((m) => (
            <div key={m.id} className="border-t border-border py-2.5">
              <div className="text-[13.5px] font-medium text-text-hi">{m.name}</div>
              <div className="mt-0.5 text-xs text-coral">ไม่มาแล้ว {daysAgo(m.last_visit)} วัน</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
