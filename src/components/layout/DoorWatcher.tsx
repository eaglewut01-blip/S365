"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleCheck, CircleX, PenLine, X } from "lucide-react";
import { doorEventsSince, type DoorEvent } from "@/lib/actions/door-events";
import { expiryLabel, formatTimeTh } from "@/lib/dates";
import { ACTIVITY_LABEL } from "@/lib/labels";

const POLL_MS = 15_000;
const REASON_LABEL = { expired: "สมาชิกหมดอายุ", frozen: "อยู่ระหว่างพักการใช้", no_package: "ไม่มีแพ็กเกจ" } as const;

function beep(blocked: boolean) {
  try {
    const audio = new AudioContext();
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    tone.frequency.value = blocked ? 330 : 880;
    gain.gain.value = 0.08;
    tone.connect(gain).connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + (blocked ? 0.45 : 0.18));
    tone.onended = () => void audio.close();
  } catch {
    // Browsers keep sound off until the page has been clicked; the card still shows.
  }
}

// Shows a card on every back-office page each time a member scans at the
// door, so the desk can check the person in front of them is who scanned.
export function DoorWatcher() {
  const router = useRouter();
  const [cards, setCards] = useState<DoorEvent[]>([]);
  const since = useRef<string | null>(null);
  const seen = useRef(new Set<string>());

  const dismiss = useCallback((id: string) => setCards((list) => list.filter((c) => c.id !== id)), []);

  useEffect(() => {
    since.current = new Date().toISOString();
    let stopped = false;

    const poll = async () => {
      if (stopped || document.hidden || !since.current) return;
      let events: DoorEvent[] = [];
      try {
        events = await doorEventsSince(since.current);
      } catch {
        return; // offline or signed out: try again on the next tick
      }
      const fresh = events.filter((e) => !seen.current.has(e.id));
      if (stopped || fresh.length === 0) return;
      fresh.forEach((e) => seen.current.add(e.id));
      since.current = fresh[fresh.length - 1].at;
      setCards((list) => [...list, ...fresh].slice(-5));
      beep(fresh.some((e) => e.type === "blocked"));
      router.refresh();
      // A check-in card goes away by itself; a turned-away scan stays until closed.
      fresh.filter((e) => e.type !== "blocked").forEach((e) => window.setTimeout(() => dismiss(e.id), 20_000));
    };

    const timer = window.setInterval(poll, POLL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [router, dismiss]);

  if (cards.length === 0) return null;

  return (
    <div aria-live="polite" className="fixed right-3 bottom-3 left-3 z-50 flex flex-col gap-2 sm:left-auto sm:w-[340px] print:hidden">
      {cards.map((card) => {
        const blocked = card.type === "blocked";
        // A client signed for a PT hour: its own card, in the gym's yellow.
        if (card.type === "pt") {
          return (
            <div key={card.id} className="flex items-start gap-3 rounded-xl border border-volt bg-panel-raised px-4 py-3 shadow-lg">
              <PenLine size={20} className="mt-0.5 flex-shrink-0 text-volt" />
              <div className="min-w-0 flex-1">
                <div className="font-body text-[12px] font-semibold text-volt">เซ็นรับการเทรนแล้ว · {formatTimeTh(card.at)} น.</div>
                <Link href={`/owner/members/${card.memberId}`} className="block truncate font-body text-[15px] font-semibold text-text-hi no-underline hover:text-volt">
                  {card.name}
                </Link>
                <div className="text-[12.5px] text-text-lo">
                  เทรนเนอร์ {card.trainer || "-"} · ตัด 1 ชั่วโมง เหลือ {card.ptLeft ?? "-"} ชั่วโมง
                </div>
              </div>
              <button onClick={() => dismiss(card.id)} aria-label="ปิด" className="cursor-pointer border-none bg-transparent p-0 text-text-faint hover:text-text-hi">
                <X size={16} />
              </button>
            </div>
          );
        }
        return (
          <div
            key={card.id}
            className={`flex items-start gap-3 rounded-xl border bg-panel-raised px-4 py-3 shadow-lg ${blocked ? "border-coral" : "border-mint"}`}
          >
            {blocked ? <CircleX size={22} className="mt-0.5 flex-shrink-0 text-coral" /> : <CircleCheck size={22} className="mt-0.5 flex-shrink-0 text-mint" />}
            <div className="min-w-0 flex-1">
              <div className={`font-body text-[12px] font-semibold ${blocked ? "text-coral" : "text-mint"}`}>
                {blocked ? "สแกนแล้วเช็กอินไม่ได้" : "เช็กอินแล้ว"} · {formatTimeTh(card.at)} น.
              </div>
              <Link href={`/owner/members/${card.memberId}`} className="block truncate font-body text-[15px] font-semibold text-text-hi no-underline hover:text-volt">
                {card.name}
              </Link>
              <div className="text-[12.5px] text-text-lo">
                {blocked
                  ? `${card.reason ? REASON_LABEL[card.reason] : ""}${card.reason === "expired" && card.expiresOn ? ` (${expiryLabel(card.expiresOn)})` : ""}`
                  : `${card.activity ? `${ACTIVITY_LABEL[card.activity]} · ` : ""}${card.expiresOn ? expiryLabel(card.expiresOn) : "ไม่มีแพ็กเกจสมาชิก (PT)"}`}
              </div>
            </div>
            <button onClick={() => dismiss(card.id)} aria-label="ปิด" className="cursor-pointer border-none bg-transparent p-0 text-text-faint hover:text-text-hi">
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
