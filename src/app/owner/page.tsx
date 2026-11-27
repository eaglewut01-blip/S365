import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { daysAgo, todayDateLabelTh } from "@/lib/format";
import { expiryLabel, expiryState, startOfTodayBangkok, todayBangkok } from "@/lib/dates";
import { PT_LOW_HOURS, WORK_HOURS } from "@/lib/labels";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { Member } from "@/types/database";

export default async function OverviewPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id;

  const startOfDay = startOfTodayBangkok();
  const todayDow = new Date(`${todayBangkok()}T12:00:00Z`).getUTCDay();

  const [{ data: members }, { data: classes }, { count: checkinsToday }, { data: trainers }, { data: slotsToday }] = await Promise.all([
    fetchAll<Member>((from, to) => supabase.from("members").select("*").eq("branch_id", branchId ?? "").order("id").range(from, to)),
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
    supabase.from("profiles").select("id, full_name").eq("branch_id", branchId ?? "").eq("role", "trainer").order("full_name"),
    supabase.from("trainer_slots").select("trainer_id, kind").eq("branch_id", branchId ?? "").eq("work_date", todayBangkok()),
  ]);

  const list = (members ?? []) as Member[];
  const active = list.filter((m) => m.status === "active");
  const current = list.filter((m) => m.status !== "cancelled");
  const expiringSoon = current
    .filter((m) => expiryState(m.membership_expires_on).state === "soon")
    .sort((a, b) => (a.membership_expires_on ?? "").localeCompare(b.membership_expires_on ?? ""));
  const ptLow = current.filter((m) => m.pt_total > 0 && m.pt_remaining > 0 && m.pt_remaining <= PT_LOW_HOURS);
  const trainerNames = new Map((trainers ?? []).map((t) => [t.id, t.full_name]));
  const ptUnassigned = current.filter((m) => m.pt_remaining > 0 && !(m.pt_trainer_id && trainerNames.has(m.pt_trainer_id)));
  const filledToday = new Set((slotsToday ?? []).map((s) => s.trainer_id));
  const notFilled = (trainers ?? []).filter((t) => !filledToday.has(t.id));
  const freeHours = new Map<string, number>();
  (slotsToday ?? []).forEach((s) => {
    if (s.kind === "free") freeHours.set(s.trainer_id, (freeHours.get(s.trainer_id) ?? 0) + 1);
  });
  const filledHours = new Map<string, number>();
  (slotsToday ?? []).forEach((s) => filledHours.set(s.trainer_id, (filledHours.get(s.trainer_id) ?? 0) + 1));
  // Full means every hour of the day is filled in and none of them is free.
  const fullToday = (trainers ?? []).filter((t) => (filledHours.get(t.id) ?? 0) >= WORK_HOURS.length && !freeHours.get(t.id));
  // PT clients about to run out, counted per trainer, for the alerts box.
  const lowByTrainer = new Map<string, number>();
  ptLow.forEach((m) => {
    const name = (m.pt_trainer_id && trainerNames.get(m.pt_trainer_id)) || "ยังไม่ระบุเทรนเนอร์";
    lowByTrainer.set(name, (lowByTrainer.get(name) ?? 0) + 1);
  });
  const alerts: { text: string; href: string }[] = [
    ...(expiringSoon.length ? [{ text: `สมาชิก ${expiringSoon.length} คนจะหมดอายุใน 7 วัน`, href: "/owner/members" }] : []),
    ...[...lowByTrainer].map(([name, n]) => ({ text: `ลูกค้า PT ของ ${name} ใกล้หมด ${n} คน`, href: "/owner/trainer-clients" })),
    ...(ptUnassigned.length ? [{ text: `ลูกค้า PT ${ptUnassigned.length} คนยังไม่ได้ระบุเทรนเนอร์`, href: "/owner/trainer-clients" }] : []),
    ...(notFilled.length ? [{ text: `ยังไม่ลงตารางวันนี้: ${notFilled.map((t) => t.full_name).join(", ")}`, href: "/owner/trainer-schedule" }] : []),
    ...(fullToday.length ? [{ text: `ตารางวันนี้เต็มแล้ว: ${fullToday.map((t) => t.full_name).join(", ")}`, href: "/owner/trainer-schedule" }] : []),
  ];
  const atRisk = active.filter((m) => daysAgo(m.last_visit) >= 14).slice(0, 6);

  return (
    <div className="p-4 sm:p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">ภาพรวมวันนี้</h1>
      <p className="mt-1.5 font-body text-[13.5px] text-text-lo">{todayDateLabelTh()}</p>

      <div className="mt-[22px] flex flex-wrap gap-3.5">
        <StatTile label="สมาชิกที่ใช้งานอยู่" value={active.length} sub={`จากทั้งหมด ${list.length} คน`} />
        <StatTile label="เช็คอินวันนี้" value={checkinsToday ?? 0} sub="อัปเดตแบบเรียลไทม์" tone="mint" />
        <StatTile label="คลาสวันนี้" value={classes?.length ?? 0} sub="ดูตารางเต็ม →" />
        <StatTile label="ใกล้หมดอายุใน 7 วัน" value={expiringSoon.length} sub="ควรทักชวนต่ออายุ" tone="amber" />
        <StatTile label="PT ใกล้หมด" value={ptLow.length} sub={`เหลือไม่เกิน ${PT_LOW_HOURS} ชั่วโมง`} tone="amber" />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-panel p-[18px]">
        <h3 className="m-0 mb-2 font-heading text-[15px] text-text-hi">แจ้งเตือน สิ่งที่ต้องตามวันนี้</h3>
        {alerts.length === 0 && <div className="text-[13px] text-text-faint">ไม่มีเรื่องที่ต้องตามในตอนนี้</div>}
        <div>
          {alerts.map((alert) => (
            <Link
              key={alert.text}
              href={alert.href}
              className="flex items-center justify-between gap-3 border-t border-border py-2.5 text-[13.5px] text-text-hi no-underline first:border-t-0 hover:text-volt"
            >
              <span>{alert.text}</span>
              <ChevronRight size={14} className="flex-shrink-0 text-text-faint" />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 lg:flex-row">
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
          <div className="mb-3 flex items-center justify-between">
            <h3 className="m-0 font-heading text-[15px] text-text-hi">ใกล้หมดอายุ</h3>
            <Link href="/owner/members" className="flex items-center gap-1 font-body text-[12.5px] text-text-lo hover:text-text-hi">
              ดูทั้งหมด <ChevronRight size={13} />
            </Link>
          </div>
          {expiringSoon.length === 0 && <div className="text-[13px] text-text-faint">ไม่มีสมาชิกที่จะหมดอายุใน 7 วันนี้</div>}
          {expiringSoon.slice(0, 8).map((m) => (
            <Link key={m.id} href={`/owner/members/${m.id}`} className="block border-t border-border py-2.5 no-underline">
              <div className="text-[13.5px] font-medium text-text-hi">{m.name}</div>
              <div className="mt-0.5 text-xs text-amber">
                {expiryLabel(m.membership_expires_on)} · {m.phone ?? "ไม่มีเบอร์โทร"}
              </div>
            </Link>
          ))}
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
