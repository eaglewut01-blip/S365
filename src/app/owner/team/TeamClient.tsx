"use client";

import { useActionState, useState, useTransition } from "react";
import { KeyRound, Pencil, Trash2, UserPlus } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { approveApplicant, createStaffAccount, createStaffLogin, createStaffLoginsBulk, rejectApplicant, removeStaffMember, restoreStaffMember, setStaffPassword, updateStaffMember } from "@/lib/actions/accounts";
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
        className="!w-36 py-1 text-xs"
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

// One team member: shown as a row, and turned into a small form by the edit
// button so the owner can fix a name, ID, role or phone typed wrongly.
function MemberRow({ person, login }: { person: Profile; login: string }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const usesId = Boolean(login) && !login.includes("@");
  const start = person.work_start?.slice(0, 5) ?? "";
  const [form, setForm] = useState({ fullName: person.full_name, loginId: login, role: person.role as string, phone: person.phone ?? "", workStart: start });
  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const grid = "grid grid-cols-[1.3fr_1.2fr_0.8fr_0.7fr_1.3fr_auto_auto] items-center gap-x-3 border-t border-border bg-panel px-4 py-3";

  if (!editing) {
    return (
      <div className={grid}>
        <div className="text-[13.5px] text-text-hi">
          {person.full_name}
          {person.phone && <div className="text-xs text-text-faint">{person.phone}</div>}
        </div>
        <div className="break-all text-[13px] text-text-lo">{login || "-"}</div>
        <div>
          <Badge tone={person.role === "trainer" ? "due" : "active"}>{person.role === "trainer" ? "เทรนเนอร์" : "เซลล์ / พนักงาน"}</Badge>
        </div>
        <div className="text-[13px] text-text-lo tabular-nums">{start ? `${start} น.` : "-"}</div>
        <PasswordButton userId={person.id} name={person.full_name} />
        <button
          onClick={() => {
            setForm({ fullName: person.full_name, loginId: login, role: person.role, phone: person.phone ?? "", workStart: start });
            setEditing(true);
          }}
          aria-label={`แก้ข้อมูลของ ${person.full_name}`}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-border-strong bg-transparent px-2.5 py-1.5 text-[12.5px] font-semibold text-text-hi hover:bg-white/5"
        >
          <Pencil size={12} /> แก้
        </button>
        <button
          disabled={pending}
          onClick={() => {
            if (!window.confirm(`ลบ ${person.full_name} ออกจากทีมงาน\n\nเขาจะเข้าระบบไม่ได้อีก ลูกค้า PT ของเขาจะกลับไปเป็นยังไม่ระบุเทรนเนอร์ ส่วนประวัติการขายและการเทรนที่ผ่านมายังอยู่ครบ`)) return;
            startTransition(async () => {
              const res = await removeStaffMember(person.id);
              setError(res.error ?? "");
            });
          }}
          aria-label={`ลบ ${person.full_name} ออกจากทีมงาน`}
          className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-coral bg-transparent px-2.5 py-1.5 text-[12.5px] font-semibold text-coral hover:bg-coral-bg disabled:opacity-45"
        >
          <Trash2 size={12} /> ลบออก
        </button>
        {error && <div className="col-span-full mt-1.5 text-[12.5px] text-coral">{error}</div>}
      </div>
    );
  }

  const save = () =>
    startTransition(async () => {
      const res = await updateStaffMember(person.id, form);
      setError(res.error ?? "");
      if (res.success) setEditing(false);
    });

  return (
    <form
      className="border-t border-border bg-panel-raised px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <label className="block">
          <span className="mb-1 block text-xs text-text-lo">ชื่อที่ใช้เรียก</span>
          <Input name="full_name" value={form.fullName} onChange={set("fullName")} maxLength={60} required />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-lo">{usesId ? "ไอดีที่ใช้เข้าระบบ" : "อีเมลที่ใช้เข้า (แก้ที่นี่ไม่ได้)"}</span>
          <Input name="login_id" value={form.loginId} onChange={set("loginId")} disabled={!usesId} autoCapitalize="none" spellCheck={false} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-lo">บทบาท</span>
          <Select name="role" value={form.role} onChange={set("role")}>
            <option value="trainer">เทรนเนอร์</option>
            <option value="staff">เซลล์ / พนักงาน</option>
          </Select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-lo">เบอร์โทร</span>
          <Input name="phone" type="tel" value={form.phone} onChange={set("phone")} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs text-text-lo">เวลาเข้างาน (เว้นว่างได้)</span>
          <Input name="work_start" type="time" value={form.workStart} onChange={set("workStart")} />
        </label>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={pending}
          onClick={() => {
            setEditing(false);
            setError("");
          }}
        >
          ยกเลิก
        </Button>
        {usesId && <span className="text-xs text-text-faint">ถ้าเปลี่ยนไอดี ต้องบอกเจ้าตัวให้ใช้ไอดีใหม่เข้าระบบ รหัสผ่านเดิม</span>}
        {error && <span className="text-[12.5px] text-coral">{error}</span>}
      </div>
    </form>
  );
}

