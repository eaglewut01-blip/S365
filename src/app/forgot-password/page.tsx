"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/password";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <form action={formAction} className="w-full max-w-[360px] rounded-2xl border border-border bg-panel p-8">
        <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[10px] bg-volt">
          <KeyRound size={20} color="#241800" strokeWidth={2.4} />
        </div>
        <h1 className="m-0 font-heading text-[26px] leading-none tracking-wide text-text-hi">ลืมรหัสผ่าน</h1>

        {state?.sent ? (
          <p className="mt-3 mb-0 text-[13.5px] leading-relaxed text-text-lo">
            ถ้าอีเมลนี้มีบัญชีอยู่ในระบบ เราส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้แล้ว เปิดอีเมลแล้วกดลิงก์ภายใน 1 ชั่วโมง
            ถ้าไม่เห็นอีเมล ลองดูในกล่องสแปม
          </p>
        ) : (
          <>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-text-lo">
              กรอกอีเมลที่ใช้เข้าสู่ระบบ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้ ถ้าเข้าด้วยไอดี ให้แจ้งเจ้าของตั้งรหัสผ่านใหม่ให้
            </p>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] text-text-lo">อีเมล</span>
              <Input type="text" name="email" placeholder="you@example.com" autoComplete="email" autoCapitalize="none" required />
            </label>
            {state?.error && <div className="mt-2.5 text-[12.5px] text-coral">{state.error}</div>}
            <Button type="submit" variant="primary" disabled={pending} className="mt-5 w-full py-2.5">
              {pending ? "กำลังส่ง..." : "ส่งลิงก์ตั้งรหัสผ่าน"}
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
