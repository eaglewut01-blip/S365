"use client";

import { useTransition } from "react";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { resolvePtDispute } from "@/lib/actions/pt-sessions";
import type { PtSession } from "@/types/database";

export interface PtSessionRow extends PtSession {
  member: { name: string; pt_total: number; pt_remaining: number };
  trainer: { full_name: string };
}

export function PtSessionsClient({ sessions }: { sessions: PtSessionRow[] }) {
  const [pending, startTransition] = useTransition();

  const pendingCount = sessions.filter((s) => s.status === "pending").length;
  const approvedCount = sessions.filter((s) => s.status === "approved").length;
  const disputedCount = sessions.filter((s) => s.status === "disputed").length;

  return (
    <div className="p-7">
      <PageHeader
        title="เซสชัน PT"
        subtitle="เทรนเนอร์บันทึกว่าเทรนแล้ว → ลูกค้ายืนยันการใช้บริการ → ระบบตัดชั่วโมงอัตโนมัติ — ทีมงานเข้ามาช่วยตัดสินเฉพาะกรณีมีข้อโต้แย้ง"
      />

      <div className="mb-5 flex gap-3.5">
        <StatTile label="รอลูกค้ายืนยัน" value={pendingCount} tone="amber" />
        <StatTile label="ยืนยันแล้ว" value={approvedCount} tone="mint" />
        <StatTile label="มีข้อโต้แย้ง" value={disputedCount} tone="coral" />
      </div>

      <div className="flex flex-col gap-2.5">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel px-[18px] py-3.5"
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-text-hi">{s.member?.name}</div>
              <div className="mt-0.5 text-[12.5px] text-text-faint">
                {s.trainer?.full_name} · {s.session_date} เวลา {s.session_time?.slice(0, 5)} น. · เหลือ{" "}
                {s.member?.pt_remaining}/{s.member?.pt_total} ชม.
              </div>
            </div>
            {s.status === "pending" && <Badge tone="due">รอลูกค้ายืนยัน</Badge>}
            {s.status === "approved" && <Badge tone="active">ลูกค้ายืนยันแล้ว · ตัดชั่วโมงแล้ว</Badge>}
            {s.status === "disputed" && (
              <div className="flex items-center gap-2">
                <Badge tone="cancelled">ลูกค้าปฏิเสธ · รอตรวจสอบ</Badge>
                <Button
                  variant="secondary"
                  disabled={pending}
                  onClick={() => startTransition(async () => { await resolvePtDispute(s.id, "approved"); })}
                  className="px-2.5 py-1.5 text-xs"
                >
                  ยืนยันแทน (ตัดชั่วโมง)
                </Button>
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => startTransition(async () => { await resolvePtDispute(s.id, "pending"); })}
                  className="px-2.5 py-1.5 text-xs"
                >
                  เปิดให้ยืนยันใหม่
                </Button>
              </div>
            )}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="rounded-xl border border-border bg-panel p-6 text-center text-[13.5px] text-text-faint">
            ยังไม่มีการบันทึกเซสชัน
          </div>
        )}
      </div>
    </div>
  );
}
