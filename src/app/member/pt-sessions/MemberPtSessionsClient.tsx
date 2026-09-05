"use client";

import { useTransition } from "react";
import { Check, ThumbsDown } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatTile } from "@/components/ui/StatTile";
import { approvePtSession, disputePtSession } from "@/lib/actions/pt-sessions";
import type { PtSession } from "@/types/database";

export interface MemberPtSession extends PtSession {
  trainer: { full_name: string };
}

export function MemberPtSessionsClient({
  sessions,
  ptTotal,
  ptRemaining,
}: {
  sessions: MemberPtSession[];
  ptTotal: number;
  ptRemaining: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="p-7">
      <PageHeader
        title="เซสชัน PT"
        subtitle="เมื่อเทรนเนอร์บันทึกว่าเทรนแล้ว คุณต้องยืนยันหรือปฏิเสธที่นี่ — ยืนยันแล้วระบบจะตัดชั่วโมงให้อัตโนมัติ"
      />

      <div className="mb-5 flex gap-3.5">
        <StatTile label="ชั่วโมงคงเหลือ" value={`${ptRemaining}/${ptTotal}`} tone={ptRemaining <= 2 ? "amber" : "mint"} />
        <StatTile label="รอคุณยืนยัน" value={sessions.filter((s) => s.status === "pending").length} tone="amber" />
      </div>

      <div className="flex flex-col gap-2.5">
        {sessions.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-panel px-[18px] py-3.5"
          >
            <div>
              <div className="text-sm font-medium text-text-hi">{s.trainer?.full_name}</div>
              <div className="mt-0.5 text-[12.5px] text-text-faint">
                {s.session_date} เวลา {s.session_time?.slice(0, 5)} น.
              </div>
            </div>

            {s.status === "pending" && (
              <div className="flex items-center gap-2">
                <Button
                  variant="confirm"
                  disabled={pending}
                  onClick={() => startTransition(async () => { await approvePtSession(s.id); })}
                  className="px-3 py-1.5"
                >
                  <Check size={14} /> ยืนยันว่าใช้บริการแล้ว
                </Button>
                <Button
                  variant="danger"
                  disabled={pending}
                  onClick={() => startTransition(async () => { await disputePtSession(s.id); })}
                  className="px-3 py-1.5"
                >
                  <ThumbsDown size={14} /> ไม่ได้ใช้บริการ
                </Button>
              </div>
            )}
            {s.status === "approved" && <Badge tone="active">คุณยืนยันแล้ว · ตัดชั่วโมงแล้ว</Badge>}
            {s.status === "disputed" && <Badge tone="cancelled">คุณปฏิเสธ · รอทีมงานตรวจสอบ</Badge>}
          </div>
        ))}
        {sessions.length === 0 && (
          <div className="rounded-xl border border-border bg-panel p-6 text-center text-[13.5px] text-text-faint">
            ยังไม่มีเซสชันให้ยืนยัน
          </div>
        )}
      </div>
    </div>
  );
}
