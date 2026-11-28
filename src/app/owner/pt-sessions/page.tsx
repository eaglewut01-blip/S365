import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { byId } from "@/lib/supabase/lookup";
import { addMonths, todayBangkok } from "@/lib/dates";
import type { PtSession } from "@/types/database";
import { PtSessionsClient, type PtSessionRow } from "./PtSessionsClient";

export const metadata = { title: "เซสชัน PT | S365 Fitness" };

// One month of PT sessions: each one signed by the client on the trainer's
// phone, with the hour already taken off.
export default async function OwnerPtSessionsPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();

  const asked = (await searchParams).m;
  const currentMonth = todayBangkok().slice(0, 7);
  const month = asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : currentMonth;
  const start = `${month}-01`;
  const next = addMonths(start, 1);

  const { data, error } = await supabase
    .from("pt_sessions")
    .select("*")
    .eq("branch_id", profile.branch_id ?? "")
    .gte("session_date", start)
    .lt("session_date", next)
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
  const navLink = "inline-flex h-9 items-center justify-center rounded-lg border border-border px-2.5 text-text-lo no-underline hover:text-text-hi";

  return (
    <div className="p-4 sm:p-7">
      <PageHeader title="เซสชัน PT" subtitle="เทรนเสร็จ ลูกค้าเซ็นบนมือถือของเทรนเนอร์ ระบบตัดชั่วโมงทันที ดูได้ที่นี่ว่าใครเทรนใคร เมื่อไร พร้อมลายเซ็น" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href={`/owner/pt-sessions?m=${addMonths(start, -1).slice(0, 7)}`} aria-label="เดือนก่อนหน้า" className={navLink}>
          <ChevronLeft size={16} />
        </Link>
        <div className="min-w-[140px] text-center font-body text-[14px] font-semibold text-text-hi">{monthLabel}</div>
        <Link href={`/owner/pt-sessions?m=${next.slice(0, 7)}`} aria-label="เดือนถัดไป" className={navLink}>
          <ChevronRight size={16} />
        </Link>
        {month !== currentMonth && (
          <Link href="/owner/pt-sessions" className={`${navLink} text-[12.5px]`}>
            กลับมาเดือนนี้
          </Link>
        )}
      </div>
      {/* Say so when the list could not be read, rather than looking like an empty month. */}
      {error && (
        <div className="mb-4 rounded-xl border border-coral bg-coral-bg px-4 py-3 text-[13.5px] leading-relaxed text-text-hi">
          โหลดรายการเซสชันไม่ได้ ส่งข้อความนี้ให้ผู้ดูแลระบบ: {error.message}
        </div>
      )}
      <PtSessionsClient key={month} sessions={sessions} />
    </div>
  );
}
