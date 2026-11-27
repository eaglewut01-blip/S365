"use client";

import { useActionState, useState, useSyncExternalStore } from "react";
import { CircleCheck, CircleX, Dumbbell, HeartPulse, Users } from "lucide-react";
import { selfCheckin, type CheckinResult } from "@/lib/actions/self-checkin";
import { formatDateTh, formatTimeTh } from "@/lib/dates";
import { ACTIVITIES, ACTIVITY_LABEL } from "@/lib/labels";
import type { VisitActivity } from "@/types/database";

const ACTIVITY_ICON: Record<VisitActivity, typeof Dumbbell> = { weights: Dumbbell, cardio: HeartPulse, class: Users };

const REASON: Record<string, string> = {
  bad_link: "QR นี้ใช้ไม่ได้แล้ว กรุณาสแกนป้ายที่หน้าเคาน์เตอร์อีกครั้ง",
  bad_phone: "กรอกเบอร์โทรให้ครบ 10 หลัก",
  not_found: "ไม่พบเบอร์นี้ในระบบสมาชิก กรุณาแจ้งพนักงานที่เคาน์เตอร์",
  ask_staff: "เบอร์นี้ตรงกับสมาชิกมากกว่าหนึ่งคน กรุณาแจ้งพนักงานที่เคาน์เตอร์",
  error: "ระบบขัดข้อง ลองใหม่อีกครั้ง หรือแจ้งพนักงานที่เคาน์เตอร์",
};

type Blocked = Extract<CheckinResult, { reason: "expired" | "frozen" | "no_package" }>;

const BLOCKED_TEXT: Record<Blocked["reason"], string> = {
  expired: "สมาชิกของคุณหมดอายุแล้ว จึงยังเช็กอินไม่ได้ ติดต่อเคาน์เตอร์เพื่อต่ออายุได้เลย",
  frozen: "สมาชิกของคุณอยู่ระหว่างพักการใช้ จึงยังเช็กอินไม่ได้ กรุณาแจ้งพนักงานที่เคาน์เตอร์",
  no_package: "ยังไม่พบแพ็กเกจสมาชิกของคุณ จึงยังเช็กอินไม่ได้ กรุณาติดต่อเคาน์เตอร์",
};

function PromotionCards({ promotions }: { promotions: { title: string; body: string }[] }) {
  return promotions.map((promo, i) => (
    <div key={i} className="mt-3 rounded-2xl border border-volt bg-volt/10 p-5">
      <div className="font-body text-[11px] font-semibold tracking-[0.2em] text-volt">โปรโมชั่นสำหรับคุณ</div>
      <div className="mt-1.5 font-body text-[17px] font-semibold text-text-hi">{promo.title}</div>
      {promo.body && <p className="mt-1.5 mb-0 whitespace-pre-line text-[13.5px] leading-relaxed text-text-lo">{promo.body}</p>}
      <div className="mt-2.5 text-[12.5px] text-text-lo">สนใจแจ้งพนักงานที่เคาน์เตอร์ได้เลย</div>
    </div>
  ));
}

function TurnedAway({ result }: { result: Blocked }) {
  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-2xl border border-coral bg-panel p-7 text-center">
        <CircleX size={52} className="mx-auto text-coral" strokeWidth={1.8} />
        <h1 className="m-0 mt-3 font-heading text-[28px] leading-tight tracking-wide text-text-hi">ยังเช็กอินไม่ได้</h1>
        <p className="mt-2 mb-0 text-[15px] leading-relaxed text-text-lo">
          คุณ{result.name} {BLOCKED_TEXT[result.reason]}
        </p>
        {result.reason === "expired" && result.expires_on && (
          <p className="mt-2 mb-0 text-[13px] text-text-faint">หมดอายุเมื่อ {formatDateTh(result.expires_on)}</p>
        )}
      </div>
      <PromotionCards promotions={result.promotions} />
    </div>
  );
}

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
          {result.activity ? ` · ${ACTIVITY_LABEL[result.activity]}` : ""}
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

      </div>

      <p className="mt-3 mb-0 text-center text-[12.5px] text-text-faint">ครั้งหน้าสแกนแล้วกดปุ่มได้เลย ไม่ต้องกรอกเบอร์อีก</p>

      <PromotionCards promotions={result.promotions} />
    </div>
  );
}

