import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { formatDateTh, todayBangkok } from "@/lib/dates";
import { formatBaht } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/labels";
import type { MemberPurchase } from "@/types/database";

export const metadata = { title: "การขาย | S365 Fitness" };

type Sale = MemberPurchase & { member: { name: string } | null; seller: { full_name: string } | null };

// Every package sold, newest first, with this month's totals on top.
export default async function SalesPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const monthStart = `${todayBangkok().slice(0, 7)}-01`;

  const { data, error } = await supabase
    .from("member_purchases")
    .select("*, member:members(name), seller:profiles!member_purchases_sold_by_fkey(full_name)")
    .eq("branch_id", profile.branch_id ?? "")
    .order("purchased_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  const sales = (data ?? []) as unknown as Sale[];
  const thisMonth = sales.filter((s) => s.purchased_on >= monthStart);
  const sum = (rows: Sale[]) => rows.reduce((total, s) => total + Number(s.amount), 0);

  return (
    <div className="p-4 sm:p-7">
      <PageHeader title="การขาย" subtitle="รายการขายแพ็กเกจล่าสุด บันทึกการขายได้จากหน้าของสมาชิกแต่ละคน" />

      {error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : (
        <>
          <div className="mb-[22px] flex flex-wrap gap-3.5">
            <StatTile label="ยอดขายเดือนนี้" value={formatBaht(sum(thisMonth))} sub={`${thisMonth.length} รายการ`} tone="mint" />
            <StatTile
              label="สมาชิก เดือนนี้"
              value={formatBaht(sum(thisMonth.filter((s) => s.kind === "membership")))}
              sub={`ใหม่ ${formatBaht(sum(thisMonth.filter((s) => s.kind === "membership" && !s.is_renewal)))} · ซื้อซ้ำ ${formatBaht(sum(thisMonth.filter((s) => s.kind === "membership" && s.is_renewal)))}`}
            />
            <StatTile
              label="PT เดือนนี้"
              value={formatBaht(sum(thisMonth.filter((s) => s.kind === "pt")))}
              sub={`ใหม่ ${formatBaht(sum(thisMonth.filter((s) => s.kind === "pt" && !s.is_renewal)))} · ซื้อซ้ำ ${formatBaht(sum(thisMonth.filter((s) => s.kind === "pt" && s.is_renewal)))}`}
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[0.8fr_1.4fr_1.4fr_0.7fr_0.8fr_0.9fr] bg-panel px-4 py-2.5 text-xs text-text-faint">
                <div>วันที่</div>
                <div>สมาชิก</div>
                <div>แพ็กเกจ</div>
                <div>ประเภท</div>
                <div>ยอดชำระ</div>
                <div>ผู้ขาย</div>
              </div>
              {sales.map((s) => (
                <div key={s.id} className="grid grid-cols-[0.8fr_1.4fr_1.4fr_0.7fr_0.8fr_0.9fr] items-center border-t border-border bg-panel px-4 py-3 text-[13px] text-text-lo">
                  <div>{formatDateTh(s.purchased_on)}</div>
                  <Link href={`/owner/members/${s.member_id}`} className="font-medium text-text-hi no-underline hover:text-volt">
                    {s.member?.name ?? "-"}
                  </Link>
                  <div>{s.package_name}</div>
                  <div>
                    <Badge tone={s.kind === "pt" ? "due" : "active"}>
                      {s.kind === "pt" ? "PT" : "สมาชิก"} {s.is_renewal ? "ซื้อซ้ำ" : "ใหม่"}
                    </Badge>
                  </div>
                  <div className="text-text-hi">
                    {formatBaht(Number(s.amount))}
                    <div className="text-xs text-text-faint">{PAYMENT_LABEL[s.payment_method]}</div>
                  </div>
                  <div>{s.seller?.full_name ?? "-"}</div>
                </div>
              ))}
              {sales.length === 0 && <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีรายการขาย</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
