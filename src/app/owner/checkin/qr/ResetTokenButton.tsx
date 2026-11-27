"use client";

import { useState, useTransition } from "react";
import { resetCheckinToken } from "@/lib/actions/self-checkin";

export function ResetTokenButton({ hasToken }: { hasToken: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (hasToken && !window.confirm("สร้างรหัสใหม่แล้วป้ายที่พิมพ์ไว้ก่อนหน้าจะใช้ไม่ได้ ต้องพิมพ์ป้ายใหม่")) return;
          startTransition(async () => {
            const res = await resetCheckinToken();
            setError(res.error ?? "");
          });
        }}
        className="mt-4 cursor-pointer rounded-lg border border-neutral-400 bg-white px-4 py-2 font-body text-sm font-semibold text-black hover:bg-neutral-100 disabled:opacity-50"
      >
        {hasToken ? "สร้างรหัสใหม่ (ยกเลิกป้ายเดิม)" : "สร้างรหัสของป้าย"}
      </button>
      {error && <span className="font-body text-sm text-red-700">{error}</span>}
    </>
  );
}
