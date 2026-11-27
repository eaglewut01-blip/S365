"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { deletePromotion, savePackage, savePromotion, setPackageActive, setPromotionActive } from "@/lib/actions/packages";
import { formatBaht } from "@/lib/format";
import { AUDIENCE_LABEL, packageTerms } from "@/lib/labels";
import type { Package, PackageKind, Promotion, PromotionAudience } from "@/types/database";

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1.5 block text-[12.5px] text-text-lo">{label}</span>
      {children}
    </label>
  );
}

function PackageForm({ pkg, onClose }: { pkg?: Package; onClose: () => void }) {
  const [kind, setKind] = useState<PackageKind>(pkg?.kind ?? "membership");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await savePackage(formData);
          if (res.error) setError(res.error);
          else onClose();
        })
      }
      className="mb-4 rounded-xl border border-border bg-panel-raised p-[18px]"
    >
      <div className="mb-3 flex justify-between">
        <h3 className="m-0 font-heading text-[15px] text-text-hi">{pkg ? "แก้ไขแพ็กเกจ" : "เพิ่มแพ็กเกจ"}</h3>
        <button type="button" onClick={onClose} aria-label="ปิด" className="cursor-pointer border-none bg-transparent text-text-faint">
          <X size={16} />
        </button>
      </div>
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="ประเภท">
          <Select name="kind" value={kind} onChange={(e) => setKind(e.target.value as PackageKind)}>
            <option value="membership">สมาชิก</option>
            <option value="pt">PT เทรนเนอร์</option>
          </Select>
        </Field>
        <Field label="ชื่อแพ็กเกจ" className="col-span-2 sm:col-span-2">
          <Input name="name" defaultValue={pkg?.name} placeholder={kind === "pt" ? "เช่น PT 12 ชั่วโมง" : "เช่น 3 เดือน แถม 1 เดือน"} required />
        </Field>
        <Field label="ราคา (บาท)">
          <Input name="price" type="number" min={0} step="1" inputMode="numeric" defaultValue={pkg?.price ?? ""} required />
        </Field>
        {kind === "membership" ? (
          <>
            <Field label="อายุ (เดือน)">
              <Input name="months" type="number" min={0} inputMode="numeric" defaultValue={pkg?.months ?? ""} />
            </Field>
            <Field label="แถม (เดือน)">
              <Input name="bonus_months" type="number" min={0} inputMode="numeric" defaultValue={pkg?.bonus_months || ""} />
            </Field>
            <Field label="แถม (วัน)">
              <Input name="bonus_days" type="number" min={0} inputMode="numeric" defaultValue={pkg?.bonus_days || ""} />
            </Field>
          </>
        ) : (
          <>
            <Field label="จำนวนชั่วโมง">
              <Input name="sessions" type="number" min={0} inputMode="numeric" defaultValue={pkg?.sessions ?? ""} />
            </Field>
            <Field label="แถม (ชั่วโมง)">
              <Input name="bonus_sessions" type="number" min={0} inputMode="numeric" defaultValue={pkg?.bonus_sessions || ""} />
            </Field>
          </>
        )}
        <Field label="หมายเหตุ (ไม่บังคับ)" className="col-span-2 sm:col-span-4">
          <Input name="note" defaultValue={pkg?.note ?? ""} placeholder="เช่น โปรเดือนธันวาคม" />
        </Field>
      </div>
      {error && <div className="mt-2.5 text-[12.5px] text-coral">{error}</div>}
      <Button type="submit" variant="primary" disabled={pending} className="mt-4">
        {pending ? "กำลังบันทึก..." : "บันทึกแพ็กเกจ"}
      </Button>
    </form>
  );
}

