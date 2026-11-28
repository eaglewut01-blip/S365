import Link from "next/link";
import { SLOT_LABEL, WORK_HOURS, hourLabel } from "@/lib/labels";
import type { SlotKind } from "@/types/database";

export type GridSlot = { trainer_id: string; hour: number; kind: SlotKind; client_name?: string | null };

const CELL: Record<SlotKind, string> = {
  pt: "bg-volt/25 text-text-hi",
  trial: "bg-amber-bg text-amber",
  free: "bg-mint-bg text-mint",
  off: "bg-white/[0.04] text-text-faint",
};

// One day for the whole team, hour by hour: a column per trainer.
// `editBase` adds a "fill in for them" link under each name (managers only);
// `highlightId` marks the column of the person looking at it.
export function TeamDayGrid({
  team,
  slots,
  date,
  hourNow,
  editBase,
  highlightId,
}: {
  team: { id: string; full_name: string }[];
  slots: GridSlot[];
  date: string;
  hourNow: number | null;
  editBase?: string;
  highlightId?: string;
}) {
  const bySlot = new Map(slots.map((s) => [`${s.trainer_id}:${s.hour}`, s]));

  return (
    <>
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-text-lo">
        {(Object.keys(SLOT_LABEL) as SlotKind[]).map((kind) => (
          <span key={kind} className="inline-flex items-center gap-1.5">
            <span className={`inline-block h-3 w-3 rounded-sm ${CELL[kind]}`} /> {SLOT_LABEL[kind]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm border border-border" /> ยังไม่ลง
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse bg-panel text-left">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-[64px] bg-panel px-3 py-2.5 text-xs font-normal text-text-faint">
                เวลา
              </th>
              {team.map((t) => (
                <th key={t.id} scope="col" className={`min-w-[110px] border-l border-border px-2.5 py-2.5 font-body text-[13px] font-semibold ${t.id === highlightId ? "text-volt" : "text-text-hi"}`}>
                  {t.full_name}
                  {t.id === highlightId && <span className="ml-1.5 text-[11.5px] font-normal">(ฉัน)</span>}
                  {editBase && (
                    <Link href={`${editBase}/${t.id}?d=${date}`} className="ml-2 text-[12px] font-normal text-volt underline">
                      ลงหรือแก้ให้
                    </Link>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WORK_HOURS.map((hour) => (
              <tr key={hour} className={hour === hourNow ? "outline outline-1 -outline-offset-1 outline-volt" : ""}>
                <th scope="row" className="sticky left-0 z-10 border-t border-border bg-panel px-3 py-2 font-body text-[13px] font-semibold text-text-hi">
                  {hourLabel(hour)}
                </th>
                {team.map((t) => {
                  const slot = bySlot.get(`${t.id}:${hour}`);
                  return (
                    <td key={t.id} className="border-t border-l border-border p-1 align-top">
                      {slot ? (
                        <div className={`rounded-md px-2 py-1.5 text-[12.5px] leading-tight ${CELL[slot.kind]}`}>
                          <div className="font-semibold">{SLOT_LABEL[slot.kind]}</div>
                          {slot.client_name && <div className="mt-0.5 opacity-90">{slot.client_name}</div>}
                        </div>
                      ) : (
                        <div className="px-2 py-1.5 text-[12.5px] text-text-faint">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
