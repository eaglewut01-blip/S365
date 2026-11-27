"use client";

import { useState, useTransition, useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { addMember, cycleMemberStatus } from "@/lib/actions/members";
import { inviteMemberAccount } from "@/lib/actions/accounts";
import { daysAgo } from "@/lib/format";
import { expiryLabel, expiryState, formatDateTh } from "@/lib/dates";
import type { Member, MemberStatus } from "@/types/database";

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "ใช้งานอยู่",
  frozen: "พักการใช้",
  cancelled: "ยกเลิก",
};

function AddMemberForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const res = await addMember(formData);
      // Go straight to the new member's page to record what they bought.
      if (res?.success && res.id) router.push(`/owner/members/${res.id}`);
      return res ?? null;
    },
    null
  );

  return (
    <div className="mb-4 rounded-xl border border-border bg-panel-raised p-[18px]">
      <div className="mb-3 flex justify-between">
        <h3 className="m-0 font-heading text-[15px] text-text-hi">เพิ่มสมาชิกใหม่</h3>
        <button onClick={onClose} aria-label="ปิด" className="cursor-pointer border-none bg-transparent text-text-faint">
          <X size={16} />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.3fr_1fr_auto]">
        <Input name="name" placeholder="ชื่อ-นามสกุล" required />
        <Input name="phone" type="tel" inputMode="tel" placeholder="เบอร์โทร (ใช้ตอนสแกนเช็กอิน)" />
        <Button type="submit" variant="primary" disabled={pending}>
          <Plus size={14} /> เพิ่ม แล้วเลือกแพ็กเกจ
        </Button>
      </form>
      {state?.error && <div className="mt-2 text-[12.5px] text-coral">{state.error}</div>}
    </div>
  );
}

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
        className="w-40 py-1 text-xs"
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

type Filter = "all" | "soon" | "expired" | "pt_low" | "none";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "soon", label: "ใกล้หมดใน 7 วัน" },
  { key: "expired", label: "หมดอายุแล้ว" },
  { key: "pt_low", label: "PT ใกล้หมด" },
  { key: "none", label: "ยังไม่มีแพ็กเกจ" },
];

function matches(m: Member, filter: Filter) {
  const { state } = expiryState(m.membership_expires_on);
  if (filter === "soon") return state === "soon";
  if (filter === "expired") return state === "expired";
  if (filter === "none") return state === "none";
  if (filter === "pt_low") return m.pt_total > 0 && m.pt_remaining <= 2;
  return true;
}

export function MembersClient({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const current = members.filter((m) => m.status !== "cancelled");
  const filtered = members.filter(
    (m) =>
      (filter === "all" || m.status !== "cancelled") &&
      matches(m, filter) &&
      (m.name.toLowerCase().includes(query.toLowerCase()) || (m.phone ?? "").includes(query))
  );
  const columns = "grid-cols-[1.5fr_1fr_1fr_0.8fr_0.7fr_1.1fr]";

  return (
    <div className="p-4 sm:p-7">
      <PageHeader
        title="สมาชิก"
        subtitle={`${members.length} คนทั้งหมด · กดชื่อเพื่อดูข้อมูลและบันทึกการซื้อแพ็กเกจ`}
        action={
          <Button variant="primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> เพิ่มสมาชิก
          </Button>
        }
      />

      {showForm && <AddMemberForm onClose={() => setShowForm(false)} />}

      <div className="mb-3.5 flex flex-wrap items-center gap-2">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute top-2.5 left-2.5 text-text-faint" />
          <Input placeholder="ค้นหาชื่อหรือเบอร์โทร" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        {FILTERS.map((f) => {
          const count = f.key === "all" ? members.length : current.filter((m) => matches(m, f.key)).length;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`cursor-pointer rounded-full border px-3 py-1.5 font-body text-[12.5px] ${
                filter === f.key ? "border-volt bg-volt/10 font-semibold text-volt" : "border-border bg-transparent text-text-lo hover:text-text-hi"
              }`}
            >
              {f.label} {count}
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="min-w-[780px]">
          <div className={`grid ${columns} bg-panel px-4 py-2.5 text-xs text-text-faint`}>
            <div>ชื่อ</div>
            <div>แพ็กเกจ</div>
            <div>อายุสมาชิก</div>
            <div>เข้าใช้ล่าสุด</div>
            <div>PT คงเหลือ</div>
            <div>สถานะ / บัญชี</div>
          </div>
          {filtered.map((m) => {
            const expiry = expiryState(m.membership_expires_on);
            return (
              <div key={m.id} className={`grid ${columns} items-center border-t border-border bg-panel px-4 py-3`}>
                <Link href={`/owner/members/${m.id}`} className="block no-underline hover:[&>div:first-child]:text-volt">
                  <div className="font-body text-[13.5px] font-medium text-text-hi">{m.name}</div>
                  <div className="text-xs text-text-faint">{m.phone ?? "ไม่มีเบอร์โทร"}</div>
                  {/* On a phone the expiry column is off screen, so repeat it here. */}
                  <div
                    className={`mt-0.5 text-xs sm:hidden ${
                      expiry.state === "expired" ? "text-coral" : expiry.state === "soon" ? "text-amber" : "text-text-faint"
                    }`}
                  >
                    {expiryLabel(m.membership_expires_on)}
                  </div>
                </Link>
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
                <div className={`text-[13px] ${daysAgo(m.last_visit) >= 14 ? "text-coral" : "text-text-lo"}`}>
                  {Number.isFinite(daysAgo(m.last_visit)) ? `${daysAgo(m.last_visit)} วันก่อน` : "ยังไม่เคยมา"}
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
    </div>
  );
}