function GoneRow({ person, login }: { person: Profile; login: string }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const restore = (role: "trainer" | "staff") => startTransition(async () => setError((await restoreStaffMember(person.id, role)).error ?? ""));

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border py-2.5 first:border-t-0">
      <div className="min-w-[150px] flex-1 text-[13.5px] text-text-hi">
        {person.full_name}
        <span className="ml-2 text-xs text-text-faint">{login}</span>
      </div>
      <Button disabled={pending} onClick={() => restore("trainer")} className="px-2.5 py-1.5 text-xs">
        นำกลับเป็นเทรนเนอร์
      </Button>
      <Button disabled={pending} onClick={() => restore("staff")} className="px-2.5 py-1.5 text-xs">
        นำกลับเป็นเซลล์ / พนักงาน
      </Button>
      {error && <div className="w-full text-[12.5px] text-coral">{error}</div>}
    </div>
  );
}

function WaitingRow({ person, login }: { person: Profile; login: string }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<{ error?: string }>) => startTransition(async () => setError((await work()).error ?? ""));

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3 first:border-t-0">
      <div className="min-w-[150px] flex-1">
        <div className="text-[13.5px] font-medium text-text-hi">{person.full_name}</div>
        <div className="text-xs text-text-lo">
          ไอดี {login || "-"}
          {person.phone ? ` · ${person.phone}` : ""}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" disabled={pending} onClick={() => run(() => approveApplicant(person.id, "trainer"))}>
          อนุมัติเป็นเทรนเนอร์
        </Button>
        <Button disabled={pending} onClick={() => run(() => approveApplicant(person.id, "staff"))}>
          อนุมัติเป็นเซลล์ / พนักงาน
        </Button>
        <Button
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (window.confirm(`ปฏิเสธและลบคำขอของ ${person.full_name}`)) run(() => rejectApplicant(person.id));
          }}
        >
          ปฏิเสธ
        </Button>
      </div>
      {error && <div className="w-full text-[12.5px] text-coral">{error}</div>}
    </div>
  );
}

