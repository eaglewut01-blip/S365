"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { StatTile } from "@/components/ui/StatTile";
import { changePurchaseEnd, deletePurchase, sellPackage, updateMemberDetails } from "@/lib/actions/purchases";
import { expiryLabel, expiryState, formatDateTh, membershipEnd, suggestedStart, todayBangkok } from "@/lib/dates";
import { formatBaht } from "@/lib/format";
import { PAYMENT_LABEL, packageTerms } from "@/lib/labels";
import type { Member, MemberPurchase, Package, Profile } from "@/types/database";

type TeamMember = Pick<Profile, "id" | "full_name" | "role">;

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[12.5px] text-text-lo">{label}</span>
      {children}
    </label>
  );
}

function SellForm({ member, packages, team, currentUserId }: { member: Member; packages: Package[]; team: TeamMember[]; currentUserId: string }) {
  const [packageId, setPackageId] = useState("");
  const pkg = packages.find((p) => p.id === packageId);
  const [startsOn, setStartsOn] = useState(() => suggestedStart(member.membership_expires_on));
  // Staff may type a different end date; until they do, it follows the package.
  const [endsOnTyped, setEndsOnTyped] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<{ error?: string; success?: boolean }>({});
  const [pending, startTransition] = useTransition();

  const computedEnd = pkg?.kind === "membership" && startsOn ? membershipEnd(startsOn, pkg.months, pkg.bonus_months, pkg.bonus_days) : "";
  const endsOn = endsOnTyped || computedEnd;

  if (packages.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-panel p-[18px] text-[13.5px] text-text-lo">
        ยังไม่มีแพ็กเกจที่ขายอยู่ เจ้าของสร้างได้ที่เมนู{" "}
        <Link href="/owner/packages" className="text-volt">
          แพ็กเกจ
        </Link>
      </div>
    );
  }

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await sellPackage(formData);
          setMessage(res);
          if (res.success) {
            setPackageId("");
            setAmount("");
            setEndsOnTyped("");
          }
        })
      }
      className="rounded-xl border border-border bg-panel p-[18px]"
    >
      <h2 className="m-0 mb-3 font-heading text-[15px] text-text-hi">บันทึกการซื้อแพ็กเกจ</h2>
      <input type="hidden" name="member_id" value={member.id} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="แพ็กเกจ" className="col-span-2">
          <Select
            name="package_id"
            value={packageId}
            onChange={(e) => {
              const next = packages.find((p) => p.id === e.target.value);
              setPackageId(e.target.value);
              setAmount(next ? String(Number(next.price)) : "");
              setEndsOnTyped("");
            }}
            required
          >
            <option value="">เลือกแพ็กเกจ</option>
            <optgroup label="สมาชิก">
              {packages.filter((p) => p.kind === "membership").map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({packageTerms(p)})
                </option>
              ))}
            </optgroup>
            <optgroup label="PT เทรนเนอร์">
              {packages.filter((p) => p.kind === "pt").map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({packageTerms(p)})
                </option>
              ))}
            </optgroup>
          </Select>
        </Field>
        <Field label="ยอดชำระ (บาท)">
          <Input name="amount" type="number" min={0} step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Field>
        <Field label="วิธีชำระ">
          <Select name="payment_method" defaultValue="transfer">
            {Object.entries(PAYMENT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="วันที่ซื้อ">
          <Input name="purchased_on" type="date" defaultValue={todayBangkok()} required />
        </Field>
        {pkg?.kind === "membership" && (
          <>
            <Field label="วันเริ่ม">
              <Input
                name="starts_on"
                type="date"
                value={startsOn}
                onChange={(e) => {
                  setStartsOn(e.target.value);
                  setEndsOnTyped("");
                }}
                required
              />
            </Field>
            <Field label="วันหมดอายุ (แก้ได้)">
              <Input name="ends_on" type="date" value={endsOn} onChange={(e) => setEndsOnTyped(e.target.value)} required />
            </Field>
          </>
        )}
        {pkg?.kind === "pt" && (
          <Field label="เทรนเนอร์ที่ดูแล">
            <Select name="pt_trainer_id" defaultValue={member.pt_trainer_id ?? ""}>
              <option value="">ยังไม่ระบุ</option>
              {team.filter((t) => t.role === "trainer").map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="ผู้ขาย">
          <Select name="sold_by" defaultValue={currentUserId}>
            <option value="">ไม่ระบุ</option>
            {team.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="หมายเหตุ (ไม่บังคับ)" className="col-span-2 sm:col-span-4">
          <Input name="note" placeholder="เช่น รอเริ่ม หรือ โปรพิเศษ" />
        </Field>
      </div>
      {pkg?.kind === "pt" && (
        <p className="mt-3 mb-0 text-[12.5px] text-text-lo">
          จะเพิ่มชั่วโมง PT ให้ {pkg.sessions + pkg.bonus_sessions} ชั่วโมง (ตอนนี้เหลือ {member.pt_remaining} ชั่วโมง)
        </p>
      )}
      {message.error && <div className="mt-2.5 text-[12.5px] text-coral">{message.error}</div>}
      {message.success && <div className="mt-2.5 text-[12.5px] text-mint">บันทึกแล้ว</div>}
      <Button type="submit" variant="primary" disabled={pending} className="mt-4">
        {pending ? "กำลังบันทึก..." : "บันทึกการซื้อ"}
      </Button>
    </form>
  );
}

function PurchaseRow({ purchase, memberId, sellerName, isOwner }: { purchase: MemberPurchase; memberId: string; sellerName: string; isOwner: boolean }) {
  const [editing, setEditing] = useState(false);
  const [endsOn, setEndsOn] = useState(purchase.ends_on ?? "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="border-t border-border bg-panel px-4 py-3 first:border-t-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="min-w-[150px] flex-1">
          <div className="font-body text-[13.5px] font-medium text-text-hi">
            {purchase.package_name} <span className="ml-1 text-xs font-normal text-text-faint">{purchase.is_renewal ? "ซื้อซ้ำ" : "ซื้อครั้งแรก"}</span>
          </div>
          <div className="text-xs text-text-faint">
            ซื้อ {formatDateTh(purchase.purchased_on)} · {PAYMENT_LABEL[purchase.payment_method]}
            {sellerName ? ` · ขายโดย ${sellerName}` : ""}
          </div>
        </div>
        <div className="text-[13px] text-text-lo">
          {purchase.kind === "membership"
            ? `${formatDateTh(purchase.starts_on)} ถึง ${formatDateTh(purchase.ends_on)}`
            : `${purchase.pt_sessions} ชั่วโมง`}
        </div>
        <div className="font-body text-[13.5px] font-semibold text-text-hi">{formatBaht(Number(purchase.amount))}</div>
        <div className="flex gap-3 text-[12.5px]">
          {purchase.kind === "membership" && (
            <button onClick={() => setEditing((v) => !v)} className="cursor-pointer border-none bg-transparent p-0 text-text-lo hover:text-volt">
              แก้วันหมดอายุ
            </button>
          )}
          {isOwner && (
            <button
              disabled={pending}
              onClick={() => {
                if (window.confirm(`ลบรายการ "${purchase.package_name}" วันหมดอายุ ชั่วโมง PT และรายได้จะถูกปรับตาม`)) {
                  startTransition(async () => {
                    const res = await deletePurchase(purchase.id, memberId);
                    if (res.error) setError(res.error);
                  });
                }
              }}
              className="cursor-pointer border-none bg-transparent p-0 text-text-lo hover:text-coral"
            >
              ลบ
            </button>
          )}
        </div>
      </div>
      {purchase.note && <div className="mt-1 text-xs text-text-lo">หมายเหตุ: {purchase.note}</div>}
      {editing && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <Input type="date" value={endsOn} onChange={(e) => setEndsOn(e.target.value)} className="w-44" aria-label="วันหมดอายุใหม่" />
          <Button
            variant="primary"
            disabled={pending || !endsOn}
            onClick={() =>
              startTransition(async () => {
                const res = await changePurchaseEnd(purchase.id, memberId, endsOn);
                if (res.error) setError(res.error);
                else {
                  setError("");
                  setEditing(false);
                }
              })
            }
          >
            บันทึก
          </Button>
          <span className="text-xs text-text-faint">ใช้เมื่อพักสมาชิกหรือขยายเวลาให้</span>
        </div>
      )}
      {error && <div className="mt-1.5 text-[12.5px] text-coral">{error}</div>}
    </div>
  );
}

export function MemberDetailClient({
  member,
  purchases,
  packages,
  team,
  currentUserId,
  isOwner,
  missingTables,
}: {
  member: Member;
  purchases: MemberPurchase[];
  packages: Package[];
  team: TeamMember[];
  currentUserId: string;
  isOwner: boolean;
  missingTables: boolean;
}) {
  const [detailMessage, setDetailMessage] = useState<{ error?: string; success?: boolean }>({});
  const [pending, startTransition] = useTransition();
  const names = useMemo(() => new Map(team.map((t) => [t.id, t.full_name])), [team]);
  const expiry = expiryState(member.membership_expires_on);

  return (
    <div className="max-w-4xl p-4 sm:p-7">
      <Link href="/owner/members" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-text-lo hover:text-text-hi">
        <ArrowLeft size={13} /> สมาชิกทั้งหมด
      </Link>
      <h1 className="m-0 font-heading text-2xl font-bold text-text-hi">{member.name}</h1>

      <div className="mt-4 mb-5 flex flex-wrap gap-3.5">
        <StatTile
          label="อายุสมาชิก"
          value={expiryLabel(member.membership_expires_on)}
          sub={member.membership_expires_on ? `ถึง ${formatDateTh(member.membership_expires_on)}` : undefined}
          tone={expiry.state === "expired" ? "coral" : expiry.state === "soon" ? "amber" : expiry.state === "ok" ? "mint" : undefined}
        />
        <StatTile
          label="ชั่วโมง PT คงเหลือ"
          value={member.pt_total > 0 ? `${member.pt_remaining}/${member.pt_total}` : "-"}
          tone={member.pt_total > 0 && member.pt_remaining <= 2 ? "amber" : undefined}
        />
        <StatTile label="เข้าใช้ทั้งหมด" value={member.visit_count} sub={member.last_visit ? `ล่าสุด ${formatDateTh(member.last_visit)}` : "ยังไม่เคยมา"} />
      </div>

      <form
        action={(formData) => startTransition(async () => setDetailMessage(await updateMemberDetails(formData)))}
        className="mb-5 rounded-xl border border-border bg-panel p-[18px]"
      >
        <h2 className="m-0 mb-3 font-heading text-[15px] text-text-hi">ข้อมูลติดต่อ</h2>
        <input type="hidden" name="member_id" value={member.id} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.4fr_1fr_1fr_auto] sm:items-end">
          <Field label="ชื่อ-นามสกุล">
            <Input name="name" defaultValue={member.name} required />
          </Field>
          <Field label="เบอร์โทร (ใช้ตอนสแกนเช็กอิน)">
            <Input name="phone" type="tel" inputMode="tel" defaultValue={member.phone ?? ""} />
          </Field>
          <Field label="เทรนเนอร์ที่ดูแล PT">
            <Select name="pt_trainer_id" defaultValue={member.pt_trainer_id ?? ""}>
              <option value="">ยังไม่ระบุ</option>
              {team.filter((t) => t.role === "trainer").map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
          </Field>
          <Button type="submit" disabled={pending}>
            บันทึก
          </Button>
        </div>
        {detailMessage.error && <div className="mt-2.5 text-[12.5px] text-coral">{detailMessage.error}</div>}
        {detailMessage.success && <div className="mt-2.5 text-[12.5px] text-mint">บันทึกแล้ว</div>}
        <div className="mt-3 flex items-center gap-2 text-xs text-text-faint">
          สถานะ <Badge tone={member.status}>{member.status === "active" ? "ใช้งานอยู่" : member.status === "frozen" ? "พักการใช้" : "ยกเลิก"}</Badge>
          <span>เปลี่ยนสถานะได้จากหน้ารายชื่อสมาชิก</span>
        </div>
      </form>

      {missingTables ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังบันทึกการซื้อแพ็กเกจไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : (
        <>
          <SellForm member={member} packages={packages} team={team} currentUserId={currentUserId} />

          <h2 className="m-0 mt-6 mb-2.5 font-heading text-[15px] text-text-hi">ประวัติการซื้อ</h2>
          <div className="overflow-hidden rounded-xl border border-border">
            {purchases.length === 0 && <div className="bg-panel px-4 py-5 text-[13px] text-text-faint">ยังไม่มีรายการ</div>}
            {purchases.map((p) => (
              <PurchaseRow key={p.id} purchase={p} memberId={member.id} sellerName={p.sold_by ? names.get(p.sold_by) ?? "" : ""} isOwner={isOwner} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
