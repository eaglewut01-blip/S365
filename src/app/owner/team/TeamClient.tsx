"use client";

import { useActionState, useState, useTransition } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createStaffAccount, createStaffLogin, createStaffLoginsBulk, setStaffPassword } from "@/lib/actions/accounts";
import type { Profile } from "@/types/database";

type Message = { error?: string; success?: boolean } | null;

function PasswordButton({ userId, name }: { userId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<Message>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[12.5px] text-text-lo hover:text-volt">
        <KeyRound size={12} /> ตั้งรหัสผ่านใหม่
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="รหัสผ่านใหม่"
        aria-label={`รหัสผ่านใหม่ของ ${name}`}
        autoComplete="off"
        className="w-36 py-1 text-xs"
      />
      <button
        disabled={pending || password.length < 6}
        onClick={() =>
          startTransition(async () => {
            const res = await setStaffPassword(userId, password);
            setMessage(res);
            if (res.success) setPassword("");
          })
        }
        className="cursor-pointer border-none bg-transparent text-xs font-semibold text-mint disabled:opacity-40"
      >
        บันทึก
      </button>
      {message?.error && <span className="text-[11px] text-coral">{message.error}</span>}
      {message?.success && <span className="text-[11px] text-mint">เปลี่ยนแล้ว</span>}
    </div>
  );
}

