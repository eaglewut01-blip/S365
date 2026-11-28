"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { assignPtTrainer, linkLegacyTrainers } from "@/lib/actions/purchases";
import { PT_LOW_HOURS } from "@/lib/labels";

export type PtClient = { id: string; name: string; phone: string | null; total: number; left: number; trainerId: string | null; legacyTrainer: string | null };
export type TrainerCard = { id: string; name: string; busy: string[]; free: string[]; filled: boolean };

const PAGE = 100;
const NO_TRAINER = "__none__";

function TrainerSelect({ client, trainers }: { client: PtClient; trainers: TrainerCard[] }) {
  const [value, setValue] = useState(client.trainerId ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div>
      <Select
        value={value}
        disabled={pending || trainers.length === 0}
        aria-label={`เทรนเนอร์ของ ${client.name}`}
        onChange={(e) => {
          const next = e.target.value;
          const before = value;
          setValue(next);
          startTransition(async () => {
            const res = await assignPtTrainer(client.id, next);
            if (res.error) {
              setValue(before);
              setError(res.error);
            } else setError("");
          });
        }}
        className="!w-auto min-w-[130px] py-1.5 text-[12.5px]"
      >
        <option value="">{client.legacyTrainer ? `${client.legacyTrainer} (ระบบเดิม)` : "ยังไม่ระบุ"}</option>
        {trainers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </Select>
      {error && <div className="text-[11px] text-coral">{error}</div>}
    </div>
  );
}

// Every PT client in one table. Pick a trainer to see their clients, pick
// "about to run out" to get a list to call.
export function ClientsTable({ clients, trainers }: { clients: PtClient[]; trainers: TrainerCard[] }) {
  const [trainer, setTrainer] = useState("");
  const [hours, setHours] = useState<"left" | "low" | "out" | "all">("left");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [linkMessage, setLinkMessage] = useState("");
  const [pending, startTransition] = useTransition();

  // A client belongs to the trainer's account if set, else to the name from the previous system.
  const names = new Map(trainers.map((t) => [t.id, t.name]));
  const groupOf = (c: PtClient) => (c.trainerId && names.has(c.trainerId) ? `id:${c.trainerId}` : c.legacyTrainer ? `old:${c.legacyTrainer}` : NO_TRAINER);
  const labelOf = (key: string) => (key === NO_TRAINER ? "ยังไม่ระบุเทรนเนอร์" : key.startsWith("id:") ? names.get(key.slice(3)) ?? "" : `${key.slice(4)} (ระบบเดิม)`);
  const matchHours = (c: PtClient, mode: typeof hours) => (mode === "all" ? true : mode === "out" ? c.left === 0 : mode === "low" ? c.left > 0 && c.left <= PT_LOW_HOURS : c.left > 0);

  const groups = new Map<string, PtClient[]>();
  for (const c of clients) groups.set(groupOf(c), [...(groups.get(groupOf(c)) ?? []), c]);
  const groupKeys = [...groups.keys()].sort((a, b) => (a === NO_TRAINER ? 1 : b === NO_TRAINER ? -1 : labelOf(a).localeCompare(labelOf(b), "th")));

  const text = query.trim().toLowerCase();
  const list = clients
    .filter((c) => (!trainer || groupOf(c) === trainer) && matchHours(c, hours) && (!text || c.name.toLowerCase().includes(text) || (c.phone ?? "").includes(text)))
    .sort((a, b) => a.left - b.left || a.name.localeCompare(b.name, "th"));
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setShown(PAGE);
  };
  const canLink = trainers.length > 0 && clients.some((c) => !c.trainerId && c.legacyTrainer);

  return (
    <>
      <h2 className="m-0 mb-2.5 font-heading text-[15px] text-text-hi">สรุปตามเทรนเนอร์ กดแถวเพื่อดูรายชื่อลูกค้า</h2>
      <div className="mb-6 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[620px] border-collapse bg-panel text-left text-[13px]">
          <thead>
            <tr className="text-xs text-text-faint">
              <th scope="col" className="px-4 py-2.5 font-normal">เทรนเนอร์</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">ลูกค้าในมือ</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">ใกล้หมด</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">หมดแล้ว</th>
              <th scope="col" className="px-4 py-2.5 font-normal">ตารางวันนี้</th>
            </tr>
          </thead>
          <tbody>
            {groupKeys.map((key) => {
              const mine = groups.get(key) ?? [];
              const card = key.startsWith("id:") ? trainers.find((t) => t.id === key.slice(3)) : undefined;
              const active = trainer === key;
              return (
                <tr
                  key={key}
                  onClick={() => reset(setTrainer)(active ? "" : key)}
                  className={`cursor-pointer border-t border-border ${active ? "bg-volt/10" : "hover:bg-white/[0.03]"}`}
                >
                  <th scope="row" className={`px-4 py-2.5 font-medium ${key === NO_TRAINER ? "text-amber" : "text-text-hi"}`}>{labelOf(key)}</th>
                  <td className="px-3 py-2.5 text-right text-text-hi tabular-nums">{mine.filter((c) => c.left > 0).length}</td>
                  <td className="px-3 py-2.5 text-right text-amber tabular-nums">{mine.filter((c) => matchHours(c, "low")).length}</td>
                  <td className="px-3 py-2.5 text-right text-coral tabular-nums">{mine.filter((c) => c.left === 0).length}</td>
                  <td className="px-4 py-2.5 text-[12.5px] text-text-lo">
                    {!card ? "-" : !card.filled ? <span className="text-amber">ยังไม่ลงตาราง</span> : card.free.length ? <span className="text-mint">ว่าง {card.free.join(", ")}</span> : `ติดลูกค้า ${card.busy.length} ชม. ไม่มีช่องว่าง`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12.5px] text-text-lo">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute top-2.5 left-2.5 text-text-faint" />
          <Input placeholder="ค้นหาชื่อหรือเบอร์โทร" value={query} onChange={(e) => reset(setQuery)(e.target.value)} className="pl-8" />
        </div>
        <Select value={trainer} onChange={(e) => reset(setTrainer)(e.target.value)} aria-label="กรองตามเทรนเนอร์" className="!w-auto py-1.5 text-[12.5px]">
          <option value="">เทรนเนอร์ทุกคน</option>
          {groupKeys.map((key) => (
            <option key={key} value={key}>
              {labelOf(key)}
            </option>
          ))}
        </Select>
        <Select value={hours} onChange={(e) => reset(setHours)(e.target.value as typeof hours)} aria-label="กรองตามชั่วโมงที่เหลือ" className="!w-auto py-1.5 text-[12.5px]">
          <option value="left">ยังมีชั่วโมงเหลือ</option>
          <option value="low">ใกล้หมด (เหลือไม่เกิน {PT_LOW_HOURS} ชม.)</option>
          <option value="out">ชั่วโมงหมดแล้ว</option>
          <option value="all">ทั้งหมด</option>
        </Select>
        <span className="ml-auto text-text-faint">พบ {list.length.toLocaleString("th-TH")} คน</span>
      </div>

      {canLink && (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-panel px-4 py-3 text-[12.5px] text-text-lo">
          <span>ลูกค้าที่ขึ้นว่า (ระบบเดิม) ยังไม่ได้ผูกกับบัญชีเทรนเนอร์ กดปุ่มนี้เพื่อผูกให้เทรนเนอร์ที่ชื่อตรงกัน</span>
          <Button
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await linkLegacyTrainers();
                setLinkMessage(res.error ?? `ผูกแล้ว ${res.linked ?? 0} คน`);
              })
            }
          >
            ผูกลูกค้าให้เทรนเนอร์
          </Button>
          {linkMessage && <span className="text-text-hi">{linkMessage}</span>}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] border-collapse bg-panel text-left text-[13px] text-text-lo">
          <thead>
            <tr className="text-xs text-text-faint">
              <th scope="col" className="px-4 py-2.5 font-normal">ลูกค้า</th>
              <th scope="col" className="px-4 py-2.5 font-normal">เบอร์โทร</th>
              <th scope="col" className="px-4 py-2.5 text-right font-normal">เหลือ / ซื้อ (ชม.)</th>
              <th scope="col" className="px-4 py-2.5 font-normal">เทรนเนอร์</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, shown).map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-2.5">
                  <Link href={`/owner/members/${c.id}`} className="font-medium text-text-hi no-underline hover:text-volt">
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5">
                  {c.phone ? (
                    <a href={`tel:${c.phone.replace(/[^0-9+]/g, "")}`} className="text-text-lo no-underline hover:text-volt">
                      {c.phone}
                    </a>
                  ) : (
                    <span className="text-text-faint">ไม่มีเบอร์โทร</span>
                  )}
                </td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${c.left === 0 ? "text-coral" : c.left <= PT_LOW_HOURS ? "text-amber" : "text-text-hi"}`}>
                  {c.left} / {c.total}
                </td>
                <td className="px-4 py-2">
                  <TrainerSelect client={c} trainers={trainers} />
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={4} className="px-4 py-6 text-center text-text-faint">ไม่มีลูกค้าตามที่เลือก</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {list.length > shown && (
        <div className="mt-3">
          <Button onClick={() => setShown((n) => n + PAGE)}>แสดงเพิ่มอีก {Math.min(PAGE, list.length - shown)} คน</Button>
        </div>
      )}
    </>
  );
}
