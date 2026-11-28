"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { saveTrainerDay } from "@/lib/actions/trainer-slots";
import { SLOT_LABEL, WORK_HOURS, hourLabel } from "@/lib/labels";
import type { SlotKind, TrainerSlot } from "@/types/database";

type Row = { kind: SlotKind | ""; client: string };

const KIND_COLOR: Record<SlotKind | "", string> = {
  "": "border-border",
  pt: "border-volt",
  trial: "border-amber",
  free: "border-mint",
  off: "border-border opacity-60",
};

export function DayForm({ date, slots, trainerId }: { date: string; slots: TrainerSlot[]; trainerId?: string }) {
  const [rows, setRows] = useState<Record<number, Row>>(() =>
    Object.fromEntries(
      WORK_HOURS.map((hour) => {
        const slot = slots.find((s) => s.hour === hour);
        return [hour, { kind: slot?.kind ?? "", client: slot?.client_name ?? "" }];
      })
    )
  );
  const [message, setMessage] = useState<{ error?: string; success?: boolean }>({});
  const [pending, startTransition] = useTransition();

  const set = (hour: number, patch: Partial<Row>) => {
    setMessage({});
    setRows((prev) => ({ ...prev, [hour]: { ...prev[hour], ...patch } }));
  };
  const unfilled = WORK_HOURS.filter((hour) => !rows[hour].kind).length;

  return (
    <form action={(formData) => startTransition(async () => setMessage(await saveTrainerDay(formData)))}>
      <input type="hidden" name="work_date" value={date} />
      {trainerId && <input type="hidden" name="trainer_id" value={trainerId} />}

      <div className="mb-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={unfilled === 0}
          onClick={() => {
            setMessage({});
            setRows((prev) => Object.fromEntries(WORK_HOURS.map((hour) => [hour, prev[hour].kind ? prev[hour] : { kind: "free", client: "" }])));
          }}
        >
          ช่องที่ยังไม่ลง ให้เป็นว่าง
        </Button>
        <Button
          type="button"
          disabled={unfilled === 0}
          onClick={() => {
            setMessage({});
            setRows((prev) => Object.fromEntries(WORK_HOURS.map((hour) => [hour, prev[hour].kind ? prev[hour] : { kind: "off", client: "" }])));
          }}
        >
          ช่องที่ยังไม่ลง ให้เป็นไม่อยู่
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        {WORK_HOURS.map((hour) => {
          const row = rows[hour];
          const needsClient = row.kind === "pt" || row.kind === "trial";
          return (
            <div key={hour} className={`flex flex-wrap items-center gap-2 border-t border-l-[3px] border-t-border bg-panel px-3 py-2 first:border-t-0 ${KIND_COLOR[row.kind]}`}>
              <div className="w-[52px] font-body text-[14px] font-semibold text-text-hi">{hourLabel(hour)}</div>
              <Select
                name={`kind_${hour}`}
                value={row.kind}
                onChange={(e) => set(hour, { kind: e.target.value as SlotKind | "" })}
                aria-label={`สถานะเวลา ${hourLabel(hour)}`}
                className="!w-[132px] flex-shrink-0"
              >
                <option value="">ยังไม่ลง</option>
                {(Object.keys(SLOT_LABEL) as SlotKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {SLOT_LABEL[kind]}
                  </option>
                ))}
              </Select>
              {needsClient && (
                <Input
                  name={`client_${hour}`}
                  value={row.client}
                  onChange={(e) => set(hour, { client: e.target.value })}
                  placeholder="ชื่อลูกค้า"
                  aria-label={`ชื่อลูกค้าเวลา ${hourLabel(hour)}`}
                  className="!w-auto min-w-[120px] flex-1"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-3 flex items-center gap-3 border-t border-border bg-base px-4 py-3 sm:mx-0 sm:px-0">
        <Button type="submit" variant="primary" disabled={pending} className="px-6 py-2.5">
          {pending ? "กำลังบันทึก..." : "บันทึกตาราง"}
        </Button>
        {message.error && <span className="text-[12.5px] text-coral">{message.error}</span>}
        {message.success && <span className="text-[12.5px] text-mint">บันทึกแล้ว</span>}
        {!message.error && !message.success && unfilled > 0 && <span className="text-[12.5px] text-text-faint">ยังไม่ลง {unfilled} ช่อง</span>}
      </div>
    </form>
  );
}
