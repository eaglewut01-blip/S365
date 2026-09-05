import { requireRole } from "@/lib/session";
import { getCurrentMember } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { formatBaht } from "@/lib/format";

const BILLING_LABEL = { paid: "ชำระแล้ว", due: "ใกล้ครบ", overdue: "ค้างชำระ" } as const;

export default async function MemberBillingPage() {
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
  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("member_id", member.id)
    .order("paid_at", { ascending: false });

  return (
    <div className="p-7">
      <PageHeader title="การเงิน" subtitle={`แพ็กเกจ ${member.plan}`} />

      <div className="mb-6 flex gap-3.5">
        <StatTile label="ยอดที่ต้องชำระ" value={formatBaht(Number(member.amount))} tone={member.billing_status === "paid" ? "mint" : "coral"} />
        <StatTile label="ครบกำหนดถัดไป" value={member.next_bill_date ?? "-"} />
        <div className="flex min-w-[160px] flex-1 items-center rounded-xl border border-border bg-panel px-[18px] py-4">
          <Badge tone={member.billing_status}>{BILLING_LABEL[member.billing_status]}</Badge>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-2 bg-panel px-4 py-2.5 text-xs text-text-faint">
          <div>วันที่ชำระ</div>
          <div>จำนวนเงิน</div>
        </div>
        {(payments ?? []).map((p) => (
          <div key={p.id} className="grid grid-cols-2 items-center border-t border-border bg-panel px-4 py-3">
            <div className="text-[13px] text-text-lo">{new Date(p.paid_at).toLocaleDateString("th-TH")}</div>
            <div className="text-[13.5px] text-text-hi">{formatBaht(Number(p.amount))}</div>
          </div>
        ))}
        {(payments ?? []).length === 0 && (
          <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีประวัติการชำระเงิน</div>
        )}
      </div>
    </div>
  );
}