// The phone number last used on this device, so a returning member only
// has to tap what they came to do. Kept in this browser only.
const SAVED_KEY = "s365-checkin";
type Saved = { phone: string; name: string };

function readSaved(): Saved | null {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "null");
    return saved && typeof saved.phone === "string" && typeof saved.name === "string" ? saved : null;
  } catch {
    return null;
  }
}

function writeSaved(saved: Saved | null) {
  try {
    if (saved) window.localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    else window.localStorage.removeItem(SAVED_KEY);
  } catch {
    // Private browsing: the member types their number each time.
  }
}

const subscribe = () => () => {};

// The saved number can only be read in the browser, so the form is drawn there.
export function CheckinForm({ token }: { token: string }) {
  const inBrowser = useSyncExternalStore(subscribe, () => true, () => false);
  return inBrowser ? <CheckinFormInner token={token} /> : <div className="h-[340px] w-full max-w-[400px]" />;
}

function CheckinFormInner({ token }: { token: string }) {
  const [saved, setSaved] = useState(readSaved);
  const [result, formAction, pending] = useActionState(async (prev: CheckinResult | null, formData: FormData) => {
    const res = await selfCheckin(prev, formData);
    if (res.ok) {
      writeSaved({ phone: String(formData.get("phone") || ""), name: res.name });
    } else if (res.reason === "not_found" || res.reason === "ask_staff" || res.reason === "bad_phone") {
      // The saved number no longer matches a member: ask for it again.
      writeSaved(null);
      setSaved(null);
    }
    return res;
  }, null);

  if (result?.ok) return <Done result={result} />;
  if (result && (result.reason === "expired" || result.reason === "frozen" || result.reason === "no_package")) {
    return <TurnedAway result={result} />;
  }

  return (
    <form action={formAction} className="w-full max-w-[400px] rounded-2xl border border-border bg-panel p-7">
      <div className="font-heading text-[32px] leading-none tracking-wide text-text-hi">S365</div>
      <div className="mt-[3px] font-body text-[11px] font-semibold tracking-[0.3em] text-volt">FITNESS</div>
      <h1 className="m-0 mt-5 font-body text-[19px] font-semibold text-text-hi">
        {token && saved ? `สวัสดีคุณ${saved.name}` : "เช็กอินเข้ายิม"}
      </h1>

      {token ? (
        <>
          <input type="hidden" name="k" value={token} />
          {saved ? (
            <input type="hidden" name="phone" value={saved.phone} />
          ) : (
            <label className="mt-4 block">
              <span className="mb-1.5 block text-[13px] text-text-lo">เบอร์โทรที่ลงทะเบียนไว้ (กรอกครั้งแรกครั้งเดียว)</span>
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
          )}
          {result && !result.ok && <div className="mt-3 text-[13.5px] leading-relaxed text-coral">{REASON[result.reason] ?? REASON.error}</div>}
          <div className="mt-5 text-[13px] text-text-lo">วันนี้มาเล่นอะไร กดเพื่อเช็กอิน</div>
          <div className="mt-2 grid grid-cols-3 gap-2.5">
            {ACTIVITIES.map((activity) => {
              const Icon = ACTIVITY_ICON[activity];
              return (
                <button
                  key={activity}
                  type="submit"
                  name="activity"
                  value={activity}
                  disabled={pending}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-volt bg-volt px-2 py-4 font-body text-[15px] font-semibold text-volt-ink hover:brightness-110 disabled:cursor-default disabled:opacity-50"
                >
                  <Icon size={26} strokeWidth={2} />
                  {ACTIVITY_LABEL[activity]}
                </button>
              );
            })}
          </div>
          {pending && <div className="mt-3 text-center text-[13px] text-text-lo">กำลังเช็กอิน...</div>}
          {saved && (
            <button
              type="button"
              onClick={() => {
                writeSaved(null);
                setSaved(null);
              }}
              className="mt-5 block w-full cursor-pointer border-none bg-transparent text-center font-body text-[12.5px] text-text-faint underline hover:text-text-lo"
            >
              ไม่ใช่คุณ{saved.name} ใช้เบอร์อื่น
            </button>
          )}
        </>
      ) : (
        <p className="mt-3 mb-0 text-[14px] leading-relaxed text-text-lo">{REASON.bad_link}</p>
      )}
    </form>
  );
}
