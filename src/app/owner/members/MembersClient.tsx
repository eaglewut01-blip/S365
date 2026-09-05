"use client";

import { useState, useTransition, useActionState } from "react";
import { Search, Plus, X, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { addMember, cycleMemberStatus } from "@/lib/actions/members";
import { inviteMemberAccount } from "@/lib/actions/accounts";
import { daysAgo } from "@/lib/format";
import type { Member, MemberStatus } from "@/types/database";

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "ใช้งานอยู่",
  frozen: "พักการใช้",
  cancelled: "ยกเลิก",
};

function AddMemberForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | null, formData: FormData) => {
      const res = await addMember(formData);
      if (res?.success) onClose();
      return res ?? null;
    },
    null
  );

  return (
    <div className="mb-4 rounded-xl border border-border bg-panel-raised p-[18px]">
      <div className="mb-3 flex justify-between">
        <h3 className="m-0 font-heading text-[15px] text-text-hi">เพิ่มสมาชิกใหม่</h3>
        <button onClick={onClose} className="cursor-pointer border-none bg-transparent text-text-faint">
          <X size={16} />
        </button>
      </div>
      <form action={formAction} className="grid grid-cols-[1.3fr_1fr_1fr_auto] gap-2.5">
        <Input name="name" placeholder="ชื่อ-นามสกุล" required />
        <Input name="phone" placeholder="เบอร์โทร" />
        <Select name="plan" defaultValue="8x / month">
          <option>Unlimited</option>
          <option>8x / month</option>
          <option>Drop-in x12</option>
        </Select>
        <Button type="submit" variant="primary" disabled={pending}>
          <Plus size={14} /> เพิ่ม
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

export function MembersClient({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [, startTransition] = useTransition();

  const filtered = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      (m.phone ?? "").includes(query)
  );

  return (
    <div className="p-7">
      <PageHeader
        title="สมาชิก"
        subtitle={`${members.length} คนทั้งหมด · คลิกสถานะเพื่อเปลี่ยน`}
        action={
          <Button variant="primary" onClick={() => setShowForm((s) => !s)}>
            <Plus size={14} /> เพิ่มสมาชิก
          </Button>
        }
      />

      {showForm && <AddMemberForm onClose={() => setShowForm(false)} />}

      <div className="relative mb-3.5 max-w-xs">
        <Search size={15} className="absolute top-2.5 left-2.5 text-text-faint" />
        <Input
          placeholder="ค้นหาชื่อหรือเบอร์โทร"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.5fr_0.9fr_0.9fr_0.8fr_0.8fr_1.1fr] bg-panel px-4 py-2.5 text-xs text-text-faint">
          <div>ชื่อ</div>
          <div>แพ็กเกจ</div>
          <div>เข้าใช้ล่าสุด</div>
          <div>เข้าใช้ทั้งหมด</div>
          <div>PT คงเหลือ</div>
          <div>สถานะ / บัญชี</div>
        </div>
        {filtered.map((m) => (
          <div
            key={m.id}
            className="grid grid-cols-[1.5fr_0.9fr_0.9fr_0.8fr_0.8fr_1.1fr] items-center border-t border-border bg-panel px-4 py-3"
          >
            <div>
              <div className="font-body text-[13.5px] font-medium text-text-hi">{m.name}</div>
              <div className="text-xs text-text-faint">{m.phone ?? "-"}</div>
            </div>
            <div className="text-[13px] text-text-lo">{m.plan}</div>
            <div className={`text-[13px] ${daysAgo(m.last_visit) >= 14 ? "text-coral" : "text-text-lo"}`}>
              {Number.isFinite(daysAgo(m.last_visit)) ? `${daysAgo(m.last_visit)} วันก่อน` : "ยังไม่เคยมา"}
            </div>
            <div className="text-[13px] text-text-lo">{m.visit_count}</div>
            <div className={`text-[13px] ${m.pt_total > 0 && m.pt_remaining <= 2 ? "text-amber" : "text-text-lo"}`}>
              {m.pt_total > 0 ? `${m.pt_remaining}/${m.pt_total}` : "-"}
            </div>
            <div className="flex flex-col items-start gap-1.5">
              <button
                onClick={() => startTransition(async () => { await cycleMemberStatus(m.id, m.status); })}
                className="cursor-pointer border-none bg-transparent p-0"
              >
                <Badge tone={m.status}>{STATUS_LABEL[m.status]}</Badge>
              </button>
              {!m.profile_id && <InviteButton memberId={m.id} />}
              {m.profile_id && <span className="text-[11px] text-mint">มีบัญชีแล้ว</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ไม่พบสมาชิก</div>
        )}
      </div>
    </div>
  );
}
