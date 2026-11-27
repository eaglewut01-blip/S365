"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { setPassword } from "@/lib/actions/password";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type LinkInfo = {
  accessToken: string;
  refreshToken: string;
  type: string;
  failed: boolean;
};

// What the invite or reset link carried. Supabase puts the sign-in tokens
// after the "#", which never reaches the server, so they are read here and
// sent along with the new password.
function readLink(): LinkInfo {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  return {
    accessToken: hash.get("access_token") ?? "",
    refreshToken: hash.get("refresh_token") ?? "",
    type: hash.get("type") ?? "",
    failed: Boolean(hash.get("error") || hash.get("error_code") || query.get("error") || query.get("error_code")),
  };
}

const subscribe = () => () => {};

// The link can only be read in the browser, so the form is drawn there and
// not in the server render.
export default function ResetPasswordPage() {
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      {inBrowser && <ResetPasswordForm />}
    </div>
  );
}

function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(setPassword, null);
  const [link] = useState(readLink);

  useEffect(() => {
    // Take the tokens out of the address bar so they are not kept in history.
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const isInvite = link.type === "invite";

  return (
    <form action={formAction} className="w-full max-w-[360px] rounded-2xl border border-border bg-panel p-8">
      <div className="mb-[18px] flex h-10 w-10 items-center justify-center rounded-[10px] bg-volt">
        <KeyRound size={20} color="#241800" strokeWidth={2.4} />
      </div>
      <h1 className="m-0 font-heading text-[26px] leading-none tracking-wide text-text-hi">
        {isInvite ? "ตั้งรหัสผ่าน" : "ตั้งรหัสผ่านใหม่"}
      </h1>

      {link.failed ? (
        <>
          <p className="mt-3 mb-5 text-[13.5px] leading-relaxed text-text-lo">
            ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่แล้วลองอีกครั้ง
          </p>
          <Link
            href="/forgot-password"
            className="block rounded-lg border border-volt bg-volt px-3.5 py-2.5 text-center font-body text-[13.5px] font-semibold text-volt-ink hover:brightness-110"
          >
            ขอลิงก์ใหม่
          </Link>
        </>
      ) : (
        <>
          <p className="mt-2 mb-5 text-[13px] leading-relaxed text-text-lo">
            {isInvite
              ? "ยินดีต้อนรับสู่ S365 Fitness ตั้งรหัสผ่านสำหรับเข้าสู่ระบบครั้งต่อไป"
              : "ตั้งรหัสผ่านใหม่สำหรับเข้าสู่ระบบ"}
          </p>
          <input type="hidden" name="access_token" value={link.accessToken} />
          <input type="hidden" name="refresh_token" value={link.refreshToken} />
          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] text-text-lo">รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</span>
              <Input type="password" name="password" autoComplete="new-password" minLength={8} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[12.5px] text-text-lo">พิมพ์รหัสผ่านอีกครั้ง</span>
              <Input type="password" name="confirm" autoComplete="new-password" minLength={8} required />
            </label>
          </div>
          {state?.error && <div className="mt-2.5 text-[12.5px] text-coral">{state.error}</div>}
          <Button type="submit" variant="primary" disabled={pending} className="mt-5 w-full py-2.5">
            {pending ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}
          </Button>
        </>
      )}

      <Link href="/login" className="mt-4 block text-center text-[12.5px] text-text-faint hover:text-text-lo">
        กลับหน้าเข้าสู่ระบบ
      </Link>
    </form>
  );
}
