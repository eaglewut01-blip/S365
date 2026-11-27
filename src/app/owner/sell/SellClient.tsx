"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleCheck, Paperclip, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { recordSale, type SaleResult } from "@/lib/actions/purchases";
import { expiryLabel, membershipEnd, suggestedStart, todayBangkok } from "@/lib/dates";
import { formatBaht } from "@/lib/format";
import { PAYMENT_LABEL, packageTerms } from "@/lib/labels";
import { uploadPaymentProof } from "@/lib/payment-proof";
import type { Package, Profile } from "@/types/database";

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  membership_expires_on: string | null;
  pt_remaining: number;
  pt_trainer_id: string | null;
};
type TeamMember = Pick<Profile, "id" | "full_name" | "role">;

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[12.5px] text-text-lo">{label}</span>
      {children}
    </label>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-border bg-panel p-[18px]">
      <h2 className="m-0 mb-3 flex items-center gap-2 font-heading text-[15px] text-text-hi">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-volt font-body text-[12.5px] font-bold text-volt-ink">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

const toggleClass = (active: boolean) =>
  `cursor-pointer rounded-lg border px-3.5 py-2 font-body text-[13.5px] font-semibold ${
    active ? "border-volt bg-volt/10 text-volt" : "border-border bg-transparent text-text-lo hover:text-text-hi"
  }`;

