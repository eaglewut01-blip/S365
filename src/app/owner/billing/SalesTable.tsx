"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { SaleFiles } from "@/components/ProofLink";
import { formatDateTh } from "@/lib/dates";
import { formatBaht } from "@/lib/format";
import { PAYMENT_LABEL } from "@/lib/labels";
import type { PaymentMethod } from "@/types/database";

export type SaleRow = {
  id: string;
  memberId: string;
  memberName: string;
  kind: "membership" | "pt";
  isRenewal: boolean;
  packageName: string;
  amount: number;
  method: PaymentMethod;
  purchasedOn: string;
  seller: string;
  // A second seller sharing the sale, and the part of `amount` credited to them.
  seller2: string;
  seller2Amount: number;
  trainer: string;
  proof_path?: string | null;
  document_paths?: string[] | null;
};

const NONE = "ไม่ระบุ";
const sum = (rows: SaleRow[]) => rows.reduce((total, s) => total + s.amount, 0);
// A shared sale counts for both sellers, each with their own part of the amount.
const credits = (rows: SaleRow[]): SaleRow[] =>
  rows.flatMap((s) => (s.seller2Amount > 0 ? [{ ...s, amount: s.amount - s.seller2Amount }, { ...s, seller: s.seller2, amount: s.seller2Amount }] : [s]));
const people = (rows: SaleRow[]) => new Set(rows.map((s) => s.memberId)).size;

