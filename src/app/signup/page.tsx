"use client";

import { useActionState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import { applyForAccount } from "@/lib/actions/signup";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(applyForAccount, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <form action={formAction} className="w-full max-w-[380px] rounded-2xl border border-border bg-panel p-8">
        <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[10px] bg-volt">
          <UserPlus size={20} color="#241800" strokeWidth={2.4} />
        </div>
        <h1 className="m-0 font-heading text-[26px] leading-none tracking-wide text-text-hi">สมัครบัญชีทีมงาน</h1>

        {state?.done ? (
          <p className="mt-3 mb-0 text-[13.5px] leading-relaxed text-text-lo">
            ส่งคำขอแล้ว รอเจ้าของยิมอนุมัติ เมื่ออนุมัติแล้วเข้าสู่ระบบได้ด้วยไอดี
            {state.loginId ? <span className="font-semibold text-text-hi"> {state.loginId} </span> : " "}
            และรหัสผ่านที่ตั้งไว้
          </p>
        ) : (
          <>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-text-lo">
              สำหรับเทรนเนอร์และพนักงานของ S365 Fitness ตั้งไอดีและรหัสผ่านเอง แล้วรอเจ้าของอนุมัติ
            </p>
            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-text-lo">ชื่อที่ใช้เรียก</span>
                <Input name="full_name" placeholder="เช่น Tar" maxLength={60} defaultValue={state?.values?.fullName} required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-text-lo">ไอดีสำหรับเข้าระบบ (อังกฤษหรือตัวเลข)</span>
                <Input name="login_id" placeholder="เช่น tar" autoCapitalize="none" autoComplete="username" spellCheck={false} defaultValue={state?.values?.loginId} required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-text-lo">เบอร์โทร (ไม่บังคับ)</span>
                <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" defaultValue={state?.values?.phone} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-text-lo">รหัสผ่าน (อย่างน้อย 6 ตัว)</span>
                <Input name="password" type="password" autoComplete="new-password" minLength={6} required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[12.5px] text-text-lo">พิมพ์รหัสผ่านอีกครั้ง</span>
                <Input name="confirm" type="password" autoComplete="new-password" minLength={6} required />
              </label>
              {/* Hidden from people; see applyForAccount. */}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            </div>
            {state?.error && <div className="mt-2.5 text-[12.5px] text-coral">{state.error}</div>}
            <Button type="submit" variant="primary" disabled={pending} className="mt-5 w-full py-2.5">
              {pending ? "กำลังส่งคำขอ..." : "สมัคร"}
            </Button>
          </>
        )}

        <Link href="/login" className="mt-4 block text-center text-[12.5px] text-text-faint hover:text-text-lo">
          กลับหน้าเข้าสู่ระบบ
        </Link>
      </form>
    </div>
  );
}
