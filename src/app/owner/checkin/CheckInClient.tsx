"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Check, QrCode } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { checkInMember } from "@/lib/actions/checkins";
import { expiryLabel, expiryState, formatTimeTh } from "@/lib/dates";
import { ACTIVITIES, ACTIVITY_LABEL } from "@/lib/labels";
import type { Member, VisitActivity } from "@/types/database";

export type CheckinRow = {
  id: string;
  checked_in_at: string;
  activity?: VisitActivity | null;
  member: { id: string; name: string; membership_expires_on?: string | null } | null;
};

export function CheckInClient({
  members,
  checkins,
}: {
  members: Member[];
  checkins: CheckinRow[];
}) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  // No check-out: a visit counts as "in the gym" for 90 minutes, like the public crowd page.
  const [loadedAt] = useState(() => Date.now());
  const inGym = checkins.filter((ci) => loadedAt - new Date(ci.checked_in_at).getTime() < 90 * 60 * 1000);

  const matches =
    query.length > 0
      ? members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
      : [];

  return (
    <div className="max-w-2xl p-4 sm:p-7">
      <div className="flex items-start justify-between gap-3">
        <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">เช็คอิน</h1>
        <Link
          href="/owner/checkin/qr"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3.5 py-2 font-body text-[13.5px] font-semibold text-text-hi no-underline hover:bg-white/5"
        >
          <QrCode size={14} /> ป้าย QR ให้ลูกค้าสแกนเอง
        </Link>
      </div>
      <p className="mt-1.5 mb-5 font-body text-[13.5px] text-text-lo">
        ค้นหาชื่อสมาชิก แล้วกดว่าวันนี้มาเล่นอะไรเพื่อเช็กอินให้
      </p>

      <div className="relative mb-5">
        <Search size={16} className="absolute top-3.5 left-3 text-text-faint" />
        <Input
          placeholder="พิมพ์ชื่อสมาชิก..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={pending}
          className="py-3 pl-9 text-[15px]"
        />
        {matches.length > 0 && (
          <div className="mt-1.5 overflow-hidden rounded-[10px] border border-border-strong bg-panel-raised">
            {matches.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-3.5 py-2.5 first:border-t-0">
                <span className="text-sm text-text-hi">{m.name}</span>
                <span className="flex flex-wrap gap-1.5">
                  {ACTIVITIES.map((activity) => (
                    <button
                      key={activity}
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await checkInMember(m.id, activity);
                          setQuery("");
                        })
                      }
                      className="flex cursor-pointer items-center gap-1 rounded-lg border border-volt bg-transparent px-2.5 py-1.5 text-[12.5px] font-semibold text-volt hover:bg-volt/10 disabled:opacity-40"
                    >
                      <Check size={12} /> {ACTIVITY_LABEL[activity]}
                    </button>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 rounded-xl border border-border bg-panel p-[18px]">
        <h3 className="m-0 font-heading text-sm text-text-hi">อยู่ในยิมตอนนี้ (เช็กอินใน 90 นาทีล่าสุด)</h3>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
          <div>
            <div className="font-heading text-[26px] leading-none text-text-hi">{inGym.length}</div>
            <div className="mt-1 text-xs text-text-faint">ทั้งหมด</div>
          </div>
          {ACTIVITIES.map((activity) => (
            <div key={activity}>
              <div className="font-heading text-[26px] leading-none text-volt">{inGym.filter((ci) => ci.activity === activity).length}</div>
              <div className="mt-1 text-xs text-text-faint">{ACTIVITY_LABEL[activity]}</div>
            </div>
          ))}
          <div>
            <div className="font-heading text-[26px] leading-none text-text-lo">{inGym.filter((ci) => !ci.activity).length}</div>
            <div className="mt-1 text-xs text-text-faint">ไม่ระบุ</div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-panel p-[18px]">
        <h3 className="m-0 mb-3 font-heading text-sm text-text-hi">เช็คอินวันนี้</h3>
        {checkins.length === 0 && <div className="text-[13px] text-text-faint">ยังไม่มีการเช็คอินวันนี้</div>}
        {checkins.map((ci) => {
          const expiry = expiryState(ci.member?.membership_expires_on);
          return (
            <div key={ci.id} className="flex items-center justify-between gap-3 border-t border-border py-2 first:border-t-0">
              <span className="text-[13.5px] text-text-hi">
                {ci.member ? (
                  <Link href={`/owner/members/${ci.member.id}`} className="text-text-hi no-underline hover:text-volt">
                    {ci.member.name}
                  </Link>
                ) : (
                  "-"
                )}
                {(expiry.state === "expired" || expiry.state === "soon" || expiry.state === "none") && (
                  <span className={`ml-2 text-xs ${expiry.state === "soon" ? "text-amber" : "text-coral"}`}>
                    {expiryLabel(ci.member?.membership_expires_on)}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap text-[12.5px] text-text-faint">
                {ci.activity ? `${ACTIVITY_LABEL[ci.activity]} · ` : ""}
                {formatTimeTh(ci.checked_in_at)} น.
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
