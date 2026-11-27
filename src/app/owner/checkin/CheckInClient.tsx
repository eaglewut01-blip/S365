"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Search, Check, QrCode } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { checkInMember } from "@/lib/actions/checkins";
import { expiryLabel, expiryState, formatTimeTh } from "@/lib/dates";
import type { Member } from "@/types/database";

export type CheckinRow = {
  id: string;
  checked_in_at: string;
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
        ค้นหาชื่อสมาชิกเพื่อบันทึกการเข้าใช้บริการวันนี้
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
              <button
                key={m.id}
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await checkInMember(m.id);
                    setQuery("");
                  })
                }
                className="flex w-full cursor-pointer items-center justify-between border-t border-border bg-transparent px-3.5 py-3 text-left first:border-t-0"
              >
                <span className="text-sm text-text-hi">{m.name}</span>
                <span className="flex items-center gap-1 text-[12.5px] text-volt">
                  <Check size={13} /> เช็คอิน
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-panel p-[18px]">
        <h3 className="m-0 mb-3 font-heading text-sm text-text-hi">เช็คอินล่าสุด</h3>
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
              <span className="text-[12.5px] text-text-faint">{formatTimeTh(ci.checked_in_at)} น.</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
