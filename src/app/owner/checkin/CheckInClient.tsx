"use client";

import { useState, useTransition } from "react";
import { Search, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { checkInMember } from "@/lib/actions/checkins";
import type { Member } from "@/types/database";

export function CheckInClient({
  members,
  checkins,
}: {
  members: Member[];
  checkins: { id: string; checked_in_at: string; member: { name: string } }[];
}) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const matches =
    query.length > 0
      ? members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()))
      : [];

  return (
    <div className="max-w-2xl p-7">
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">เช็คอิน</h1>
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
        {checkins.map((ci) => (
          <div key={ci.id} className="flex justify-between border-t border-border py-2 first:border-t-0">
            <span className="text-[13.5px] text-text-hi">{ci.member?.name}</span>
            <span className="text-[12.5px] text-text-faint">
              {new Date(ci.checked_in_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
