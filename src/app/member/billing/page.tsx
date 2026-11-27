import { requireRole } from "@/lib/session";
import { getCurrentMember } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { formatBaht } from "@/lib/format";
import { expiryLabel, expiryState, formatDateTh } from "@/lib/dates";
import type { MemberPurchase } from "@/types/database";

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
  const { data } = await supabase
    .from("member_purchases")
    .select("*")
    .eq("member_id", member.id)
    .order("purchased_on", { ascending: false })
    .order("created_at", { ascending: false });
  const purchases = (data ?? []) as MemberPurchase[];
  const expiry = expiryState(member.membership_expires_on);

  return (
    <div className="p-4 sm:p-7">
      <PageHeader title="แพ็กเกจของฉัน" subtitle="แพ็กเกจที่ซื้อไว้และวันหมดอายุ" />

      <div className="mb-6 flex flex-wrap gap-3.5">
        <StatTile
          label="อายุสมาชิก"
          value={expiryLabel(member.membership_expires_on)}
          sub={member.membership_expires_on ? `ถึง ${formatDateTh(member.membership_expires_on)}` : undefined}
          tone={expiry.state === "expired" ? "coral" : expiry.state === "soon" ? "amber" : expiry.state === "ok" ? "mint" : undefined}
        />
        <StatTile label="ชั่วโมง PT คงเหลือ" value={member.pt_total > 0 ? `${member.pt_remaining}/${member.pt_total}` : "-"} />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {purchases.map((p) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-border bg-panel px-4 py-3 first:border-t-0">
            <div>
              <div className="text-[13.5px] font-medium text-text-hi">{p.package_name}</div>
              <div className="text-xs text-text-faint">ซื้อ {formatDateTh(p.purchased_on)}</div>
            </div>
            <div className="text-[13px] text-text-lo">
              {p.kind === "membership" ? `${formatDateTh(p.starts_on)} ถึง ${formatDateTh(p.ends_on)}` : `${p.pt_sessions} ชั่วโมง`}
            </div>
            <div className="text-[13.5px] text-text-hi">{formatBaht(Number(p.amount))}</div>
          </div>
        ))}
        {purchases.length === 0 && <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีรายการ</div>}
      </div>
    </div>
  );
}