export function TeamClient({ team, logins, adminProblem }: { team: Profile[]; logins: Record<string, string>; adminProblem: string }) {
  const [login, loginAction, loginPending] = useActionState(async (_prev: Message, formData: FormData) => createStaffLogin(formData), null);
  const [bulk, bulkAction, bulkPending] = useActionState(
    async (_prev: { results: { line: string; error?: string }[] } | null, formData: FormData) => createStaffLoginsBulk(formData),
    null
  );
  const [invite, inviteAction, invitePending] = useActionState(async (_prev: Message, formData: FormData) => createStaffAccount(formData), null);

  return (
    <div className="max-w-4xl p-4 sm:p-7">
      <PageHeader title="ทีมงาน" subtitle="สร้างไอดีและรหัสผ่านให้พนักงานและเทรนเนอร์ได้เลย ไม่ต้องใช้อีเมล แล้วแจ้งให้เขาเข้าที่หน้า /login" />

      {adminProblem && (
        <div className="mb-4 rounded-xl border border-coral bg-coral-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ระบบสร้างบัญชีให้ทีมงานยังไม่ได้ เพราะค่า <code>SUPABASE_SERVICE_ROLE_KEY</code> ใน Vercel ไม่ถูกต้องหรือยังไม่ได้ใส่ ({adminProblem})
        </div>
      )}

      <form action={loginAction} className="mb-4 rounded-xl border border-border bg-panel p-[18px]">
        <h2 className="m-0 mb-3 font-heading text-[15px] text-text-hi">สร้างบัญชีทีละคน</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.3fr_1fr_1fr_0.9fr_auto]">
          <Input name="full_name" placeholder="ชื่อที่ใช้เรียก เช่น Tar" required className="col-span-2 sm:col-span-1" />
          <Input name="login_id" placeholder="ไอดี เช่น tar" autoCapitalize="none" autoComplete="off" spellCheck={false} required />
          <Input name="password" placeholder="รหัสผ่าน 6 ตัวขึ้นไป" autoComplete="off" minLength={6} required />
          <Select name="role" defaultValue="trainer">
            <option value="trainer">เทรนเนอร์</option>
            <option value="staff">พนักงาน</option>
          </Select>
          <Button type="submit" variant="primary" disabled={loginPending}>
            <UserPlus size={14} /> สร้าง
          </Button>
        </div>
        {login?.error && <div className="mt-2.5 text-[12.5px] text-coral">{login.error}</div>}
        {login?.success && <div className="mt-2.5 text-[12.5px] text-mint">สร้างบัญชีแล้ว</div>}
      </form>

      <details className="mb-4 rounded-xl border border-border bg-panel p-[18px]">
        <summary className="cursor-pointer font-heading text-[15px] text-text-hi">สร้างหลายคนพร้อมกัน</summary>
        <form action={bulkAction} className="mt-3">
          <p className="m-0 mb-2 text-[12.5px] leading-relaxed text-text-lo">
            พิมพ์บรรทัดละคน คั่นด้วยเครื่องหมายจุลภาค: <span className="text-text-hi">ชื่อ, ไอดี, รหัสผ่าน</span> เช่น <span className="text-text-hi">Tar, tar, 123456</span>
          </p>
          <textarea
            name="lines"
            rows={8}
            required
            spellCheck={false}
            placeholder={"Tar, tar, รหัสผ่าน\nJeeno, jeeno, รหัสผ่าน"}
            className="w-full rounded-lg border border-border bg-panel-raised px-3 py-2 font-body text-[13.5px] text-text-hi outline-none placeholder:text-text-faint"
          />
          <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
            <Select name="role" defaultValue="trainer" className="w-auto" aria-label="บทบาทของทุกคนในรายการ">
              <option value="trainer">ทุกคนเป็นเทรนเนอร์</option>
              <option value="staff">ทุกคนเป็นพนักงาน</option>
            </Select>
            <Button type="submit" variant="primary" disabled={bulkPending}>
              {bulkPending ? "กำลังสร้าง..." : "สร้างทั้งหมด"}
            </Button>
          </div>
        </form>
        {bulk && (
          <ul className="m-0 mt-3 list-none p-0 text-[13px]">
            {bulk.results.map((r, i) => (
              <li key={i} className={r.error ? "text-coral" : "text-mint"}>
                {r.line}: {r.error ?? "สร้างแล้ว"}
              </li>
            ))}
          </ul>
        )}
      </details>

      <details className="mb-6 rounded-xl border border-border bg-panel p-[18px]">
        <summary className="cursor-pointer font-heading text-[15px] text-text-hi">หรือเชิญด้วยอีเมล (เขาตั้งรหัสผ่านเอง)</summary>
        <form action={inviteAction} className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto]">
          <Input name="email" type="email" placeholder="อีเมล" required className="col-span-2 sm:col-span-1" />
          <Input name="full_name" placeholder="ชื่อ-นามสกุล" required />
          <Input name="phone" placeholder="เบอร์โทร" />
          <Select name="role" defaultValue="staff">
            <option value="staff">พนักงาน</option>
            <option value="trainer">เทรนเนอร์</option>
          </Select>
          <Button type="submit" disabled={invitePending}>
            เชิญ
          </Button>
        </form>
        {invite?.error && <div className="mt-2.5 text-[12.5px] text-coral">{invite.error}</div>}
        {invite?.success && <div className="mt-2.5 text-[12.5px] text-mint">ส่งคำเชิญแล้ว</div>}
      </details>

      <div className="overflow-x-auto rounded-xl border border-border">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[1.3fr_1.2fr_0.8fr_1.3fr] bg-panel px-4 py-2.5 text-xs text-text-faint">
            <div>ชื่อ</div>
            <div>ไอดีหรืออีเมลที่ใช้เข้า</div>
            <div>บทบาท</div>
            <div>รหัสผ่าน</div>
          </div>
          {team.map((t) => (
            <div key={t.id} className="grid grid-cols-[1.3fr_1.2fr_0.8fr_1.3fr] items-center border-t border-border bg-panel px-4 py-3">
              <div className="text-[13.5px] text-text-hi">{t.full_name}</div>
              <div className="break-all text-[13px] text-text-lo">{logins[t.id] || "-"}</div>
              <div>
                <Badge tone={t.role === "trainer" ? "due" : "active"}>{t.role === "trainer" ? "เทรนเนอร์" : "พนักงาน"}</Badge>
              </div>
              <PasswordButton userId={t.id} name={t.full_name} />
            </div>
          ))}
          {team.length === 0 && <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีทีมงาน</div>}
        </div>
      </div>
    </div>
  );
}