function PromotionForm({ promo, onClose }: { promo?: Promotion; onClose: () => void }) {
  const [audience, setAudience] = useState<PromotionAudience>(promo?.audience ?? "membership_expiring");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          const res = await savePromotion(formData);
          if (res.error) setError(res.error);
          else onClose();
        })
      }
      className="mb-4 rounded-xl border border-border bg-panel-raised p-[18px]"
    >
      <div className="mb-3 flex justify-between">
        <h3 className="m-0 font-heading text-[15px] text-text-hi">{promo ? "แก้ไขโปรโมชั่น" : "เพิ่มโปรโมชั่น"}</h3>
        <button type="button" onClick={onClose} aria-label="ปิด" className="cursor-pointer border-none bg-transparent text-text-faint">
          <X size={16} />
        </button>
      </div>
      {promo && <input type="hidden" name="id" value={promo.id} />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="หัวข้อ" className="col-span-2">
          <Input name="title" defaultValue={promo?.title} placeholder="เช่น ต่ออายุวันนี้ แถม 1 เดือน" required />
        </Field>
        <Field label="แสดงกับ">
          <Select name="audience" value={audience} onChange={(e) => setAudience(e.target.value as PromotionAudience)}>
            <option value="membership_expiring">{AUDIENCE_LABEL.membership_expiring}</option>
            <option value="pt_low">{AUDIENCE_LABEL.pt_low}</option>
            <option value="all">{AUDIENCE_LABEL.all}</option>
          </Select>
        </Field>
        {audience === "membership_expiring" && (
          <Field label="ก่อนหมดอายุกี่วัน">
            <Input name="days_before" type="number" min={0} inputMode="numeric" defaultValue={promo?.days_before ?? 7} />
          </Field>
        )}
        {audience === "pt_low" && (
          <Field label="เมื่อเหลือไม่เกิน (ชั่วโมง)">
            <Input name="pt_at_most" type="number" min={0} inputMode="numeric" defaultValue={promo?.pt_at_most ?? 2} />
          </Field>
        )}
        <Field label="รายละเอียด" className="col-span-2 sm:col-span-4">
          <textarea
            name="body"
            defaultValue={promo?.body}
            rows={3}
            placeholder="ข้อความที่ลูกค้าจะเห็นหลังเช็กอิน"
            className="w-full rounded-lg border border-border bg-panel-raised px-3 py-2 font-body text-[13.5px] text-text-hi outline-none placeholder:text-text-faint"
          />
        </Field>
      </div>
      {error && <div className="mt-2.5 text-[12.5px] text-coral">{error}</div>}
      <Button type="submit" variant="primary" disabled={pending} className="mt-4">
        {pending ? "กำลังบันทึก..." : "บันทึกโปรโมชั่น"}
      </Button>
    </form>
  );
}

