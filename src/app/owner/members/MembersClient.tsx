"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Plus, Mail, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { cycleMemberStatus } from "@/lib/actions/members";
import { inviteMemberAccount } from "@/lib/actions/accounts";
import { daysAgo } from "@/lib/format";
import { expiryLabel, expiryState, formatDateTh } from "@/lib/dates";
import type { Member, MemberStatus } from "@/types/database";

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "ใช้งานอยู่",
  frozen: "พักการใช้",
  cancelled: "ยกเลิก",
};

function InviteButton({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="cursor-pointer border-none bg-transparent text-[11.5px] text-text-faint hover:text-volt"
      >
        <Mail size={11} className="mr-1 inline" /> สร้างบัญชี
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="อีเมลลูกค้า"
        className="!w-40 py-1 text-xs"
      />
      <button
        disabled={pending || !email}
        onClick={() =>
          startTransition(async () => {
            const res = await inviteMemberAccount(memberId, email);
            if (res?.error) setError(res.error);
            else setOpen(false);
          })
        }
        className="cursor-pointer border-none bg-transparent text-xs text-mint disabled:opacity-40"
      >
        ส่งคำเชิญ
      </button>
      {error && <span className="text-[11px] text-coral">{error}</span>}
    </div>
  );
}

type Filter = "all" | "active" | "soon30" | "soon" | "expired" | "pt_low" | "none";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่หมดอายุ" },
  { key: "soon30", label: "เหลือไม่เกิน 30 วัน" },
  { key: "soon", label: "ใกล้หมดใน 7 วัน" },
  { key: "expired", label: "หมดอายุแล้ว" },
  { key: "pt_low", label: "PT ใกล้หมด" },
  { key: "none", label: "ยังไม่มีแพ็กเกจ" },
];

function matches(m: Member, filter: Filter) {
  const { state, daysLeft } = expiryState(m.membership_expires_on);
  if (filter === "active") return state === "ok" || state === "soon";
  if (filter === "soon30") return daysLeft !== null && daysLeft >= 0 && daysLeft <= 30;
  if (filter === "soon") return state === "soon";
  if (filter === "expired") return state === "expired";
  if (filter === "none") return state === "none";
  if (filter === "pt_low") return m.pt_total > 0 && m.pt_remaining <= 2;
  return true;
}

type SortKey = "name" | "plan" | "expiry" | "last_visit" | "pt" | "status";
const PAGE = 100;

// Empty values go last whichever way the column is sorted.
function sortValue(m: Member, key: SortKey): string | number | null {
  if (key === "name") return m.name.toLowerCase();
  if (key === "plan") return m.plan === "-" ? null : m.plan;
  if (key === "expiry") return m.membership_expires_on;
  if (key === "last_visit") return m.last_visit;
  if (key === "pt") return m.pt_total > 0 ? m.pt_remaining : null;
  return STATUS_LABEL[m.status];
}