export function TeamClient({
  team,
  waiting,
  gone,
  logins,
  adminProblem,
}: {
  team: Profile[];
  waiting: Profile[];
  gone: Profile[];
  logins: Record<string, string>;
  adminProblem: string;
}) {
  const [login, loginAction, loginPending] = useActionState(async (_prev: Message, formData: FormData) => createStaffLogin(formData), null);
  const [bulk, bulkAction, bulkPending] = useActionState(
    async (_prev: { results: { line: string; error?: string }[] } | null, formData: FormData) => createStaffLoginsBulk(formData),
    null
  );
  const [invite, inviteAction, invitePending] = useActionState(async (_prev: Message, formData: FormData) => createStaffAccount(formData), null);

  return (
    <div className="max-w-4xl p-4 sm:p-7">
      <PageHeader title="ทีมงาน" subtitle="เซลล์และพนักงานเข้าหลังบ้านได้ทุกเมนู ยกเว้นเว็บไซต์และทีมงาน เทรนเนอร์มีหน้าของตัวเองสำหรับลงตารางและขาย สร้างไอดีและรหัสผ่านให้ได้เลย ไม่ต้องใช้อีเมล" />

      {adminProblem ? (
        <div className="mb-4 rounded-xl border border-coral bg-coral-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          <div className="mb-1 font-semibold">ยังสร้างบัญชี รับสมัคร และอนุมัติทีมงานไม่ได้</div>
          <div>{adminProblem}</div>
          <ol className="mt-2 mb-0 pl-5">
            <li>เปิด Supabase เมนู Project Settings แล้วเลือก API Keys คัดลอกคีย์ที่ชื่อ service_role</li>
            <li>เปิด Vercel โปรเจกต์ s365 เมนู Settings แล้วเลือก Environment Variables แก้ค่า SUPABASE_SERVICE_ROLE_KEY เป็นคีย์ที่คัดลอกมา แล้วกด Save</li>
            <li>ไปที่ Deployments กดจุดสามจุดของรายการบนสุด เลือก Redeploy รอจนขึ้น Ready แล้วเปิดหน้านี้ใหม่ ถ้ากรอบสีแดงนี้หายไปคือใช้ได้แล้ว</li>
          </ol>
        </div>
      ) : (
        <div className="mb-4 rounded-xl border border-border bg-panel px-4 py-2.5 text-[13px] text-mint">ระบบสร้างบัญชีและรับสมัครทีมงานพร้อมใช้งาน</div>
      )}

      <section className={`mb-4 overflow-hidden rounded-xl border bg-panel ${waiting.length ? "border-amber" : "border-border"}`}>
        <div className="px-4 pt-3.5 pb-2.5">
          <h2 className="m-0 font-heading text-[15px] text-text-hi">รออนุมัติ {waiting.length} คน</h2>
          <p className="mt-1 mb-0 text-[12.5px] text-text-lo">
            ทีมงานสมัครเองได้ที่ปุ่ม สมัครบัญชีทีมงาน ในหน้า /login คนที่ยังไม่อนุมัติจะเข้าใช้งานอะไรไม่ได้ อนุมัติเฉพาะคนที่คุณรู้จัก
          </p>
        </div>
        {waiting.map((person) => (
          <WaitingRow key={person.id} person={person} login={logins[person.id] ?? ""} />
        ))}
      </section>

      <form action={loginAction} className="mb-4 rounded-xl border border-border bg-panel p-[18px]">
        <h2 className="m-0 mb-3 font-heading text-[15px] text-text-hi">สร้างบัญชีทีละคน</h2>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.3fr_1fr_1fr_0.9fr_auto]">
          <Input name="full_name" placeholder="ชื่อที่ใช้เรียก เช่น Tar" required className="col-span-2 sm:col-span-1" />
          <Input name="login_id" placeholder="ไอดี เช่น tar" autoCapitalize="none" autoComplete="off" spellCheck={false} required />
          <Input name="password" placeholder="รหัสผ่าน 6 ตัวขึ้นไป" autoComplete="off" minLength={6} required />
          <Select name="role" defaultValue="trainer">
            <option value="trainer">เทรนเนอร์</option>
            <option value="staff">เซลล์ / พนักงาน</option>
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
            <Select name="role" defaultValue="trainer" className="!w-auto" aria-label="บทบาทของทุกคนในรายการ">
              <option value="trainer">ทุกคนเป็นเทรนเนอร์</option>
              <option value="staff">ทุกคนเป็นเซลล์ / พนักงาน</option>
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
            <option value="staff">เซลล์ / พนักงาน</option>
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
        <div className="min-w-[900px]">
          <div className="grid grid-cols-[1.3fr_1.2fr_0.8fr_0.7fr_1.3fr_auto_auto] gap-x-3 bg-panel px-4 py-2.5 text-xs text-text-faint">
            <div>ชื่อ</div>
            <div>ไอดีหรืออีเมลที่ใช้เข้า</div>
            <div>บทบาท</div>
            <div>เวลาเข้างาน</div>
            <div>รหัสผ่าน</div>
            <div className="w-[58px]">แก้ไข</div>
            <div className="w-[78px]">ลาออก</div>
          </div>
          {team.map((t) => (
            <MemberRow key={t.id} person={t} login={logins[t.id] ?? ""} />
          ))}
          {team.length === 0 && <div className="bg-panel px-4 py-6 text-center text-[13px] text-text-faint">ยังไม่มีทีมงาน</div>}
        </div>
      </div>

      {gone.length > 0 && (
        <details className="mt-4 rounded-xl border border-border bg-panel p-[18px]">
          <summary className="cursor-pointer font-heading text-[15px] text-text-hi">ลาออกแล้ว {gone.length} คน</summary>
          <p className="mt-2 mb-1 text-[12.5px] text-text-lo">คนในรายการนี้เข้าระบบไม่ได้ ประวัติการขายและการเทรนยังอยู่ครบ ถ้าลบผิดหรือกลับมาทำงาน กดนำกลับได้</p>
          {gone.map((person) => (
            <GoneRow key={person.id} person={person} login={logins[person.id] ?? ""} />
          ))}
        </details>
      )}
    </div>
  );
}
