"use client";

import { useActionState } from "react";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { selfCheckin, type CheckinResult } from "@/lib/actions/self-checkin";
import { formatDateTh, formatTimeTh } from "@/lib/dates";

const REASON: Record<string, string> = {
  bad_link: "QR นี้ใช้ไม่ได้แล้ว กรุณาสแกนป้ายที่หน้าเคาน์เตอร์อีกครั้ง",
  bad_phone: "กรอกเบอร์โทรให้ครบ 10 หลัก",
  not_found: "ไม่พบเบอร์นี้ในระบบสมาชิก กรุณาแจ้งพนักงานที่เคาน์เตอร์",
  ask_staff: "เบอร์นี้ตรงกับสมาชิกมากกว่าหนึ่งคน กรุณาแจ้งพนักงานที่เคาน์เตอร์",
  error: "ระบบขัดข้อง ลองใหม่อีกครั้ง หรือแจ้งพนักงานที่เคาน์เตอร์",
};

function Done({ result }: { result: Extract<CheckinResult, { ok: true }> }) {
  const expired = result.days_left !== null && result.days_left < 0;
  const soon = result.days_left !== null && result.days_left >= 0 && result.days_left <= 7;
  const ptLow = result.pt_total > 0 && result.pt_remaining <= 2;

  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-2xl border border-border bg-panel p-7 text-center">
        <CircleCheck size={52} className="mx-auto text-mint" strokeWidth={1.8} />
        <h1 className="m-0 mt-3 font-heading text-[28px] leading-tight tracking-wide text-text-hi">
          {result.new ? "เช็กอินแล้ว" : "เช็กอินไว้แล้ว"}
        </h1>
        <p className="mt-1.5 mb-0 text-[15px] text-text-lo">
          คุณ{result.name} · เข้า {formatTimeTh(result.checked_in_at)} น.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border border-border bg-panel-raised px-4 py-3">
            <div className="text-[12.5px] text-text-lo">อายุสมาชิก</div>
            <div className={`mt-1 font-heading text-[22px] leading-none ${expired ? "text-coral" : soon ? "text-amber" : "text-text-hi"}`}>
              {result.days_left === null
                ? "-"
                : expired
                  ? "หมดอายุแล้ว"
                  : result.days_left === 0
                    ? "หมดวันนี้"
                    : `เหลือ ${result.days_left} วัน`}
            </div>
            {result.expires_on && <div className="mt-1.5 text-xs text-text-faint">ถึง {formatDateTh(result.expires_on)}</div>}
          </div>
          <div className="rounded-xl border border-border bg-panel-raised px-4 py-3">
            <div className="text-[12.5px] text-text-lo">ชั่วโมง PT คงเหลือ</div>
            <div className={`mt-1 font-heading text-[22px] leading-none ${ptLow ? "text-amber" : "text-text-hi"}`}>
              {result.pt_total > 0 ? `${result.pt_remaining} ชั่วโมง` : "-"}
            </div>
            {result.pt_total > 0 && <div className="mt-1.5 text-xs text-text-faint">จากที่ซื้อ {result.pt_total} ชั่วโมง</div>}
          </div>
        </div>

        {(expired || result.days_left === null || result.frozen) && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber bg-amber-bg px-4 py-3 text-left text-[13.5px] leading-relaxed text-text-hi">
            <TriangleAlert size={16} className="mt-0.5 flex-shrink-0 text-amber" />
            <span>
              {result.frozen
                ? "สมาชิกของคุณอยู่ระหว่างพักการใช้ กรุณาแจ้งพนักงานที่เคาน์เตอร์"
                : expired
                  ? "สมาชิกของคุณหมดอายุแล้ว กรุณาติดต่อเคาน์เตอร์เพื่อต่ออายุ"
                  : "ยังไม่พบแพ็กเกจสมาชิกของคุณ กรุณาติดต่อเคาน์เตอร์"}
            </span>
          </div>
        )}
      </div>

      {result.promotions.map((promo, i) => (
        <div key={i} className="mt-3 rounded-2xl border border-volt bg-volt/10 p-5">
          <div className="font-body text-[11px] font-semibold tracking-[0.2em] text-volt">โปรโมชั่นสำหรับคุณ</div>
          <div className="mt-1.5 font-body text-[17px] font-semibold text-text-hi">{promo.title}</div>
          {promo.body && <p className="mt-1.5 mb-0 whitespace-pre-line text-[13.5px] leading-relaxed text-text-lo">{promo.body}</p>}
          <div className="mt-2.5 text-[12.5px] text-text-lo">สนใจแจ้งพนักงานที่เคาน์เตอร์ได้เลย</div>
        </div>
      ))}
    </div>
  );
}

export function CheckinForm({ token }: { token: string }) {
  const [result, formAction, pending] = useActionState(selfCheckin, null);

  if (result?.ok) return <Done result={result} />;

  return (
    <form action={formAction} className="w-full max-w-[400px] rounded-2xl border border-border bg-panel p-7">
      <div className="font-heading text-[32px] leading-none tracking-wide text-text-hi">S365</div>
      <div className="mt-[3px] font-body text-[11px] font-semibold tracking-[0.3em] text-volt">FITNESS</div>
      <h1 className="m-0 mt-5 font-body text-[19px] font-semibold text-text-hi">เช็กอินเข้ายิม</h1>

      {token ? (
        <>
          <input type="hidden" name="k" value={token} />
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] text-text-lo">เบอร์โทรที่ลงทะเบียนไว้</span>
            <input
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="08x-xxx-xxxx"
              required
              className="w-full rounded-xl border border-border bg-panel-raised px-4 py-3.5 font-body text-[20px] tracking-wide text-text-hi outline-none placeholder:text-text-faint focus:border-volt"
            />
          </label>
          {result && !result.ok && <div className="mt-3 text-[13.5px] leading-relaxed text-coral">{REASON[result.reason] ?? REASON.error}</div>}
          <button
            type="submit"
            disabled={pending}
            className="mt-5 w-full cursor-pointer rounded-xl border border-volt bg-volt px-4 py-3.5 font-body text-[16px] font-semibold text-volt-ink hover:brightness-110 disabled:cursor-default disabled:opacity-50"
          >
            {pending ? "กำลังเช็กอิน..." : "เช็กอิน"}
          </button>
        </>
      ) : (
        <p className="mt-3 mb-0 text-[14px] leading-relaxed text-text-lo">{REASON.bad_link}</p>
      )}
    </form>
  );
}
