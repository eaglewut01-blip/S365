"use client";

import { useTransition } from "react";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { markPaid } from "@/lib/actions/billing";
import { formatBaht } from "@/lib/format";
import type { Member } from "@/types/database";

const BILLING_LABEL = { paid: "ชำระแล้ว", due: "ใกล้ครบ", overdue: "ค้างชำระ" } as const;

export function BillingClient({ members }: { members: Member[] }) {
  const [pending, startTransition] = useTransition();

  const overdue = members.filter((m) => m.billing_status === "overdue");
  const due = members.filter((m) => m.billing_status === "due");
  const paid = members.filter((m) => m.billing_status === "paid");
  const totalOutstanding = [...overdue, ...due].reduce((s, m) => s + Number(m.amount), 0);
  const rows = [...overdue, ...due, ...paid];

  return (
    <div className="p-7">
      <PageHeader title="การเงิน" subtitle={`ยอดค้างชำระรวม ${formatBaht(totalOutstanding)}`} />

      <div className="mb-[22px] flex gap-3.5">
        <StatTile label="ค้างชำระ" value={overdue.length} tone="coral" />
        <StatTile label="ใกล้ครบกำหนด" value={due.length} tone="amber" />
        <StatTile label="ชำระแล้ว" value={paid.length} tone="mint" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_1fr] bg-panel px-4 py-2.5 text-xs text-text-faint">
          <div>ชื่อ</div>
          <div>แพ็กเกจ</div>
          <div>ยอด</div>
          <div>ครบกำหนด</div>
          <div>สถานะ</div>
        </div>
        {rows.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[1.4fr_1fr_0.8fr_1fr_1fr] items-center border-t border-border bg-panel px-4 py-3"
          >
            <div className="text-[13.5px] text-text-hi">{m.name}</div>
            <div className="text-[13px] text-text-lo">{m.plan}</div>
            <div className="text-[13px] text-text-lo">{formatBaht(Number(m.amount))}</div>
            <div className="text-[13px] text-text-lo">{m.next_bill_date ?? "-"}</div>
            <div className="flex items-center gap-2">
              <Badge tone={m.billing_status}>{BILLING_LABEL[m.billing_status]}</Badge>
              {m.billing_status !== "paid" && (
                <button
                  disabled={pending}
                  onClick={() => startTransition(async () => { await markPaid(m.id); })}
                  className="cursor-pointer border-none bg-transparent text-xs text-mint"
                >
                  บันทึกจ่ายแล้ว
                </button>
              )}
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีสมาชิก</div>
        )}
      </div>
    </div>
  );
}
