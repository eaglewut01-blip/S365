import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { byId } from "@/lib/supabase/lookup";
import { addDays, addMonths, daysBetween, formatDateTh, mondayOf, todayBangkok } from "@/lib/dates";
import type { PtSession } from "@/types/database";
import { PtSessionsClient, type PtSessionRow } from "./PtSessionsClient";

export const metadata = { title: "เซสชัน PT | S365 Fitness" };

// One month of PT sessions: each one signed by the client on the trainer's
// phone, with the hour already taken off.
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export default async function OwnerPtSessionsPage({ searchParams }: { searchParams: Promise<{ m?: string; from?: string; to?: string }> }) {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();

  const query = await searchParams;
  const today = todayBangkok();
  const currentMonth = today.slice(0, 7);
  const month = query.m && /^\d{4}-(0[1-9]|1[0-2])$/.test(query.m) ? query.m : currentMonth;
  // A range of days (today, this week, any two dates) takes over from the month.
  const ranged = Boolean(query.from && query.to && DATE.test(query.from) && DATE.test(query.to) && query.from <= query.to && daysBetween(query.from, query.to) <= 366);
  const start = ranged ? query.from! : `${month}-01`;
  const end = ranged ? query.to! : addDays(addMonths(start, 1), -1);
  const span = daysBetween(start, end) + 1;
  const weekStart = mondayOf(today);
  const isToday = ranged && start === today && end === today;
  const isThisWeek = ranged && start === weekStart && end === addDays(weekStart, 6);
  const period = isToday ? "วันนี้" : isThisWeek ? "สัปดาห์นี้" : ranged ? "ช่วงที่เลือก" : month === currentMonth ? "เดือนนี้" : "เดือนที่เลือก";

  const { data, error } = await supabase
    .from("pt_sessions")
    .select("*")
    .eq("branch_id", profile.branch_id ?? "")
    .gte("session_date", start)
    .lte("session_date", end)
    .order("logged_at", { ascending: false })
    .limit(1000);

  // Names are looked up separately rather than embedded; see lib/supabase/lookup.ts.
  const rows = (data ?? []) as PtSession[];
  const [members, trainers] = await Promise.all([
    byId<{ id: string; name: string; pt_total: number; pt_remaining: number }>(supabase, "members", "id, name, pt_total, pt_remaining", rows.map((s) => s.member_id)),
    byId<{ id: string; full_name: string }>(supabase, "profiles", "id, full_name", rows.map((s) => s.trainer_id)),
  ]);
  const sessions: PtSessionRow[] = rows.map((s) => ({
    id: s.id,
    date: s.session_date,
    time: s.session_time.slice(0, 5),
    status: s.status,
    signature: s.signature ?? null,
    member: members.get(s.member_id) ?? { name: "", pt_total: 0, pt_remaining: 0 },
    trainerName: trainers.get(s.trainer_id)?.full_name ?? "",
  }));

  const monthLabel = new Date(`${start}T12:00:00Z`).toLocaleDateString("th-TH", { timeZone: "UTC", month: "long", year: "numeric" });
  const label = !ranged ? monthLabel : span === 1 ? formatDateTh(start) : `${formatDateTh(start)} ถึง ${formatDateTh(end)}`;
  const navLink = "inline-flex h-9 items-center justify-center rounded-lg border border-border px-2.5 text-text-lo no-underline hover:text-text-hi";
  const chip = (on: boolean) => `inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] no-underline ${on ? "border-volt bg-volt/10 font-semibold text-volt" : "border-border text-text-lo hover:text-text-hi"}`;
  const range = (from: string, to: string) => `/owner/pt-sessions?from=${from}&to=${to}`;
  // The arrows step by the length of what is shown: a day, a week, a month.
  const previous = ranged ? range(addDays(start, -span), addDays(end, -span)) : `/owner/pt-sessions?m=${addMonths(start, -1).slice(0, 7)}`;
  const following = ranged ? range(addDays(start, span), addDays(end, span)) : `/owner/pt-sessions?m=${addMonths(start, 1).slice(0, 7)}`;

  return (
    <div className="p-4 sm:p-7">
      <PageHeader title="เซสชัน PT" subtitle="เทรนเสร็จ ลูกค้าเซ็นบนมือถือของเทรนเนอร์ ระบบตัดชั่วโมงทันที ดูได้ที่นี่ว่าใครเทรนใคร เมื่อไร พร้อมลายเซ็น เลือกดูเป็นวัน สัปดาห์ เดือน หรือช่วงวันที่ได้" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link href={range(today, today)} className={chip(isToday)}>
          วันนี้
        </Link>
        <Link href={range(weekStart, addDays(weekStart, 6))} className={chip(isThisWeek)}>
          สัปดาห์นี้
        </Link>
        <Link href="/owner/pt-sessions" className={chip(!ranged && month === currentMonth)}>
          เดือนนี้
        </Link>
        <form action="/owner/pt-sessions" method="get" className="flex flex-wrap items-center gap-2 text-[13px] text-text-lo">
          <span className="ml-1">ตั้งแต่</span>
          <input type="date" name="from" defaultValue={start} required aria-label="ตั้งแต่วันที่" className="h-9 rounded-lg border border-border bg-panel-raised px-2.5 text-[13px] text-text-hi" />
          <span>ถึง</span>
          <input type="date" name="to" defaultValue={end} required aria-label="ถึงวันที่" className="h-9 rounded-lg border border-border bg-panel-raised px-2.5 text-[13px] text-text-hi" />
          <button type="submit" className="h-9 cursor-pointer rounded-lg border border-border-strong bg-transparent px-3.5 text-[13px] font-semibold text-text-hi hover:bg-white/5">
            ดู
          </button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={previous} aria-label="ช่วงก่อนหน้า" className={navLink}>
          <ChevronLeft size={16} />
        </Link>
        <div className="min-w-[140px] text-center font-body text-[14px] font-semibold text-text-hi">{label}</div>
        <Link href={following} aria-label="ช่วงถัดไป" className={navLink}>
          <ChevronRight size={16} />
        </Link>
      </div>
      {/* Say so when the list could not be read, rather than looking like an empty month. */}
      {error && (
        <div className="mb-4 rounded-xl border border-coral bg-coral-bg px-4 py-3 text-[13.5px] leading-relaxed text-text-hi">
          โหลดรายการเซสชันไม่ได้ ส่งข้อความนี้ให้ผู้ดูแลระบบ: {error.message}
        </div>
      )}
      <PtSessionsClient key={`${start}:${end}`} sessions={sessions} period={period} />
    </div>
  );
}
