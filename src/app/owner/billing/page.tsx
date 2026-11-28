import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { SaleFiles } from "@/components/ProofLink";
import { addMonths, formatDateTh, todayBangkok } from "@/lib/dates";
import { formatBaht } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/labels";
import type { MemberPurchase } from "@/types/database";

export const metadata = { title: "การขาย | S365 Fitness" };

type Sale = MemberPurchase & { member: { name: string } | null; seller: { full_name: string } | null };

// The four columns the gym pays commission on.
const GROUPS = [
  { key: "membership-new", label: "สมาชิกใหม่" },
  { key: "membership-renew", label: "สมาชิกซื้อซ้ำ" },
  { key: "pt-new", label: "PT ใหม่" },
  { key: "pt-renew", label: "PT ซื้อซ้ำ" },
] as const;

const groupOf = (s: Sale) => `${s.kind}-${s.is_renewal ? "renew" : "new"}`;

// One month of sales: totals, what each seller sold (for commission), and every sale.
export default async function SalesPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const asked = (await searchParams).m;
  const currentMonth = todayBangkok().slice(0, 7);
  const month = asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : currentMonth;
  const start = `${month}-01`;
  const next = addMonths(start, 1);

  const [salesResult] = await Promise.all([
    supabase
      .from("member_purchases")
      .select("*, member:members(name), seller:profiles!member_purchases_sold_by_fkey(full_name)")
      .eq("branch_id", branchId)
      .gte("purchased_on", start)
      .lt("purchased_on", next)
      .order("purchased_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const sales = (salesResult.data ?? []) as unknown as Sale[];
  const sum = (rows: Sale[]) => rows.reduce((total, s) => total + Number(s.amount), 0);

  const sellers = new Map<string, { name: string; rows: Sale[] }>();
  for (const s of sales) {
    const key = s.sold_by ?? "";
    if (!sellers.has(key)) sellers.set(key, { name: s.seller?.full_name ?? "ไม่ระบุผู้ขาย", rows: [] });
    sellers.get(key)!.rows.push(s);
  }
  const sellerRows = [...sellers.entries()].sort((a, b) => (a[0] === "" ? 1 : b[0] === "" ? -1 : sum(b[1].rows) - sum(a[1].rows)));

  const monthLabel = new Date(`${start}T12:00:00Z`).toLocaleDateString("th-TH", { timeZone: "UTC", month: "long", year: "numeric" });
  const navLink = "inline-flex h-9 items-center justify-center rounded-lg border border-border px-2.5 text-text-lo no-underline hover:text-text-hi";

  return (
    <div className="p-4 sm:p-7">
      <PageHeader title="ยอดขาย" subtitle="ยอดขายรายเดือน ยอดของผู้ขายแต่ละคนสำหรับคิดค่าคอม และรายการขายทั้งหมด" />

      {salesResult.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : (
        <>
          <Link
            href="/owner/sell"
            className="mb-5 inline-flex items-center gap-1.5 rounded-lg border border-volt bg-volt px-4 py-2.5 font-body text-[13.5px] font-semibold text-volt-ink no-underline hover:brightness-110"
          >
            สร้างรายการขาย
          </Link>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href={`/owner/billing?m=${addMonths(start, -1).slice(0, 7)}`} aria-label="เดือนก่อนหน้า" className={navLink}>
              <ChevronLeft size={16} />
            </Link>
            <div className="min-w-[140px] text-center font-body text-[14px] font-semibold text-text-hi">{monthLabel}</div>
            <Link href={`/owner/billing?m=${next.slice(0, 7)}`} aria-label="เดือนถัดไป" className={navLink}>
              <ChevronRight size={16} />
            </Link>
            {month !== currentMonth && (
              <Link href="/owner/billing" className={`${navLink} text-[12.5px]`}>
                กลับมาเดือนนี้
              </Link>
            )}
          </div>

          <div className="mb-[22px] flex flex-wrap gap-3.5">
            <StatTile label="ยอดขายรวม" value={formatBaht(sum(sales))} sub={`${sales.length} รายการ`} tone="mint" />
            {GROUPS.map((g) => (
              <StatTile key={g.key} label={g.label} value={formatBaht(sum(sales.filter((s) => groupOf(s) === g.key)))} />
            ))}
          </div>

          <h2 className="m-0 mb-2.5 font-heading text-[15px] text-text-hi">ยอดขายตามผู้ขาย</h2>
          <div className="mb-6 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[680px] border-collapse bg-panel text-left text-[13px]">
              <thead>
                <tr className="text-xs text-text-faint">
                  <th scope="col" className="px-4 py-2.5 font-normal">ผู้ขาย</th>
                  {GROUPS.map((g) => (
                    <th key={g.key} scope="col" className="px-3 py-2.5 text-right font-normal">{g.label}</th>
                  ))}
                  <th scope="col" className="px-4 py-2.5 text-right font-normal">รวม</th>
                </tr>
              </thead>
              <tbody>
                {sellerRows.map(([key, seller]) => (
                  <tr key={key || "none"} className="border-t border-border">
                    <th scope="row" className={`px-4 py-3 font-medium ${key ? "text-text-hi" : "text-text-faint"}`}>
                      {seller.name} <span className="ml-1 text-xs font-normal text-text-faint">{seller.rows.length} รายการ</span>
                    </th>
                    {GROUPS.map((g) => (
                      <td key={g.key} className="px-3 py-3 text-right text-text-lo tabular-nums">
                        {formatBaht(sum(seller.rows.filter((s) => groupOf(s) === g.key)))}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right font-semibold text-text-hi tabular-nums">{formatBaht(sum(seller.rows))}</td>
                  </tr>
                ))}
                {sellerRows.length === 0 && (
                  <tr className="border-t border-border">
                    <td colSpan={6} className="px-4 py-5 text-center text-text-faint">ยังไม่มีรายการขายในเดือนนี้</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="m-0 mb-2.5 font-heading text-[15px] text-text-hi">รายการขาย</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[0.8fr_1.4fr_1.4fr_0.9fr_0.8fr_0.9fr] bg-panel px-4 py-2.5 text-xs text-text-faint">
                <div>วันที่</div>
                <div>สมาชิก</div>
                <div>แพ็กเกจ</div>
                <div>ประเภท</div>
                <div>ยอดชำระ</div>
                <div>ผู้ขาย</div>
              </div>
              {sales.map((s) => (
                <div key={s.id} className="grid grid-cols-[0.8fr_1.4fr_1.4fr_0.9fr_0.8fr_0.9fr] items-center border-t border-border bg-panel px-4 py-3 text-[13px] text-text-lo">
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
                    <SaleFiles purchase={s} />
                  </div>
                  <div>{s.seller?.full_name ?? "-"}</div>
                </div>
              ))}
              {sales.length === 0 && <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีรายการขายในเดือนนี้</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
