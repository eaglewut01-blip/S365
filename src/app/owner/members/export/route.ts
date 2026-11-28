import { NextResponse, type NextRequest } from "next/server";
import writeExcelFile from "write-excel-file/node";
import { getCurrentProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { daysBetween, formatDateTh, todayBangkok } from "@/lib/dates";
import { GROUP_SHEET, memberGroup, type MemberGroup } from "@/lib/member-groups";
import type { Member } from "@/types/database";

type Cell = { value?: string | number; type?: StringConstructor; fontWeight?: "bold"; align?: "right" };

const GROUPS: MemberGroup[] = ["soon", "expired", "active"];
const HEAD = ["ชื่อ", "เบอร์โทร", "แพ็กเกจ", "วันหมดอายุ", "เหลือ (วัน) ติดลบคือหมดมาแล้ว", "PT เหลือ (ชม.)", "เทรนเนอร์", "มายิมล่าสุด", "มาแล้ว (ครั้ง)"];
const COLUMNS = [{ width: 32 }, { width: 16 }, { width: 30 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 14 }, { width: 14 }, { width: 12 }];

// Excel file of members to call: about to run out, already run out, or
// still active. Owner and staff only; the shared counter account cannot take
// the customer list away.
export async function GET(request: NextRequest) {
  const profile = await getCurrentProfile();
  const allowed = profile && (profile.role === "owner" || (profile.role === "staff" && !profile.counter_only));
  if (!allowed || !profile.branch_id) return NextResponse.redirect(new URL("/owner/members", request.url));

  const asked = request.nextUrl.searchParams.get("g");
  const wanted = GROUPS.filter((g) => asked === g);
  const groups = wanted.length ? wanted : GROUPS;

  const supabase = await createClient();
  const [members, trainers] = await Promise.all([
    fetchAll<Member>((from, to) => supabase.from("members").select("*").eq("branch_id", profile.branch_id!).neq("status", "cancelled").order("name").order("id").range(from, to)),
    supabase.from("profiles").select("id, full_name").eq("branch_id", profile.branch_id),
  ]);
  const trainerName = new Map(((trainers.data ?? []) as { id: string; full_name: string }[]).map((t) => [t.id, t.full_name]));
  const today = todayBangkok();

  const sheets = groups.map((group) => {
    const list = members.data
      .filter((m) => memberGroup(m.membership_expires_on) === group)
      // Soonest to run out first; for those already out, the most recent first.
      .sort((a, b) => (group === "expired" ? -1 : 1) * a.membership_expires_on!.localeCompare(b.membership_expires_on!));
    const rows: Cell[][] = list.map((m) => [
      { value: m.name },
      // Kept as text so the leading 0 of a phone number survives in Excel.
      { value: m.phone ?? "", type: String },
      { value: m.plan === "-" ? "" : m.plan },
      { value: formatDateTh(m.membership_expires_on) },
      { value: daysBetween(today, m.membership_expires_on!), align: "right" },
      { value: m.pt_total > 0 ? m.pt_remaining : undefined, align: "right" },
      { value: (m.pt_trainer_id && trainerName.get(m.pt_trainer_id)) || m.legacy_trainer || "" },
      { value: m.last_visit ? formatDateTh(m.last_visit) : "" },
      { value: m.visit_count, align: "right" },
    ]);
    return { data: [HEAD.map((value): Cell => ({ value, fontWeight: "bold" })), ...rows], sheet: GROUP_SHEET[group], columns: COLUMNS, stickyRowsCount: 1 };
  });

  const buffer = await writeExcelFile(sheets).toBuffer();
  const name = `s365-members-${wanted.length ? wanted[0] : "all"}-${today}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${name}"`,
      "cache-control": "no-store",
    },
  });
}
