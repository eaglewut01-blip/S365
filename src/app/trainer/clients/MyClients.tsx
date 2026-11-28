"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Phone, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { expiryLabel, expiryState } from "@/lib/dates";
import { PT_LOW_HOURS } from "@/lib/labels";

export type MyClient = { id: string; name: string; phone: string | null; total: number; left: number; expiresOn: string | null; lastVisit: string | null };

type Filter = "all" | "active" | "low" | "out";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังมีชั่วโมง" },
  { key: "low", label: "ใกล้หมด" },
  { key: "out", label: "หมดแล้ว" },
];
const matches: Record<Filter, (c: MyClient) => boolean> = {
  all: () => true,
  active: (c) => c.left > 0,
  low: (c) => c.left > 0 && c.left <= PT_LOW_HOURS,
  out: (c) => c.left <= 0,
};

export function MyClients({ clients, loadError }: { clients: MyClient[]; loadError?: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, "");
    return clients
      .filter(matches[filter])
      .filter((c) => !q || c.name.toLowerCase().includes(q) || (digits.length >= 3 && (c.phone ?? "").replace(/\D/g, "").includes(digits)))
      .sort((a, b) => (a.left > 0 ? 0 : 1) - (b.left > 0 ? 0 : 1) || a.left - b.left || a.name.localeCompare(b.name, "th"));
  }, [clients, filter, query]);

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-7">
      <h1 className="m-0 mb-1 font-heading text-2xl font-bold text-text-hi">ลูกค้าของฉัน</h1>
      <p className="mt-0 mb-4 text-[13.5px] text-text-lo">เฉพาะลูกค้า PT ที่ผูกกับชื่อคุณ แตะชื่อเพื่อดูรายละเอียด แตะเบอร์เพื่อโทร</p>

      {loadError && <div className="mb-4 rounded-xl border border-coral bg-coral-bg px-4 py-3 text-[13.5px] leading-relaxed text-text-hi">โหลดรายชื่อลูกค้าไม่ได้ แจ้งเจ้าของยิมพร้อมข้อความนี้: {loadError}</div>}

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = clients.filter(matches[f.key]).length;
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.key)}
              className={`cursor-pointer rounded-full border px-3.5 py-2 text-[13px] font-semibold ${on ? "border-volt bg-volt text-volt-ink" : "border-border bg-panel text-text-lo"}`}
            >
              {f.label} {count}
            </button>
          );
        })}
      </div>

      <label className="relative mb-4 block">
        <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-faint" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ค้นหาชื่อหรือเบอร์โทร" aria-label="ค้นหาชื่อหรือเบอร์โทร" className="!py-3 !pl-9 !text-[15px]" />
      </label>

      <div className="flex flex-col gap-2">
        {shown.map((c) => {
          const membership = expiryState(c.expiresOn);
          return (
            <div key={c.id} className="flex items-stretch overflow-hidden rounded-xl border border-border bg-panel">
              <Link href={`/trainer/clients/${c.id}`} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 no-underline hover:bg-white/5">
                <span className="min-w-0">
                  <span className="block truncate text-[15.5px] font-semibold text-text-hi">{c.name}</span>
                  <span className={`mt-0.5 block text-[13px] ${c.left <= 0 ? "text-coral" : c.left <= PT_LOW_HOURS ? "text-amber" : "text-text-lo"}`}>
                    PT เหลือ {c.left} จาก {c.total} ชั่วโมง
                  </span>
                  <span className={`block text-[12.5px] ${membership.state === "expired" || membership.state === "none" ? "text-coral" : membership.state === "soon" ? "text-amber" : "text-text-faint"}`}>
                    สมาชิกรายเดือน {expiryLabel(c.expiresOn)}
                  </span>
                </span>
                <ChevronRight size={18} className="flex-shrink-0 text-text-faint" />
              </Link>
              {c.phone && (
                <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} aria-label={`โทรหา ${c.name}`} className="flex w-14 flex-shrink-0 items-center justify-center border-l border-border text-volt hover:bg-white/5">
                  <Phone size={18} />
                </a>
              )}
            </div>
          );
        })}
        {shown.length === 0 && (
          <div className="rounded-xl border border-border bg-panel p-6 text-center text-[13.5px] leading-relaxed text-text-faint">
            {clients.length === 0
              ? "ยังไม่มีลูกค้าที่ผูกกับชื่อคุณ ลูกค้าจะมาอยู่ที่นี่เมื่อเซ็นรับการเทรนกับคุณครั้งแรก เมื่อขาย PT โดยเลือกคุณเป็นเทรนเนอร์ หรือเมื่อเจ้าของผูกให้"
              : "ไม่พบลูกค้าตามที่เลือก"}
          </div>
        )}
      </div>
    </div>
  );
}
