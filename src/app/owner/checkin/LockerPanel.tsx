"use client";

import { useState, useTransition } from "react";
import { KeyRound, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { lendLocker, returnLocker, setLockerCounts } from "@/lib/actions/lockers";
import { formatDateTh, formatTimeTh, todayBangkok } from "@/lib/dates";

export type Zone = "female" | "male";
export type LockerLoan = { id: string; zone: Zone; number: number; lentAt: string; memberId: string; memberName: string };
export type Person = { id: string; name: string };

export const ZONE_LABEL: Record<Zone, string> = { female: "หญิง", male: "ชาย" };
const ZONES: Zone[] = ["female", "male"];

// Lockers lent at the counter: who holds which key, lend one, take one back.
export function LockerPanel({
  loans,
  counts,
  people,
  recent,
  isOwner,
  notReady,
  picked,
  onPick,
}: {
  loans: LockerLoan[];
  counts: Record<Zone, number>;
  people: Person[];
  recent: Person[];
  isOwner: boolean;
  notReady: boolean;
  // The member a locker is being lent to; set from the check-in list too.
  picked: Person | null;
  onPick: (person: Person | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [zone, setZone] = useState<Zone | "">("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [female, setFemale] = useState(String(counts.female || ""));
  const [male, setMale] = useState(String(counts.male || ""));

  const lending = open || picked !== null;
  const taken = (z: Zone) => new Set(loans.filter((l) => l.zone === z).map((l) => l.number));
  const holding = new Set(loans.map((l) => l.memberId));
  const text = query.trim().toLowerCase();
  const found = text.length >= 2 ? people.filter((p) => p.name.toLowerCase().includes(text) && !holding.has(p.id)).slice(0, 8) : [];
  const today = todayBangkok();
  const dayOf = (instant: string) => new Date(new Date(instant).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);

  const close = () => {
    setOpen(false);
    onPick(null);
    setQuery("");
    setZone("");
    setNumber("");
    setError("");
  };
  const run = (work: () => Promise<{ error?: string; success?: boolean }>, after?: () => void) =>
    startTransition(async () => {
      const res = await work();
      setError(res.error ?? "");
      if (res.success) after?.();
    });
  const toggle = (on: boolean) => `cursor-pointer rounded-lg border px-4 py-2 text-[13.5px] font-semibold ${on ? "border-volt bg-volt text-volt-ink" : "border-border-strong bg-transparent text-text-hi hover:bg-white/5"}`;

  if (notReady) {
    return (
      <div className="mb-4 rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
        ล็อกเกอร์ยังใช้ไม่ได้ ต้องรันคำสั่งฐานข้อมูลรอบล่าสุดใน Supabase หนึ่งครั้งก่อน
      </div>
    );
  }

  return (
    <div id="lockers" className="mb-4 rounded-xl border border-border bg-panel p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="m-0 font-heading text-sm text-text-hi">ล็อกเกอร์</h3>
          <div className="mt-1 text-xs text-text-faint">
            {ZONES.map((z) => `${ZONE_LABEL[z]} ใช้อยู่ ${taken(z).size}${counts[z] ? ` จาก ${counts[z]}` : ""} ตู้`).join(" · ")}
          </div>
        </div>
        {!lending && (
          <Button variant="primary" onClick={() => setOpen(true)}>
            <KeyRound size={14} /> ให้ยืมล็อกเกอร์
          </Button>
        )}
      </div>

      {lending && (
        <div className="mt-3 rounded-lg border border-border-strong bg-panel-raised p-3.5">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] font-semibold text-text-hi">ให้ยืมล็อกเกอร์</div>
            <button type="button" onClick={close} aria-label="ปิด" className="cursor-pointer border-none bg-transparent p-0 text-text-faint">
              <X size={16} />
            </button>
          </div>

          <div className="mb-1 text-xs text-text-lo">1. ลูกค้า</div>
          {picked ? (
            <div className="mb-3 flex items-center gap-3 text-[14px] text-text-hi">
              <span className="font-semibold">{picked.name}</span>
              <button type="button" onClick={() => onPick(null)} className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] text-volt underline">
                เปลี่ยน
              </button>
            </div>
          ) : (
            <div className="mb-3">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="พิมพ์ชื่อลูกค้า หรือแตะชื่อคนที่เพิ่งเช็กอินด้านล่าง" aria-label="ค้นหาลูกค้าที่จะยืมล็อกเกอร์" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(text.length >= 2 ? found : recent.filter((p) => !holding.has(p.id)).slice(0, 8)).map((p) => (
                  <button key={p.id} type="button" onClick={() => onPick(p)} className="cursor-pointer rounded-full border border-border-strong bg-transparent px-3 py-1.5 text-[12.5px] text-text-hi hover:border-volt">
                    {p.name}
                  </button>
                ))}
                {text.length >= 2 && found.length === 0 && <span className="text-[12.5px] text-text-faint">ไม่พบ หรือลูกค้าคนนี้ยืมตู้อยู่แล้ว</span>}
              </div>
            </div>
          )}

          <div className="mb-1 text-xs text-text-lo">2. ตู้หญิงหรือตู้ชาย</div>
          <div className="mb-3 flex gap-2">
            {ZONES.map((z) => (
              <button
                key={z}
                type="button"
                aria-pressed={zone === z}
                onClick={() => {
                  setZone(z);
                  setNumber("");
                }}
                className={toggle(zone === z)}
              >
                {ZONE_LABEL[z]}
              </button>
            ))}
          </div>

          {zone && (
            <>
              <div className="mb-1 text-xs text-text-lo">3. เลขตู้</div>
              {counts[zone] > 0 ? (
                <div className="mb-3 grid grid-cols-6 gap-1.5 sm:grid-cols-10">
                  {Array.from({ length: counts[zone] }, (_, i) => i + 1).map((n) => {
                    const used = taken(zone).has(n);
                    const on = number === String(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={used}
                        aria-pressed={on}
                        aria-label={`ตู้${ZONE_LABEL[zone]} ${n}${used ? " มีคนยืมอยู่" : ""}`}
                        onClick={() => setNumber(String(n))}
                        className={`rounded-md border py-2 text-[13px] font-semibold tabular-nums ${
                          used ? "cursor-default border-coral bg-coral-bg text-coral line-through" : on ? "cursor-pointer border-volt bg-volt text-volt-ink" : "cursor-pointer border-border-strong bg-transparent text-text-hi hover:border-volt"
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <Input value={number} onChange={(e) => setNumber(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" placeholder="เลขตู้" aria-label="เลขตู้" className="mb-3 !w-32" />
              )}
            </>
          )}

          <Button
            variant="confirm"
            disabled={pending || !picked || !zone || !number}
            onClick={() => picked && zone && run(() => lendLocker(picked.id, zone, Number(number)), close)}
            className="px-5 py-2.5"
          >
            {pending ? "กำลังบันทึก..." : picked && zone && number ? `ให้ ${picked.name} ยืมตู้${ZONE_LABEL[zone]} ${number}` : "ยืนยัน"}
          </Button>
        </div>
      )}

      {error && <div className="mt-2.5 text-[13px] text-coral">{error}</div>}

      <div className="mt-3">
        {loans.length === 0 && <div className="text-[13px] text-text-faint">ตอนนี้ไม่มีตู้ที่ถูกยืม</div>}
        {loans.map((loan) => {
          const old = dayOf(loan.lentAt) !== today;
          return (
            <div key={loan.id} className="flex items-center justify-between gap-3 border-t border-border py-2 first:border-t-0">
              <span className="min-w-0 text-[13.5px] text-text-hi">
                <span className={`mr-2 inline-block min-w-[64px] rounded-md px-2 py-0.5 text-center text-[12.5px] font-semibold ${loan.zone === "female" ? "bg-coral-bg text-coral" : "bg-volt/15 text-volt"}`}>
                  {ZONE_LABEL[loan.zone]} {loan.number}
                </span>
                {loan.memberName}
                <span className={`ml-2 text-xs ${old ? "text-coral" : "text-text-faint"}`}>{old ? `ยังไม่คืน ยืมตั้งแต่ ${formatDateTh(dayOf(loan.lentAt))}` : `ยืม ${formatTimeTh(loan.lentAt)} น.`}</span>
              </span>
              <Button disabled={pending} onClick={() => run(() => returnLocker(loan.id))} className="flex-shrink-0 px-2.5 py-1.5 text-xs">
                รับคืน
              </Button>
            </div>
          );
        })}
      </div>

      {isOwner && (
        <details className="mt-3 border-t border-border pt-2.5">
          <summary className="cursor-pointer text-[12.5px] text-text-lo">ตั้งจำนวนตู้ (ตั้งแล้วเคาน์เตอร์จะแตะเลือกเลขตู้ได้ ไม่ต้องพิมพ์)</summary>
          <div className="mt-2 flex flex-wrap items-end gap-2">
            <label className="block">
              <span className="mb-1 block text-xs text-text-lo">ตู้หญิง (จำนวน)</span>
              <Input value={female} onChange={(e) => setFemale(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className="!w-28" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-text-lo">ตู้ชาย (จำนวน)</span>
              <Input value={male} onChange={(e) => setMale(e.target.value.replace(/\D/g, "").slice(0, 3))} inputMode="numeric" className="!w-28" />
            </label>
            <Button disabled={pending} onClick={() => run(() => setLockerCounts(Number(female || 0), Number(male || 0)))}>
              บันทึก
            </Button>
          </div>
        </details>
      )}
    </div>
  );
}
