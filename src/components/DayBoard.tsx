"use client";

import { useState, useTransition } from "react";
import { fillEmptySlots, setTrainerSlot } from "@/lib/actions/trainer-slots";
import { SLOT_LABEL, WORK_HOURS, hourLabel } from "@/lib/labels";
import type { SlotKind, TrainerSlot } from "@/types/database";

export type BoardClient = { id: string; name: string; hoursLeft: number };
type Slot = { kind: SlotKind; client: string };

const ROW: Record<SlotKind | "none", string> = {
  none: "border-border bg-panel text-text-faint",
  pt: "border-volt bg-volt/15 text-text-hi",
  trial: "border-amber bg-amber-bg text-amber",
  free: "border-mint bg-mint-bg text-mint",
  off: "border-border bg-white/[0.04] text-text-faint",
};
const choice = "cursor-pointer rounded-lg border px-3 py-2.5 font-body text-[14px] font-semibold disabled:opacity-50";

// A trainer's day as a list of hours. Tap an hour, tap what it is; training
// a client offers the trainer's own clients to pick from. Each tap is saved.
export function DayBoard({ date, slots, clients, trainerId }: { date: string; slots: TrainerSlot[]; clients: BoardClient[]; trainerId?: string }) {
  const [day, setDay] = useState<Record<number, Slot | undefined>>(() =>
    Object.fromEntries(slots.map((s) => [s.hour, { kind: s.kind, client: s.client_name ?? "" }]))
  );
  const [open, setOpen] = useState<number | null>(null);
  // Which question the open hour is on: what kind, or which client.
  const [picking, setPicking] = useState<"pt" | "trial" | null>(null);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const close = () => {
    setOpen(null);
    setPicking(null);
    setTyped("");
  };

  const save = (hour: number, kind: SlotKind | null, client = "") => {
    const before = day[hour];
    setDay((d) => ({ ...d, [hour]: kind ? { kind, client } : undefined }));
    setError("");
    close();
    startTransition(async () => {
      const res = await setTrainerSlot({ date, hour, kind, clientName: client, trainerId });
      if (res.error) {
        setDay((d) => ({ ...d, [hour]: before }));
        setError(`บันทึกเวลา ${hourLabel(hour)} ไม่สำเร็จ: ${res.error}`);
      }
    });
  };

  const fill = (kind: "free" | "off") => {
    const before = day;
    setDay((d) => Object.fromEntries(WORK_HOURS.map((hour) => [hour, d[hour] ?? { kind, client: "" }])));
    setError("");
    startTransition(async () => {
      const res = await fillEmptySlots({ date, kind, trainerId });
      if (res.error) {
        setDay(before);
        setError(res.error);
      }
    });
  };

  const unfilled = WORK_HOURS.filter((hour) => !day[hour]).length;

  return (
    <div>
      <p className="mt-0 mb-3 text-[13px] text-text-lo">แตะช่วงเวลา แล้วแตะว่าเป็นอะไร ระบบบันทึกให้ทันที ไม่ต้องกดบันทึกอีก</p>

      {unfilled > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-text-lo">
          <span>ยังไม่ลง {unfilled} ช่อง</span>
          <button type="button" disabled={pending} onClick={() => fill("free")} className={`${choice} border-mint bg-transparent py-1.5 text-[12.5px] text-mint`}>
            ที่เหลือให้เป็นว่าง
          </button>
          <button type="button" disabled={pending} onClick={() => fill("off")} className={`${choice} border-border bg-transparent py-1.5 text-[12.5px] text-text-lo`}>
            ที่เหลือให้เป็นไม่อยู่
          </button>
        </div>
      )}
      {error && <div className="mb-3 text-[13px] text-coral">{error}</div>}

      <div className="flex flex-col gap-1.5">
        {WORK_HOURS.map((hour) => {
          const slot = day[hour];
          const isOpen = open === hour;
          return (
            <div key={hour}>
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => (isOpen ? close() : (setOpen(hour), setPicking(null), setTyped("")))}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-3 text-left ${ROW[slot?.kind ?? "none"]} ${isOpen ? "ring-2 ring-volt" : ""}`}
              >
                <span className="w-[52px] flex-shrink-0 font-body text-[15px] font-bold text-text-hi">{hourLabel(hour)}</span>
                <span className="min-w-0 flex-1 truncate font-body text-[14px] font-semibold">
                  {slot ? SLOT_LABEL[slot.kind] : "แตะเพื่อลง"}
                  {slot?.client ? <span className="font-normal"> · {slot.client}</span> : null}
                </span>
              </button>

              {isOpen && (
                <div className="mt-1.5 mb-2 rounded-lg border border-border-strong bg-panel-raised p-3">
                  {picking === null ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setPicking("pt")} className={`${choice} border-volt bg-volt text-volt-ink`}>
                        เทรนลูกค้า
                      </button>
                      <button type="button" onClick={() => save(hour, "free")} className={`${choice} border-mint bg-mint-bg text-mint`}>
                        ว่าง
                      </button>
                      <button type="button" onClick={() => setPicking("trial")} className={`${choice} border-amber bg-amber-bg text-amber`}>
                        เทสต์ลูกค้า
                      </button>
                      <button type="button" onClick={() => save(hour, "off")} className={`${choice} border-border bg-transparent text-text-lo`}>
                        ไม่อยู่
                      </button>
                      {slot && (
                        <button type="button" onClick={() => save(hour, null)} className="col-span-2 cursor-pointer border-none bg-transparent py-1 text-[12.5px] text-text-faint underline hover:text-coral">
                          ล้างช่องนี้
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-2 text-[13px] font-semibold text-text-hi">{picking === "pt" ? "เทรนใคร แตะชื่อลูกค้า" : "เทสต์ลูกค้าใหม่ พิมพ์ชื่อ (ไม่บังคับ)"}</div>
                      {picking === "pt" && (
                        <div className="mb-2.5 flex flex-wrap gap-2">
                          {clients.map((c) => (
                            <button key={c.id} type="button" onClick={() => save(hour, "pt", c.name)} className={`${choice} border-volt bg-transparent text-left text-text-hi hover:bg-volt/10`}>
                              {c.name} <span className="text-[12px] font-normal text-text-lo">เหลือ {c.hoursLeft} ชม.</span>
                            </button>
                          ))}
                          {clients.length === 0 && <span className="text-[12.5px] text-text-faint">ยังไม่มีลูกค้า PT ที่ระบุชื่อเทรนเนอร์คนนี้ พิมพ์ชื่อด้านล่างได้</span>}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <input
                          value={typed}
                          onChange={(e) => setTyped(e.target.value)}
                          placeholder={picking === "pt" ? "หรือพิมพ์ชื่อลูกค้าเอง" : "ชื่อลูกค้า"}
                          aria-label="ชื่อลูกค้า"
                          maxLength={80}
                          className="min-w-[150px] flex-1 rounded-lg border border-border bg-panel px-3 py-2 font-body text-[14px] text-text-hi outline-none placeholder:text-text-faint"
                        />
                        <button type="button" onClick={() => save(hour, picking, typed.trim())} disabled={picking === "pt" && !typed.trim()} className={`${choice} border-volt bg-volt text-volt-ink`}>
                          บันทึก
                        </button>
                        <button type="button" onClick={() => setPicking(null)} className={`${choice} border-border bg-transparent text-text-lo`}>
                          ย้อนกลับ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