export function PackagesClient({
  packages,
  promotions,
  canEdit,
  missingTables,
}: {
  packages: Package[];
  promotions: Promotion[];
  canEdit: boolean;
  missingTables: boolean;
}) {
  const [packageForm, setPackageForm] = useState<Package | "new" | null>(null);
  const [promoForm, setPromoForm] = useState<Promotion | "new" | null>(null);
  const [, startTransition] = useTransition();

  if (missingTables) {
    return (
      <div className="p-4 sm:p-7">
        <PageHeader title="แพ็กเกจและโปรโมชั่น" />
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      </div>
    );
  }

  const groups: { kind: PackageKind; title: string }[] = [
    { kind: "membership", title: "แพ็กเกจสมาชิก" },
    { kind: "pt", title: "แพ็กเกจ PT เทรนเนอร์" },
  ];

  return (
    <div className="p-4 sm:p-7">
      <PageHeader
        title="แพ็กเกจและโปรโมชั่น"
        subtitle={canEdit ? "สร้างแพ็กเกจที่ขายอยู่ตอนนี้ แพ็กเกจที่เลิกขายให้กดซ่อน ประวัติการขายเดิมยังอยู่ครบ" : "ดูได้อย่างเดียว เจ้าของเป็นผู้สร้างและแก้ไข"}
        action={
          canEdit && (
            <Button variant="primary" onClick={() => setPackageForm("new")}>
              <Plus size={14} /> เพิ่มแพ็กเกจ
            </Button>
          )
        }
      />

      {packageForm && (
        <PackageForm
          key={packageForm === "new" ? "new" : packageForm.id}
          pkg={packageForm === "new" ? undefined : packageForm}
          onClose={() => setPackageForm(null)}
        />
      )}

      {groups.map((group) => {
        const rows = packages.filter((p) => p.kind === group.kind);
        return (
          <section key={group.kind} className="mb-6">
            <h2 className="m-0 mb-2.5 font-heading text-[15px] text-text-hi">{group.title}</h2>
            <div className="overflow-hidden rounded-xl border border-border">
              {rows.length === 0 && <div className="bg-panel px-4 py-5 text-[13px] text-text-faint">ยังไม่มีแพ็กเกจ</div>}
              {rows.map((p) => (
                <div
                  key={p.id}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border bg-panel px-4 py-3 first:border-t-0 ${p.active ? "" : "opacity-55"}`}
                >
                  <div className="min-w-[160px] flex-1">
                    <div className="font-body text-[13.5px] font-medium text-text-hi">{p.name}</div>
                    <div className="text-xs text-text-faint">
                      {packageTerms(p)}
                      {p.note ? ` · ${p.note}` : ""}
                    </div>
                  </div>
                  <div className="font-body text-[13.5px] font-semibold text-text-hi">{formatBaht(Number(p.price))}</div>
                  <Badge tone={p.active ? "active" : "neutral"}>{p.active ? "ขายอยู่" : "ซ่อน"}</Badge>
                  {canEdit && (
                    <div className="flex gap-3 text-[12.5px]">
                      <button onClick={() => setPackageForm(p)} className="cursor-pointer border-none bg-transparent p-0 text-text-lo hover:text-volt">
                        แก้ไข
                      </button>
                      <button
                        onClick={() => startTransition(async () => void (await setPackageActive(p.id, !p.active)))}
                        className="cursor-pointer border-none bg-transparent p-0 text-text-lo hover:text-volt"
                      >
                        {p.active ? "ซ่อน" : "กลับมาขาย"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <div className="mb-2.5 mt-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="m-0 font-heading text-[15px] text-text-hi">โปรโมชั่นต่ออายุ</h2>
          <p className="mt-1 text-[12.5px] text-text-lo">ลูกค้าเห็นหลังสแกนเช็กอินและในหน้าสมาชิก เมื่อเข้าเงื่อนไขที่ตั้งไว้</p>
        </div>
        {canEdit && (
          <Button onClick={() => setPromoForm("new")}>
            <Plus size={14} /> เพิ่มโปรโมชั่น
          </Button>
        )}
      </div>

      {promoForm && (
        <PromotionForm
          key={promoForm === "new" ? "new" : promoForm.id}
          promo={promoForm === "new" ? undefined : promoForm}
          onClose={() => setPromoForm(null)}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        {promotions.length === 0 && <div className="bg-panel px-4 py-5 text-[13px] text-text-faint">ยังไม่มีโปรโมชั่น</div>}
        {promotions.map((promo) => (
          <div key={promo.id} className={`border-t border-border bg-panel px-4 py-3 first:border-t-0 ${promo.active ? "" : "opacity-55"}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <div className="min-w-[160px] flex-1 font-body text-[13.5px] font-medium text-text-hi">{promo.title}</div>
              <Badge tone="due">
                {AUDIENCE_LABEL[promo.audience]}
                {promo.audience === "membership_expiring" ? ` ${promo.days_before} วัน` : ""}
                {promo.audience === "pt_low" ? ` (เหลือ ${promo.pt_at_most} ชม.)` : ""}
              </Badge>
              <Badge tone={promo.active ? "active" : "neutral"}>{promo.active ? "เปิดอยู่" : "ปิด"}</Badge>
              {canEdit && (
                <div className="flex gap-3 text-[12.5px]">
                  <button onClick={() => setPromoForm(promo)} className="cursor-pointer border-none bg-transparent p-0 text-text-lo hover:text-volt">
                    แก้ไข
                  </button>
                  <button
                    onClick={() => startTransition(async () => void (await setPromotionActive(promo.id, !promo.active)))}
                    className="cursor-pointer border-none bg-transparent p-0 text-text-lo hover:text-volt"
                  >
                    {promo.active ? "ปิด" : "เปิด"}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`ลบโปรโมชั่น "${promo.title}"`)) startTransition(async () => void (await deletePromotion(promo.id)));
                    }}
                    className="cursor-pointer border-none bg-transparent p-0 text-text-lo hover:text-coral"
                  >
                    ลบ
                  </button>
                </div>
              )}
            </div>
            {promo.body && <p className="mt-1.5 mb-0 whitespace-pre-line text-[12.5px] leading-relaxed text-text-lo">{promo.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