export function MembersClient({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [plan, setPlan] = useState("");
  const [status, setStatus] = useState<MemberStatus | "">("");
  const [sort, setSort] = useState<{ key: SortKey; asc: boolean }>({ key: "name", asc: true });
  const [shown, setShown] = useState(PAGE);
  const [, startTransition] = useTransition();

  // Any change to what is listed starts again from the first page.
  const reset = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setShown(PAGE);
  };

  const plans = [...new Set(members.map((m) => m.plan).filter((p) => p && p !== "-"))].sort((a, b) => a.localeCompare(b, "th", { numeric: true }));
  const current = members.filter((m) => m.status !== "cancelled");
  const text = query.trim().toLowerCase();
  const filtered = members
    .filter(
      (m) =>
        (filter === "all" || m.status !== "cancelled") &&
        matches(m, filter) &&
        (!plan || m.plan === plan) &&
        (!status || m.status === status) &&
        (!text || m.name.toLowerCase().includes(text) || (m.phone ?? "").includes(text))
    )
    .sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
      const order = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "th", { numeric: true });
      return sort.asc ? order : -order;
    });
  const columns = "grid-cols-[1.5fr_1fr_1fr_0.8fr_0.7fr_1.1fr]";
  const heads: { key: SortKey; label: string }[] = [
    { key: "name", label: "ชื่อ" },
    { key: "plan", label: "แพ็กเกจ" },
    { key: "expiry", label: "อายุสมาชิก" },
    { key: "last_visit", label: "เข้าใช้ล่าสุด" },
    { key: "pt", label: "PT คงเหลือ" },
    { key: "status", label: "สถานะ / บัญชี" },
  ];

  return (
    <div className="p-4 sm:p-7">
      <PageHeader
        title="สมาชิก"
        subtitle={`${members.length.toLocaleString("th-TH")} คนทั้งหมด · กดชื่อเพื่อดูข้อมูล · กดหัวตารางเพื่อเรียง · ลูกค้าใหม่เพิ่มจากหน้าขาย`}
        action={
          <Link
            href="/owner/sell"
            className="inline-flex items-center gap-1.5 rounded-lg border border-volt bg-volt px-3.5 py-2 font-body text-[13.5px] font-semibold text-volt-ink no-underline hover:brightness-110"
          >
            <Plus size={14} /> ขายให้ลูกค้าใหม่
          </Link>
        }
      />

      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute top-2.5 left-2.5 text-text-faint" />
          <Input placeholder="ค้นหาชื่อหรือเบอร์โทร" value={query} onChange={(e) => reset(setQuery)(e.target.value)} className="pl-8" />
        </div>
        {FILTERS.map((f) => {
          const count = f.key === "all" ? members.length : current.filter((m) => matches(m, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => {
                reset(setFilter)(f.key);
                // Lists for calling people to renew read best with the soonest end date first.
                if (f.key === "active" || f.key === "soon30" || f.key === "soon") setSort({ key: "expiry", asc: true });
              }}
              aria-pressed={filter === f.key}
              className={`cursor-pointer rounded-full border px-3 py-1.5 font-body text-[12.5px] ${
                filter === f.key ? "border-volt bg-volt/10 font-semibold text-volt" : "border-border bg-transparent text-text-lo hover:text-text-hi"
              }`}
            >
              {f.label} {count.toLocaleString("th-TH")}
            </button>
          );
        })}
      </div>

      <div className="mb-3.5 flex flex-wrap items-center gap-2 text-[12.5px] text-text-lo">
        <span>กรอง</span>
        <Select value={plan} onChange={(e) => reset(setPlan)(e.target.value)} aria-label="กรองตามแพ็กเกจ" className="!w-auto max-w-[260px] py-1.5 text-[12.5px]">
          <option value="">ทุกแพ็กเกจ</option>
          {plans.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => reset(setStatus)(e.target.value as MemberStatus | "")} aria-label="กรองตามสถานะ" className="!w-auto py-1.5 text-[12.5px]">
          <option value="">ทุกสถานะ</option>
          {(Object.keys(STATUS_LABEL) as MemberStatus[]).map((key) => (
            <option key={key} value={key}>
              {STATUS_LABEL[key]}
            </option>
          ))}
        </Select>
        {(plan || status || filter !== "all" || text) && (
          <button
            onClick={() => {
              setPlan("");
              setStatus("");
              setFilter("all");
              setQuery("");
              setShown(PAGE);
            }}
            className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] text-volt underline"
          >
            ล้างตัวกรอง
          </button>
        )}
        <span className="ml-auto text-text-faint">พบ {filtered.length.toLocaleString("th-TH")} คน</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="min-w-[780px]">
          <div className={`grid ${columns} bg-panel px-4 py-2.5 text-xs text-text-faint`}>
            {heads.map((h) => (
              <button
                key={h.key}
                onClick={() => reset(setSort)({ key: h.key, asc: sort.key === h.key ? !sort.asc : true })}
                aria-label={`เรียงตาม${h.label}`}
                className={`flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left text-xs ${sort.key === h.key ? "font-semibold text-volt" : "text-text-faint hover:text-text-hi"}`}
              >
                {h.label}
                {sort.key === h.key ? sort.asc ? <ChevronUp size={12} /> : <ChevronDown size={12} /> : <ChevronsUpDown size={11} className="opacity-50" />}
              </button>
            ))}
          </div>
          {filtered.slice(0, shown).map((m) => {
            const expiry = expiryState(m.membership_expires_on);
            return (
              <div key={m.id} className={`grid ${columns} items-center border-t border-border bg-panel px-4 py-3`}>
                <div>
                  <Link href={`/owner/members/${m.id}`} className="block font-body text-[13.5px] font-medium text-text-hi no-underline hover:text-volt">
                    {m.name}
                  </Link>
                  {m.phone ? (
                    <a href={`tel:${m.phone.replace(/[^0-9+]/g, "")}`} className="text-xs text-text-lo no-underline hover:text-volt" title="กดเพื่อโทร">
                      {m.phone}
                    </a>
                  ) : (
                    <div className="text-xs text-text-faint">ไม่มีเบอร์โทร</div>
                  )}
                  {/* On a phone the expiry column is off screen, so repeat it here. */}
                  <div
                    className={`mt-0.5 text-xs sm:hidden ${
                      expiry.state === "expired" ? "text-coral" : expiry.state === "soon" ? "text-amber" : "text-text-faint"
                    }`}
                  >
                    {expiryLabel(m.membership_expires_on)}
                  </div>
                </div>
                <div className="text-[13px] text-text-lo">{m.plan}</div>
                <div>
                  <div
                    className={`text-[13px] ${
                      expiry.state === "expired" ? "text-coral" : expiry.state === "soon" ? "text-amber" : expiry.state === "ok" ? "text-text-hi" : "text-text-faint"
                    }`}
                  >
                    {expiryLabel(m.membership_expires_on)}
                  </div>
                  {m.membership_expires_on && <div className="text-xs text-text-faint">ถึง {formatDateTh(m.membership_expires_on)}</div>}
                </div>
                <div className={`text-[13px] ${Number.isFinite(daysAgo(m.last_visit)) && daysAgo(m.last_visit) >= 14 ? "text-coral" : "text-text-lo"}`}>
                  {Number.isFinite(daysAgo(m.last_visit)) ? `${daysAgo(m.last_visit)} วันก่อน` : "ยังไม่มีข้อมูล"}
                </div>
                <div className={`text-[13px] ${m.pt_total > 0 && m.pt_remaining <= 2 ? "text-amber" : "text-text-lo"}`}>
                  {m.pt_total > 0 ? `${m.pt_remaining}/${m.pt_total}` : "-"}
                </div>
                <div className="flex flex-col items-start gap-1.5">
                  <button
                    onClick={() => startTransition(async () => { await cycleMemberStatus(m.id, m.status); })}
                    title="กดเพื่อเปลี่ยนสถานะ"
                    className="cursor-pointer border-none bg-transparent p-0"
                  >
                    <Badge tone={m.status}>{STATUS_LABEL[m.status]}</Badge>
                  </button>
                  {!m.profile_id && <InviteButton memberId={m.id} />}
                  {m.profile_id && <span className="text-[11px] text-mint">มีบัญชีแล้ว</span>}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ไม่พบสมาชิก</div>}
        </div>
      </div>

      {filtered.length > shown && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Button onClick={() => setShown((n) => n + PAGE)}>แสดงเพิ่มอีก {Math.min(PAGE, filtered.length - shown)} คน</Button>
          <span className="text-[12.5px] text-text-faint">
            กำลังแสดง {shown.toLocaleString("th-TH")} จาก {filtered.length.toLocaleString("th-TH")} คน
          </span>
        </div>
      )}
    </div>
  );
}
