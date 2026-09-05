"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createStaffAccount } from "@/lib/actions/accounts";
import type { Profile } from "@/types/database";

export function TeamClient({ team }: { team: Profile[] }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | null, formData: FormData) =>
      createStaffAccount(formData),
    null
  );

  return (
    <div className="max-w-3xl p-7">
      <PageHeader title="ทีมงาน" subtitle="เชิญพนักงานหรือเทรนเนอร์เข้าระบบด้วยอีเมล — ระบบจะส่งลิงก์ให้ตั้งรหัสผ่านเอง" />

      <form action={formAction} className="mb-6 grid grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] gap-2.5 rounded-xl border border-border bg-panel p-[18px]">
        <Input name="email" type="email" placeholder="อีเมล" required />
        <Input name="full_name" placeholder="ชื่อ-นามสกุล" required />
        <Input name="phone" placeholder="เบอร์โทร" />
        <Select name="role" defaultValue="staff">
          <option value="staff">พนักงาน</option>
          <option value="trainer">เทรนเนอร์</option>
        </Select>
        <Button type="submit" variant="primary" disabled={pending}>
          <UserPlus size={14} /> เชิญ
        </Button>
      </form>
      {state?.error && <div className="mb-4 text-[12.5px] text-coral">{state.error}</div>}
      {state?.success && <div className="mb-4 text-[12.5px] text-mint">ส่งคำเชิญแล้ว</div>}

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[1.5fr_1fr_0.8fr] bg-panel px-4 py-2.5 text-xs text-text-faint">
          <div>ชื่อ</div>
          <div>เบอร์โทร</div>
          <div>บทบาท</div>
        </div>
        {team.map((t) => (
          <div key={t.id} className="grid grid-cols-[1.5fr_1fr_0.8fr] items-center border-t border-border bg-panel px-4 py-3">
            <div className="text-[13.5px] text-text-hi">{t.full_name}</div>
            <div className="text-[13px] text-text-lo">{t.phone ?? "-"}</div>
            <Badge tone={t.role === "trainer" ? "due" : "active"}>{t.role === "trainer" ? "เทรนเนอร์" : "พนักงาน"}</Badge>
          </div>
        ))}
        {team.length === 0 && (
          <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีทีมงาน</div>
        )}
      </div>
    </div>
  );
}
