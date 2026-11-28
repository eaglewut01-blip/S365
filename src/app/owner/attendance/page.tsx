import Link from "next/link";
import { ChevronLeft, ChevronRight, QrCode } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { addDays, addMonths, formatTimeTh, todayBangkok } from "@/lib/dates";

export const metadata = { title: "เข้างานพนักงาน | S365 Fitness" };

const ROLE_LABEL: Record<string, string> = { owner: "เจ้าของ", staff: "เซลล์ / พนักงาน", trainer: "เทรนเนอร์" };
const DAY_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// Who came to work and at what time, one month at a time.
export default async function AttendancePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const asked = (await searchParams).m;
  const today = todayBangkok();
  const currentMonth = today.slice(0, 7);
  const month = asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : currentMonth;
  const start = `${month}-01`;
  const next = addMonths(start, 1);

  const teamQuery = (columns: string) => supabase.from("profiles").select(columns).eq("branch_id", branchId).in("role", ["staff", "trainer"]).order("role").order("full_name");
  const [withStart, attendance] = await Promise.all([
    teamQuery("id, full_name, role, work_start"),
    supabase.from("staff_attendance").select("id, profile_id, work_date, clocked_in_at").eq("branch_id", branchId).gte("work_date", start).lt("work_date", next).limit(2000),
  ]);

  // work_start arrives with the latest database update; do without it until then.
  const team = withStart.error ? await teamQuery("id, full_name, role") : withStart;
  const people = (team.data ?? []) as unknown as { id: string; full_name: string; role: string; work_start?: string | null }[];
  const dueAt = new Map(people.map((p) => [p.id, p.work_start ? p.work_start.slice(0, 5) : ""]));
  // Minutes late for one arrival; 0 when on time or when no time is set.
  const lateBy = (id: string, instant: string) => {
    const due = dueAt.get(id);
    if (!due) return 0;
    const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
    return Math.max(0, minutes(formatTimeTh(instant)) - minutes(due));
  };
  const rows = (attendance.data ?? []) as { id: string; profile_id: string; work_date: string; clocked_in_at: string }[];
  const at = new Map(rows.map((r) => [`${r.profile_id}|${r.work_date}`, r.clocked_in_at]));
  const lateText = (minutes: number) => (minutes < 60 ? `สาย ${minutes} นาที` : `สาย ${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที`);
  const daysWorked = (id: string) => rows.filter((r) => r.profile_id === id).length;
  const daysLate = (id: string) => rows.filter((r) => r.profile_id === id && lateBy(id, r.clocked_in_at) > 0).length;
  const anyDue = people.some((p) => dueAt.get(p.id));

  // Days of the month up to today, newest first.
  const days: string[] = [];
  for (let d = start; d < next && d <= today; d = addDays(d, 1)) days.unshift(d);

  const monthLabel = new Date(`${start}T12:00:00Z`).toLocaleDateString("th-TH", { timeZone: "UTC", month: "long", year: "numeric" });
  const navLink = "inline-flex h-9 items-center justify-center rounded-lg border border-border px-2.5 text-text-lo no-underline hover:text-text-hi";
  const cameToday = people.filter((p) => at.has(`${p.id}|${today}`)).length;

  return (
    <div className="p-4 sm:p-7">
      <PageHeader
        title="เข้างานพนักงาน"
        subtitle="ทีมงานสแกนป้าย QR เข้างานที่ยิมด้วยมือถือตัวเอง ระบบบันทึกเวลามาถึงวันละครั้ง ตั้งเวลาเข้างานของแต่ละคนได้ที่เมนู ทีมงาน ปุ่ม แก้ แล้วหน้านี้จะบอกว่าใครมาสายกี่นาที"
        action={
          profile.role === "owner" ? (
            <Link href="/owner/attendance/qr" className="inline-flex items-center gap-1.5 rounded-lg border border-volt bg-volt px-3.5 py-2 font-body text-[13.5px] font-semibold text-volt-ink no-underline">
              <QrCode size={14} /> ป้าย QR เข้างาน
            </Link>
          ) : undefined
        }
      />

      {attendance.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> รอบล่าสุดหนึ่งครั้งก่อน
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href={`/owner/attendance?m=${addMonths(start, -1).slice(0, 7)}`} aria-label="เดือนก่อนหน้า" className={navLink}>
              <ChevronLeft size={16} />
            </Link>
            <div className="min-w-[140px] text-center font-body text-[14px] font-semibold text-text-hi">{monthLabel}</div>
            <Link href={`/owner/attendance?m=${next.slice(0, 7)}`} aria-label="เดือนถัดไป" className={navLink}>
              <ChevronRight size={16} />
            </Link>
            {month !== currentMonth && (
              <Link href="/owner/attendance" className={`${navLink} text-[12.5px]`}>
                กลับมาเดือนนี้
              </Link>
            )}
          </div>

          {month === currentMonth && (
            <>
              <h2 className="m-0 mb-2 font-heading text-[15px] text-text-hi">
                วันนี้ มาแล้ว {cameToday} จาก {people.length} คน
              </h2>
              <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {people.map((p) => {
                  const time = at.get(`${p.id}|${today}`);
                  const late = time ? lateBy(p.id, time) : 0;
                  const due = dueAt.get(p.id);
                  return (
                    <div key={p.id} className={`rounded-xl border bg-panel px-3.5 py-2.5 ${late ? "border-amber" : time ? "border-mint" : "border-border"}`}>
                      <div className="truncate text-[14px] font-medium text-text-hi">{p.full_name}</div>
                      <div className="text-[11.5px] text-text-faint">
                        {ROLE_LABEL[p.role]}
                        {due ? ` · เข้างาน ${due} น.` : ""}
                      </div>
                      <div className={`mt-1 text-[14px] font-semibold tabular-nums ${late ? "text-amber" : time ? "text-mint" : "text-text-faint"}`}>
                        {time ? `มา ${formatTimeTh(time)} น.${late ? ` ${lateText(late)}` : ""}` : "ยังไม่เข้างาน"}
                      </div>
                    </div>
                  );
                })}
                {people.length === 0 && <div className="col-span-full text-[13.5px] text-text-faint">ยังไม่มีทีมงานในระบบ เพิ่มได้ที่เมนู ทีมงาน</div>}
              </div>
            </>
          )}

          <h2 className="m-0 mb-2 font-heading text-[15px] text-text-hi">ทั้งเดือน เวลาที่เข้างานแต่ละวัน</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse bg-panel text-[13px]">
              <thead>
                <tr className="text-left text-xs text-text-faint">
                  <th className="sticky left-0 bg-panel px-3 py-2.5 font-medium whitespace-nowrap">วันที่</th>
                  {people.map((p) => (
                    <th key={p.id} className="px-3 py-2.5 text-center font-medium whitespace-nowrap text-text-hi">
                      {p.full_name}
                      <div className="text-[11px] font-normal text-text-faint">{dueAt.get(p.id) ? `เข้างาน ${dueAt.get(p.id)}` : "ไม่กำหนดเวลา"}</div>
                    </th>
                  ))}
                </tr>
                <tr className="border-t border-border text-xs text-text-lo">
                  <td className="sticky left-0 bg-panel px-3 py-2 whitespace-nowrap">มาทำงาน (วัน)</td>
                  {people.map((p) => (
                    <td key={p.id} className="px-3 py-2 text-center font-semibold text-volt tabular-nums">
                      {daysWorked(p.id)}
                    </td>
                  ))}
                </tr>
                {anyDue && (
                  <tr className="border-t border-border text-xs text-text-lo">
                    <td className="sticky left-0 bg-panel px-3 py-2 whitespace-nowrap">มาสาย (วัน)</td>
                    {people.map((p) => (
                      <td key={p.id} className={`px-3 py-2 text-center font-semibold tabular-nums ${daysLate(p.id) ? "text-amber" : "text-text-faint"}`}>
                        {dueAt.get(p.id) ? daysLate(p.id) : "-"}
                      </td>
                    ))}
                  </tr>
                )}
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d} className="border-t border-border">
                    <td className="sticky left-0 bg-panel px-3 py-2 whitespace-nowrap text-text-lo">
                      {DAY_SHORT[new Date(`${d}T12:00:00Z`).getUTCDay()]} {Number(d.slice(8))}
                    </td>
                    {people.map((p) => {
                      const time = at.get(`${p.id}|${d}`);
                      const late = time ? lateBy(p.id, time) : 0;
                      return (
                        <td key={p.id} className={`px-3 py-2 text-center tabular-nums ${late ? "text-amber" : time ? "text-text-hi" : "text-text-faint"}`}>
                          {time ? formatTimeTh(time) : "-"}
                          {late > 0 && <div className="text-[11px]">{lateText(late)}</div>}
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
