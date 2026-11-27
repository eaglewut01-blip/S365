"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

type Row = { id: string; name: string; phone: string | null };

// Start a sale: find the customer, then record the package, seller and
// trainer on that customer's page.
export function NewSaleSearch({ members }: { members: Row[] }) {
  const [query, setQuery] = useState("");
  const text = query.trim().toLowerCase();
  const digits = text.replace(/\D/g, "");
  const matches =
    text.length < 2
      ? []
      : members
          .filter((m) => m.name.toLowerCase().includes(text) || (digits.length >= 3 && (m.phone ?? "").replace(/\D/g, "").includes(digits)))
          .slice(0, 8);

  return (
    <div className="mb-5 rounded-xl border border-border bg-panel p-[18px]">
      <h2 className="m-0 font-heading text-[15px] text-text-hi">สร้างรายการขาย</h2>
      <p className="mt-1 mb-3 text-[12.5px] text-text-lo">
        พิมพ์ชื่อหรือเบอร์โทรลูกค้า แล้วกดชื่อเพื่อเลือกแพ็กเกจ ผู้ขาย และเทรนเนอร์ ลูกค้าใหม่ให้เพิ่มที่เมนู{" "}
        <Link href="/owner/members" className="text-volt">
          สมาชิก
        </Link>{" "}
        ก่อน
      </p>
      <div className="relative max-w-md">
        <Search size={15} className="absolute top-2.5 left-2.5 text-text-faint" />
        <Input placeholder="ชื่อหรือเบอร์โทรลูกค้า" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" aria-label="ค้นหาลูกค้าเพื่อสร้างรายการขาย" />
        {text.length >= 2 && (
          <div className="mt-1.5 overflow-hidden rounded-[10px] border border-border-strong bg-panel-raised">
            {matches.map((m) => (
              <Link
                key={m.id}
                href={`/owner/members/${m.id}#sell`}
                className="flex items-center justify-between gap-3 border-t border-border px-3.5 py-2.5 text-sm text-text-hi no-underline first:border-t-0 hover:text-volt"
              >
                <span>{m.name}</span>
                <span className="text-[12.5px] text-text-faint">{m.phone ?? "ไม่มีเบอร์โทร"}</span>
              </Link>
            ))}
            {matches.length === 0 && <div className="px-3.5 py-2.5 text-[13px] text-text-faint">ไม่พบลูกค้า</div>}
          </div>
        )}
      </div>
    </div>
  );
}