function SaleForm({
  customers,
  packages,
  team,
  currentUserId,
  branchId,
  onDone,
}: {
  customers: Customer[];
  packages: Package[];
  team: TeamMember[];
  currentUserId: string;
  branchId: string;
  onDone: (result: SaleResult) => void;
}) {
  const [isNew, setIsNew] = useState(false);
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [sellMembership, setSellMembership] = useState(false);
  const [sellPt, setSellPt] = useState(false);
  const [packageId, setPackageId] = useState("");
  const [startsOn, setStartsOn] = useState(todayBangkok());
  const [endsTyped, setEndsTyped] = useState("");
  const [membershipAmount, setMembershipAmount] = useState("");
  const [hours, setHours] = useState("");
  const [bonus, setBonus] = useState("");
  const [perHour, setPerHour] = useState("");
  const [ptTyped, setPtTyped] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [proof, setProof] = useState<{ path: string; name: string } | null>(null);
  const [proofState, setProofState] = useState<{ uploading?: boolean; error?: string }>({});

  const attach = async (file: File | undefined) => {
    if (!file) return;
    setProofState({ uploading: true });
    try {
      setProof({ path: await uploadPaymentProof(branchId, file), name: file.name });
      setProofState({});
    } catch (e) {
      setProof(null);
      setProofState({ error: e instanceof Error ? e.message : "แนบไฟล์ไม่สำเร็จ" });
    }
  };

  const text = query.trim().toLowerCase();
  const digits = text.replace(/\D/g, "");
  const matches =
    text.length < 2
      ? []
      : customers.filter((c) => c.name.toLowerCase().includes(text) || (digits.length >= 3 && (c.phone ?? "").replace(/\D/g, "").includes(digits))).slice(0, 8);

  const pkg = packages.find((p) => p.id === packageId);
  const endsOn = endsTyped || (pkg && startsOn ? membershipEnd(startsOn, pkg.months, pkg.bonus_months, pkg.bonus_days) : "");
  const h = Math.max(0, Math.floor(Number(hours) || 0));
  const free = Math.max(0, Math.floor(Number(bonus) || 0));
  const ptAmount = ptTyped || (h > 0 && Number(perHour) > 0 ? String(Math.round(h * Number(perHour))) : "");
  const total = (sellMembership ? Number(membershipAmount) || 0 : 0) + (sellPt ? Number(ptAmount) || 0 : 0);
  const trainers = team.filter((t) => t.role === "trainer");

  const pick = (c: Customer) => {
    setCustomer(c);
    setQuery("");
    setStartsOn(suggestedStart(c.membership_expires_on));
    setEndsTyped("");
  };

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await recordSale(formData);
          if (res.success) onDone(res);
          else setError(res.error ?? "บันทึกไม่สำเร็จ");
        })
      }
    >
      <Step n={1} title="ลูกค้า">
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" aria-pressed={!isNew} onClick={() => setIsNew(false)} className={toggleClass(!isNew)}>
            ลูกค้าเดิม
          </button>
          <button
            type="button"
            aria-pressed={isNew}
            onClick={() => {
              setIsNew(true);
              setCustomer(null);
              setStartsOn(todayBangkok());
              setEndsTyped("");
            }}
            className={toggleClass(isNew)}
          >
            ลูกค้าใหม่
          </button>
        </div>

        {isNew ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="ชื่อ-นามสกุล">
              <Input name="new_name" required />
            </Field>
            <Field label="เบอร์โทร (ใช้ตอนสแกนเช็กอิน)">
              <Input name="new_phone" type="tel" inputMode="numeric" placeholder="08xxxxxxxx" />
            </Field>
          </div>
        ) : customer ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-panel-raised px-3.5 py-3">
            <input type="hidden" name="member_id" value={customer.id} />
            <div>
              <div className="text-[14.5px] font-semibold text-text-hi">{customer.name}</div>
              <div className="text-xs text-text-lo">
                {customer.phone ?? "ไม่มีเบอร์โทร"} · {expiryLabel(customer.membership_expires_on)} · PT เหลือ {customer.pt_remaining} ชั่วโมง
              </div>
            </div>
            <button type="button" onClick={() => setCustomer(null)} className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] text-volt underline">
              เปลี่ยนลูกค้า
            </button>
          </div>
        ) : (
          <div className="relative max-w-md">
            <Search size={15} className="absolute top-2.5 left-2.5 text-text-faint" />
            <Input placeholder="พิมพ์ชื่อหรือเบอร์โทรลูกค้า" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" aria-label="ค้นหาลูกค้า" />
            {text.length >= 2 && (
              <div className="mt-1.5 overflow-hidden rounded-[10px] border border-border-strong bg-panel-raised">
                {matches.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pick(c)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 border-x-0 border-t border-b-0 border-border bg-transparent px-3.5 py-2.5 text-left text-sm text-text-hi first:border-t-0 hover:text-volt"
                  >
                    <span>{c.name}</span>
                    <span className="text-[12.5px] text-text-faint">{c.phone ?? "ไม่มีเบอร์โทร"}</span>
                  </button>
                ))}
                {matches.length === 0 && <div className="px-3.5 py-2.5 text-[13px] text-text-faint">ไม่พบลูกค้า กดปุ่ม ลูกค้าใหม่ เพื่อเพิ่ม</div>}
              </div>
            )}
          </div>
        )}
      </Step>

      <Step n={2} title="ขายอะไร (เลือกได้ทั้งสองอย่าง)">
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" aria-pressed={sellMembership} onClick={() => setSellMembership((v) => !v)} className={toggleClass(sellMembership)}>
            สมาชิกรายเดือน
          </button>
          <button type="button" aria-pressed={sellPt} onClick={() => setSellPt((v) => !v)} className={toggleClass(sellPt)}>
            PT เทรนเนอร์ (ขายเป็นชั่วโมง)
          </button>
        </div>

        {sellMembership && (
          <div className="mb-3 rounded-lg border border-border p-3.5">
            <div className="mb-2.5 text-[13px] font-semibold text-text-hi">สมาชิกรายเดือน</div>
            {packages.length === 0 ? (
              <p className="m-0 text-[13px] text-amber">
                ยังไม่มีแพ็กเกจสมาชิก เจ้าของสร้างได้ที่เมนู{" "}
                <Link href="/owner/packages" className="text-volt">
                  แพ็กเกจ
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="แพ็กเกจ" className="col-span-2">
                  <Select
                    name="package_id"
                    value={packageId}
                    onChange={(e) => {
                      const next = packages.find((p) => p.id === e.target.value);
                      setPackageId(e.target.value);
                      setMembershipAmount(next ? String(Number(next.price)) : "");
                      setEndsTyped("");
                    }}
                    required
                  >
                    <option value="">เลือกแพ็กเกจ</option>
                    {packages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({packageTerms(p)})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="วันเริ่ม">
                  <Input
                    name="starts_on"
                    type="date"
                    value={startsOn}
                    onChange={(e) => {
                      setStartsOn(e.target.value);
                      setEndsTyped("");
                    }}
                    required
                  />
                </Field>
                <Field label="วันหมดอายุ (แก้ได้)">
                  <Input name="ends_on" type="date" value={endsOn} onChange={(e) => setEndsTyped(e.target.value)} required />
                </Field>
                <Field label="ยอดชำระค่าสมาชิก (บาท)" className="col-span-2">
                  <Input name="membership_amount" type="number" min={0} step="1" inputMode="numeric" value={membershipAmount} onChange={(e) => setMembershipAmount(e.target.value)} required />
                </Field>
              </div>
            )}
          </div>
        )}

        {sellPt && (
          <div className="rounded-lg border border-border p-3.5">
            <div className="mb-2.5 text-[13px] font-semibold text-text-hi">PT เทรนเนอร์</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="ชั่วโมงที่ซื้อ">
                <Input name="pt_hours" type="number" min={1} step="1" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} required />
              </Field>
              <Field label="ชั่วโมงแถม">
                <Input name="pt_bonus" type="number" min={0} step="1" inputMode="numeric" value={bonus} onChange={(e) => setBonus(e.target.value)} placeholder="0" />
              </Field>
              <Field label="ราคาต่อชั่วโมง (บาท)">
                <Input
                  type="number"
                  min={0}
                  step="1"
                  inputMode="numeric"
                  value={perHour}
                  onChange={(e) => {
                    setPerHour(e.target.value);
                    setPtTyped("");
                  }}
                  placeholder="ไม่บังคับ"
                />
              </Field>
              <Field label="ยอดชำระค่า PT (บาท)">
                <Input name="pt_amount" type="number" min={0} step="1" inputMode="numeric" value={ptAmount} onChange={(e) => setPtTyped(e.target.value)} required />
              </Field>
              <Field label="เทรนเนอร์ที่เทรนให้" className="col-span-2">
                <Select name="pt_trainer_id" key={customer?.id ?? "new"} defaultValue={customer?.pt_trainer_id ?? ""} required>
                  <option value="">เลือกเทรนเนอร์</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {trainers.length === 0 && (
              <p className="mt-2.5 mb-0 text-[12.5px] text-amber">
                ยังไม่มีบัญชีเทรนเนอร์ให้เลือก เจ้าของสร้างได้ที่เมนู{" "}
                <Link href="/owner/team" className="text-volt">
                  ทีมงาน
                </Link>
              </p>
            )}
            {h > 0 && (
              <p className="mt-2.5 mb-0 text-[12.5px] text-text-lo">
                ลูกค้าจะได้ {h + free} ชั่วโมง ({h} ซื้อ{free ? ` + ${free} แถม` : ""})
                {Number(ptAmount) > 0 ? ` · เฉลี่ยชั่วโมงละ ${formatBaht(Math.round(Number(ptAmount) / (h + free)))}` : ""}
              </p>
            )}
          </div>
        )}

        {!sellMembership && !sellPt && <p className="m-0 text-[13px] text-text-faint">กดเลือกอย่างน้อยหนึ่งอย่าง</p>}
      </Step>

      <Step n={3} title="การชำระและผู้ขาย">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="ผู้ขาย (ใช้คิดค่าคอม)">
            <Select name="sold_by" defaultValue={currentUserId} required>
              <option value="">เลือกผู้ขาย</option>
              {team.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </Select>
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
          <Field label="หมายเหตุ (ไม่บังคับ)" className="col-span-2 sm:col-span-1">
            <Input name="note" placeholder="เช่น โปรพิเศษ" />
          </Field>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 text-[12.5px] text-text-lo">หลักฐานการชำระเงิน (ไม่บังคับ) เช่น สลิปโอนเงิน หรือใบเสร็จบัตร</div>
          <input type="hidden" name="proof_path" value={proof?.path ?? ""} />
          {proof ? (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-mint bg-panel-raised px-3.5 py-2.5 text-[13px]">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-mint">
                <Paperclip size={13} className="flex-shrink-0" /> <span className="truncate">แนบแล้ว: {proof.name}</span>
              </span>
              <button type="button" onClick={() => setProof(null)} className="cursor-pointer border-none bg-transparent p-0 text-[12.5px] text-text-lo underline hover:text-coral">
                เอาออก
              </button>
            </div>
          ) : (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-strong px-3.5 py-2.5 font-body text-[13.5px] font-semibold text-text-hi hover:bg-white/5">
              <Paperclip size={14} /> {proofState.uploading ? "กำลังแนบ..." : "แนบรูปภาพ"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={proofState.uploading}
                onChange={(e) => {
                  void attach(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {proofState.error && <div className="mt-1.5 text-[12.5px] text-coral">แนบไฟล์ไม่สำเร็จ: {proofState.error}</div>}
        </div>
      </Step>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-3 border-t border-border bg-base px-4 py-3 sm:mx-0 sm:px-0">
        <Button type="submit" variant="primary" disabled={pending || Boolean(proofState.uploading) || (!sellMembership && !sellPt) || (!isNew && !customer)} className="px-6 py-2.5">
          {pending ? "กำลังบันทึก..." : "บันทึกการขาย"}
        </Button>
        <span className="font-body text-[15px] font-semibold text-text-hi">รวม {formatBaht(total)}</span>
        {error && <span className="text-[12.5px] text-coral">{error}</span>}
      </div>
    </form>
  );
}

export function SellClient({
  customers,
  packages,
  team,
  currentUserId,
  branchId,
  missingTables,
}: {
  customers: Customer[];
  packages: Package[];
  team: TeamMember[];
  currentUserId: string;
  branchId: string;
  missingTables: boolean;
}) {
  const [done, setDone] = useState<SaleResult | null>(null);
  // A new key gives the next sale an empty form.
  const [round, setRound] = useState(0);

  return (
    <div className="max-w-3xl p-4 sm:p-7">
      <PageHeader title="ขาย" subtitle="หน้าเดียวจบ: เลือกลูกค้า ขายสมาชิกหรือชั่วโมง PT เลือกเทรนเนอร์ แล้วบันทึก" />

      {missingTables ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : done ? (
        <div className="rounded-xl border border-mint bg-panel p-6 text-center">
          <CircleCheck size={44} className="mx-auto text-mint" strokeWidth={1.8} />
          <h2 className="m-0 mt-3 font-heading text-[22px] text-text-hi">บันทึกการขายแล้ว</h2>
          <p className="mt-1.5 mb-0 text-[15px] text-text-hi">{done.memberName}</p>
          <ul className="m-0 mt-2 list-none p-0 text-[13.5px] text-text-lo">
            {(done.lines ?? []).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap justify-center gap-2.5">
            <Button
              variant="primary"
              onClick={() => {
                setDone(null);
                setRound((n) => n + 1);
              }}
            >
              ขายรายการต่อไป
            </Button>
            {done.memberId && (
              <Link
                href={`/owner/members/${done.memberId}`}
                className="inline-flex items-center rounded-lg border border-border-strong px-3.5 py-2 font-body text-[13.5px] font-semibold text-text-hi no-underline hover:bg-white/5"
              >
                ดูข้อมูลลูกค้า
              </Link>
            )}
          </div>
        </div>
      ) : (
        <SaleForm key={round} customers={customers} packages={packages} team={team} currentUserId={currentUserId} branchId={branchId} onDone={setDone} />
      )}
    </div>
  );
}
