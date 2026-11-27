"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { login } from "@/lib/actions/auth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <form
        action={formAction}
        className="w-full max-w-[360px] rounded-2xl border border-border bg-panel p-8"
      >
        <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[10px] bg-volt">
          <Dumbbell size={20} color="#241800" strokeWidth={2.4} />
        </div>
        <div className="font-heading text-[32px] leading-none tracking-wide text-text-hi">S365</div>
        <div className="mt-[3px] font-body text-[11px] font-semibold tracking-[0.3em] text-volt">
          FITNESS
        </div>
        <div className="mt-1 mb-6 text-[13px] text-text-lo">
          เข้าสู่ระบบเพื่อจัดการฟิตเนสของคุณ
        </div>

        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-[12.5px] text-text-lo">อีเมล</div>
            <Input type="email" name="email" placeholder="you@example.com" required />
          </div>
          <div>
            <div className="mb-1.5 text-[12.5px] text-text-lo">รหัสผ่าน</div>
            <Input type="password" name="password" placeholder="••••••••" required />
          </div>
        </div>

        {state?.error && <div className="mt-2.5 text-[12.5px] text-coral">{state.error}</div>}

        <Button
          type="submit"
          variant="primary"
          disabled={pending}
          className="mt-5 w-full py-2.5"
        >
          {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </Button>

        <Link href="/forgot-password" className="mt-4 block text-center text-[12.5px] text-text-lo hover:text-text-hi">
          ลืมรหัสผ่าน
        </Link>

        <Link href="/" className="mt-2.5 block text-center text-[12.5px] text-text-faint hover:text-text-lo">
          กลับหน้าเว็บไซต์
        </Link>
      </form>
    </div>
  );
}
