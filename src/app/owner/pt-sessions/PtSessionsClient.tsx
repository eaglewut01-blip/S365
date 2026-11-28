"use client";

import { useMemo, useState, useTransition } from "react";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { SignatureView } from "@/components/SignatureView";
import { resolvePtDispute, voidPtSession } from "@/lib/actions/pt-sessions";
import { formatDateTh } from "@/lib/dates";
import type { PtStatus } from "@/types/database";

export type PtSessionRow = {
  id: string;
  date: string;
  time: string;
  status: PtStatus;
  signature: string | null;
  member: { name: string; pt_total: number; pt_remaining: number };
  trainerName: string;
};

export function PtSessionsClient({ sessions }: { sessions: PtSessionRow[] }) {
  const [pending, startTransition] = useTransition();
  const [trainer, setTrainer] = useState("");
  const [error, setError] = useState("");

  const done = useMemo(() => sessions.filter((s) => s.status === "approved"), [sessions]);
  const perTrainer = useMemo(() => {
    const totals = new Map<string, { hours: number; clients: Set<string> }>();
    for (const s of done) {
      const entry = totals.get(s.trainerName) ?? { hours: 0, clients: new Set<string>() };
      entry.hours += 1;
      entry.clients.add(s.member.name);
      totals.set(s.trainerName, entry);
    }
    return [...totals.entries()].map(([name, t]) => ({ name, hours: t.hours, clients: t.clients.size })).sort((a, b) => b.hours - a.hours);
  }, [done]);
  const shown = trainer ? sessions.filter((s) => s.trainerName === trainer) : sessions;
  const waiting = sessions.filter((s) => s.status !== "approved").length;

  const cancel = (s: PtSessionRow) => {
    if (!window.confirm(`ยกเลิกเซสชันของ ${s.member.name} วันที่ ${formatDateTh(s.date)} และคืน 1 ชั่วโมงให้ลูกค้า`)) return;
    setError("");
    startTransition(async () => {
      const res = await voidPtSession(s.id);
      if (res.error) setError(res.error);
    });
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-3.5">
        <StatTile label="เทรนแล้วเดือนนี้ (ชั่วโมง)" value={done.length} tone="mint" />
        <StatTile label="ลูกค้าที่มาเทรน (คน)" value={new Set(done.map((s) => s.member.name)).size} />
        {waiting > 0 && <StatTile label="รอตรวจสอบ" value={waiting} tone="amber" />}
      </div>

      {perTrainer.length > 0 && (
        <div className="mb-5 overflow-x-auto rounded-xl border border-border bg-panel">
          <table className="w-full min-w-[360px] border-collapse text-[13.5px]">
            <thead>
              <tr className="text-left text-[12px] text-text-lo">
                <th className="px-4 py-2.5 font-medium">เทรนเนอร์</th>
                <th className="px-4 py-2.5 text-right font-medium">เทรนไป (ชั่วโมง)</th>
                <th className="px-4 py-2.5 text-right font-medium">ลูกค้า (คน)</th>
              </tr>
            </thead>
            <tbody>
              {perTrainer.map((t) => (
                <tr key={t.name} className="border-t border-border">
                  <td className="px-4 py-2.5 text-text-hi">{t.name || "ไม่ระบุ"}</td>
                  <td className="px-4 py-2.5 text-right text-text-hi tabular-nums">{t.hours}</td>
                  <td className="px-4 py-2.5 text-right text-text-lo tabular-nums">{t.clients}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {perTrainer.length > 1 && (
        <div className="mb-3">
          <Select value={trainer} onChange={(e) => setTrainer(e.target.value)} aria-label="กรองตามเทรนเนอร์" className="!w-auto">
            <option value="">เทรนเนอร์ทุกคน</option>
            {perTrainer.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      {error && <div className="mb-3 text-[13px] text-coral">{error}</div>}

      <div className="flex flex-col gap-2.5">
        {shown.map((s) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-panel px-4 py-3">
            <div className="min-w-[180px] flex-1">
              <div className="text-sm font-medium text-text-hi">{s.member.name}</div>
              <div className="mt-0.5 text-[12.5px] text-text-faint">
                {s.trainerName} · {formatDateTh(s.date)} เวลา {s.time} น. · เหลือ {s.member.pt_remaining}/{s.member.pt_total} ชม.
              </div>
            </div>
            <SignatureView signature={s.signature} />
            {s.status === "approved" && <Badge tone="active">{s.signature ? "ลูกค้าเซ็นแล้ว" : "ยืนยันแล้ว"}</Badge>}
            {s.status === "pending" && <Badge tone="due">รอยืนยัน</Badge>}
            {s.status === "disputed" && <Badge tone="cancelled">ลูกค้าปฏิเสธ</Badge>}
            {s.status !== "approved" && (
              <Button disabled={pending} onClick={() => startTransition(async () => void (await resolvePtDispute(s.id, "approved")))} className="px-2.5 py-1.5 text-xs">
                ยืนยันแทน (ตัดชั่วโมง)
              </Button>
            )}
            <Button variant="ghost" disabled={pending} onClick={() => cancel(s)} className="px-2.5 py-1.5 text-xs">
              ยกเลิก คืนชั่วโมง
            </Button>
          </div>
        ))}
        {shown.length === 0 && <div className="rounded-xl border border-border bg-panel p-6 text-center text-[13.5px] text-text-faint">เดือนนี้ยังไม่มีเซสชัน</div>}
      </div>
    </div>
  );
}