function Summary({ title, nameLabel, rows, by }: { title: string; nameLabel: string; rows: SaleRow[]; by: (s: SaleRow) => string }) {
  const groups = new Map<string, SaleRow[]>();
  for (const s of rows) groups.set(by(s) || NONE, [...(groups.get(by(s) || NONE) ?? []), s]);
  const list = [...groups.entries()].sort((a, b) => (a[0] === NONE ? 1 : b[0] === NONE ? -1 : sum(b[1]) - sum(a[1])));
  const cell = "px-3 py-2.5 text-right text-text-lo tabular-nums";
  return (
    <div className="min-w-0 flex-1">
      <h2 className="m-0 mb-2.5 font-heading text-[15px] text-text-hi">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[520px] border-collapse bg-panel text-left text-[13px]">
          <thead>
            <tr className="text-xs text-text-faint">
              <th scope="col" className="px-4 py-2.5 font-normal">{nameLabel}</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">รายการ</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">ลูกค้า</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">ใหม่</th>
              <th scope="col" className="px-3 py-2.5 text-right font-normal">ซื้อซ้ำ</th>
              <th scope="col" className="px-4 py-2.5 text-right font-normal">ยอดรวม</th>
            </tr>
          </thead>
          <tbody>
            {list.map(([name, items]) => (
              <tr key={name} className="border-t border-border">
                <th scope="row" className={`px-4 py-2.5 font-medium ${name === NONE ? "text-text-faint" : "text-text-hi"}`}>{name}</th>
                <td className={cell}>{items.length}</td>
                <td className={cell}>{people(items)}</td>
                <td className={cell}>{formatBaht(sum(items.filter((s) => !s.isRenewal)))}</td>
                <td className={cell}>{formatBaht(sum(items.filter((s) => s.isRenewal)))}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-text-hi tabular-nums">{formatBaht(sum(items))}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={6} className="px-4 py-4 text-center text-text-faint">ไม่มีรายการ</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// One month of sales with filters: what was sold, new or repeat, who sold it
// and who trains. The two summaries and the list all follow the filters.
export function SalesTable({ sales }: { sales: SaleRow[] }) {
  const [kind, setKind] = useState<"" | "membership" | "pt">("");
  const [renewal, setRenewal] = useState<"" | "new" | "repeat">("");
  const [seller, setSeller] = useState("");
  const [trainer, setTrainer] = useState("");

  const options = (pick: (s: SaleRow) => string) => [...new Set(sales.map((s) => pick(s) || NONE))].sort((a, b) => (a === NONE ? 1 : b === NONE ? -1 : a.localeCompare(b, "th")));
  const shown = sales.filter(
    (s) =>
      (!kind || s.kind === kind) &&
      (!renewal || (renewal === "repeat") === s.isRenewal) &&
      (!seller || (s.seller || NONE) === seller || (s.seller2Amount > 0 && s.seller2 === seller)) &&
      (!trainer || (s.trainer || NONE) === trainer)
  );
  // Money is counted per seller's part, so one seller's total is what they are credited with.
  const credited = credits(shown).filter((c) => !seller || (c.seller || NONE) === seller);
  const memberships = credited.filter((s) => s.kind === "membership");
  const pt = shown.filter((s) => s.kind === "pt");
  const ptCredited = credited.filter((s) => s.kind === "pt");
  const tile = "min-w-[150px] flex-1 rounded-xl border border-border bg-panel px-[18px] py-4";
  const filtered = Boolean(kind || renewal || seller || trainer);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-[12.5px] text-text-lo">
        <span>กรอง</span>
        <Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="กรองตามประเภท" className="!w-auto py-1.5 text-[12.5px]">
          <option value="">ทุกประเภท</option>
          <option value="membership">สมาชิกรายเดือน</option>
          <option value="pt">PT</option>
        </Select>
        <Select value={renewal} onChange={(e) => setRenewal(e.target.value as typeof renewal)} aria-label="กรองใหม่หรือซื้อซ้ำ" className="!w-auto py-1.5 text-[12.5px]">
          <option value="">ใหม่และซื้อซ้ำ</option>
          <option value="new">ลูกค้าใหม่</option>
          <option value="repeat">ซื้อซ้ำ</option>
        </Select>
        <Select value={seller} onChange={(e) => setSeller(e.target.value)} aria-label="กรองตามผู้ขาย" className="!w-auto py-1.5 text-[12.5px]">
          <option value="">ผู้ขายทุกคน</option>
          {[...new Set([...options((s) => s.seller), ...sales.filter((s) => s.seller2Amount > 0 && s.seller2).map((s) => s.seller2)])].map((name) => (
            <option key={name} value={name}>
              ผู้ขาย: {name}
            </option>
          ))}
        </Select>
        <Select value={trainer} onChange={(e) => setTrainer(e.target.value)} aria-label="กรองตามเทรนเนอร์" className="!w-auto py-1.5 text-[12.5px]">
          <option value="">เทรนเนอร์ทุกคน</option>
          {options((s) => (s.kind === "pt" ? s.trainer : "")).map((name) => (
            <option key={name} value={name}>
              เทรนเนอร์: {name}
            </option>
          ))}
        </Select>
        {filtered && (
          <button
            onClick={() => {
              setKind("");
              setRenewal("");
              setSeller("");
              setTrainer("");
            }}
            className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] text-volt underline"
          >
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="mb-[22px] flex flex-wrap gap-3.5">
        <div className={tile}>
          <div className="mb-2 text-[12.5px] text-text-lo">ยอดขายรวม</div>
          <div className="font-heading text-[28px] leading-none font-bold text-mint">{formatBaht(sum(credited))}</div>
          <div className="mt-1.5 text-xs text-text-faint">
            {shown.length} รายการ · ลูกค้า {people(shown)} คน
          </div>
        </div>
        <div className={tile}>
          <div className="mb-2 text-[12.5px] text-text-lo">สมาชิกรายเดือน</div>
          <div className="font-heading text-[28px] leading-none font-bold text-text-hi">{people(memberships)} คน</div>
          <div className="mt-1.5 text-xs text-text-faint">
            {formatBaht(sum(memberships))} · ใหม่ {people(memberships.filter((s) => !s.isRenewal))} คน · ซื้อซ้ำ {people(memberships.filter((s) => s.isRenewal))} คน
          </div>
        </div>
        <div className={tile}>
          <div className="mb-2 text-[12.5px] text-text-lo">PT</div>
          <div className="font-heading text-[28px] leading-none font-bold text-text-hi">{people(ptCredited)} คน</div>
          <div className="mt-1.5 text-xs text-text-faint">
            {formatBaht(sum(ptCredited))} · ใหม่ {people(ptCredited.filter((s) => !s.isRenewal))} คน · ซื้อซ้ำ {people(ptCredited.filter((s) => s.isRenewal))} คน
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-5 min-[1700px]:flex-row">
        <Summary title="ใครขายได้เท่าไร" nameLabel="ผู้ขาย" rows={credited} by={(s) => s.seller} />
        <Summary title="PT ของเทรนเนอร์แต่ละคน" nameLabel="เทรนเนอร์" rows={pt} by={(s) => s.trainer} />
      </div>

      <h2 className="m-0 mb-2.5 font-heading text-[15px] text-text-hi">รายการขาย {shown.length} รายการ</h2>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[860px] border-collapse bg-panel text-left text-[13px] text-text-lo">
          <thead>
            <tr className="text-xs text-text-faint">
              {["วันที่", "ลูกค้า", "รายการ", "ประเภท", "ยอดชำระ", "ผู้ขาย", "เทรนเนอร์"].map((head) => (
                <th key={head} scope="col" className="px-4 py-2.5 font-normal">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((s) => (
              <tr key={s.id} className="border-t border-border align-top">
                <td className="px-4 py-3 whitespace-nowrap">{formatDateTh(s.purchasedOn)}</td>
                <td className="px-4 py-3">
                  <Link href={`/owner/members/${s.memberId}`} className="font-medium text-text-hi no-underline hover:text-volt">
                    {s.memberName}
                  </Link>
                </td>
                <td className="px-4 py-3">{s.packageName}</td>
                <td className="px-4 py-3">
                  <Badge tone={s.kind === "pt" ? "due" : "active"}>
                    {s.kind === "pt" ? "PT" : "สมาชิก"} {s.isRenewal ? "ซื้อซ้ำ" : "ใหม่"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-text-hi">
                  {formatBaht(s.amount)}
                  <div className="text-xs text-text-faint">{PAYMENT_LABEL[s.method]}</div>
                  <SaleFiles purchase={s} />
                </td>
                <td className="px-4 py-3">
                  {s.seller2Amount > 0 ? (
                    <>
                      <div>
                        {s.seller || "-"} <span className="text-text-faint">{formatBaht(s.amount - s.seller2Amount)}</span>
                      </div>
                      <div>
                        {s.seller2 || "-"} <span className="text-text-faint">{formatBaht(s.seller2Amount)}</span>
                      </div>
                    </>
                  ) : (
                    s.seller || "-"
                  )}
                </td>
                <td className="px-4 py-3">{s.kind === "pt" ? s.trainer || "-" : ""}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr className="border-t border-border">
                <td colSpan={7} className="px-4 py-6 text-center text-text-faint">ไม่มีรายการขายตามที่เลือก</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
