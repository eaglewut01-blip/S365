import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Card";
import { addMonths, todayBangkok } from "@/lib/dates";
import type { Member, MemberPurchase } from "@/types/database";
import { SalesTable, type SaleRow } from "./SalesTable";

export const metadata = { title: "ยอดขาย | S365 Fitness" };

type Sale = MemberPurchase & { member: Pick<Member, "name" | "pt_trainer_id" | "legacy_trainer"> | null };

// One month of sales: who bought what, who sold it and who trains, in place
// of the monthly spreadsheet the team used to fill in by hand.
export default async function SalesPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const asked = (await searchParams).m;
  const currentMonth = todayBangkok().slice(0, 7);
  const month = asked && /^\d{4}-(0[1-9]|1[0-2])$/.test(asked) ? asked : currentMonth;
  const start = `${month}-01`;
  const next = addMonths(start, 1);

  const [salesResult, team] = await Promise.all([
    supabase
      .from("member_purchases")
      .select("*, member:members(*)")
      .eq("branch_id", branchId)
      .gte("purchased_on", start)
      .lt("purchased_on", next)
      .order("purchased_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").eq("branch_id", branchId),
  ]);

  const names = new Map((team.data ?? []).map((p) => [p.id, p.full_name]));
  const sales: SaleRow[] = ((salesResult.data ?? []) as unknown as Sale[]).map((s) => ({
    id: s.id,
    memberId: s.member_id,
    memberName: s.member?.name ?? "-",
    kind: s.kind,
    isRenewal: s.is_renewal,
    packageName: s.package_name,
    amount: Number(s.amount),
    method: s.payment_method,
    purchasedOn: s.purchased_on,
    seller: (s.sold_by && names.get(s.sold_by)) || "",
    seller2: (s.sold_by_2 && names.get(s.sold_by_2)) || "",
    seller2Amount: s.sold_by_2 ? Number(s.sold_by_2_amount ?? 0) : 0,
    // The trainer recorded on the sale; for older rows, the member's trainer,
    // or the name carried over from the previous system.
    trainer:
      s.kind !== "pt"
        ? ""
        : (s.trainer_id && names.get(s.trainer_id)) || (s.member?.pt_trainer_id && names.get(s.member.pt_trainer_id)) || s.member?.legacy_trainer || "",
    proof_path: s.proof_path,
    document_paths: s.document_paths,
  }));

  const monthLabel = new Date(`${start}T12:00:00Z`).toLocaleDateString("th-TH", { timeZone: "UTC", month: "long", year: "numeric" });
  const navLink = "inline-flex h-9 items-center justify-center rounded-lg border border-border px-2.5 text-text-lo no-underline hover:text-text-hi";

  return (
    <div className="p-4 sm:p-7">
      <PageHeader title="ยอดขาย" subtitle="ดูรายเดือนว่าใครซื้ออะไร ใครขาย ใครเทรน แทนการลง Excel ซ้ำ บันทึกการขายใหม่ได้ที่เมนู ขาย" />

      {salesResult.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : (
        <>
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
          <SalesTable key={month} sales={sales} />
        </>
      )}
    </div>
  );
}
