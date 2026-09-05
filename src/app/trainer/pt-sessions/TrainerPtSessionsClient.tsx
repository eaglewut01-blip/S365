"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { StatTile } from "@/components/ui/StatTile";
import { logPtSession } from "@/lib/actions/pt-sessions";
import type { Member, PtSession } from "@/types/database";

export interface TrainerPtSession extends PtSession {
  member: { name: string; pt_total: number; pt_remaining: number };
}

function LogSessionForm({ ptMembers, onClose }: { ptMembers: Member[]; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="mb-4 rounded-xl border border-border bg-panel-raised p-[18px]">
      <div className="mb-3 flex justify-between">
        <h3 className="m-0 font-heading text-[15px] text-text-hi">บันทึกเซสชันที่เทรนแล้ว</h3>
        <button onClick={onClose} className="cursor-pointer border-none bg-transparent text-text-faint">
          <X size={16} />
        </button>
      </div>
      <form
        action={(formData) =>
          startTransition(async () => {
            const res = await logPtSession(formData);
            if (res?.error) setError(res.error);
            else onClose();
          })
        }
        className="grid grid-cols-[1.4fr_0.8fr_auto] gap-2.5"
      >
        <Select name="member_id" required defaultValue="">
          <option value="" disabled>
            เลือกลูกค้า
          </option>
          {ptMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} · เหลือ {m.pt_remaining} ชม.
            </option>
          ))}
        </Select>
        <Input type="time" name="session_time" defaultValue="18:00" required />
        <Button type="submit" variant="primary" disabled={pending}>
          <Plus size={14} /> บันทึก
        </Button>
      </form>
      {error && <div className="mt-2 text-[12.5px] text-coral">{error}</div>}
      <div className="mt-2.5 text-xs text-text-faint">
        บันทึกแล้วจะยังไม่ตัดชั่วโมง — ต้องรอให้ลูกค้ายืนยันว่าใช้บริการจริงก่อน
      </div>
    </div>
  );
}

export function TrainerPtSessionsClient({
  ptMembers,
  sessions,
}: {
  ptMembers: Member[];
  sessions: TrainerPtSession[];
}) {
  const [showForm, setShowForm] = useState(false);

  const pendingCount = sessions.filter((s) => s.status === "pending").length;
  const approvedCount = sessions.filter((s) => s.status === "approved").length;
  const disputedCount = sessions.filter((s) => s.status === "disputed").length;

  return (
    <div className="p-7">
      <PageHeader
        title="เซสชัน PT"
        subtitle="คุณบันทึกได้อย่างเดียวว่าเทรนแล้ว — การยืนยันหรือปฏิเสธเป็นสิทธิ์ของลูกค้าเท่านั้น"
        action={
          <Button variant="primary" onClick={() => setShowForm((s) => !s)} disabled={ptMembers.length === 0}>
            <Plus size={14} /> บันทึกเซสชัน
          </Button>
        }
      />

      {showForm && <LogSessionForm ptMembers={ptMembers} onClose={() => setShowForm(false)} />}

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
            <div>
              <div className="text-sm font-medium text-text-hi">{s.member?.name}</div>
              <div className="mt-0.5 text-[12.5px] text-text-faint">
                {s.session_date} เวลา {s.session_time?.slice(0, 5)} น. · เหลือ {s.member?.pt_remaining}/
                {s.member?.pt_total} ชม.
              </div>
            </div>
            {s.status === "pending" && <Badge tone="due">รอลูกค้ายืนยัน</Badge>}
            {s.status === "approved" && <Badge tone="active">ลูกค้ายืนยันแล้ว</Badge>}
            {s.status === "disputed" && <Badge tone="cancelled">ลูกค้าปฏิเสธ · รอทีมงานตรวจสอบ</Badge>}
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
