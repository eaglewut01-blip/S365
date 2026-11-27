import Link from "next/link";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { todayBangkok } from "@/lib/dates";
import { PT_LOW_HOURS, SLOT_LABEL, WORK_HOURS, hourLabel } from "@/lib/labels";
import type { Member, TrainerSlot } from "@/types/database";

export const metadata = { title: "ลูกค้า PT ของเทรนเนอร์ | S365 Fitness" };

type Client = Pick<Member, "id" | "name" | "phone" | "pt_total" | "pt_remaining" | "pt_trainer_id">;

function ClientList({ title, tone, clients }: { title: string; tone: string; clients: Client[] }) {
  if (clients.length === 0) return null;
  return (
    <div className="mt-3">
      <div className={`text-[12.5px] font-semibold ${tone}`}>
        {title} {clients.length} คน
      </div>
      <ul className="m-0 mt-1 list-none p-0">
        {clients.map((c) => (
          <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-3 border-t border-border py-1.5 text-[13px] first:border-t-0">
            <Link href={`/owner/members/${c.id}`} className="font-medium text-text-hi no-underline hover:text-volt">
              {c.name}
            </Link>
            <span className="text-text-lo">
              เหลือ {c.pt_remaining}/{c.pt_total} ชม. · {c.phone ?? "ไม่มีเบอร์โทร"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// For the manager: each trainer's PT clients, who is about to run out of
// hours, and how full the trainer's day is, so new clients can be placed.
export default async function TrainerClientsPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";
  const today = todayBangkok();

  const [trainers, members, slots] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("branch_id", branchId).eq("role", "trainer").order("full_name"),
    supabase
      .from("members")
      .select("id, name, phone, pt_total, pt_remaining, pt_trainer_id")
      .eq("branch_id", branchId)
      .neq("status", "cancelled")
      .gt("pt_total", 0)
      .order("pt_remaining"),
    supabase.from("trainer_slots").select("*").eq("branch_id", branchId).eq("work_date", today).order("hour"),
  ]);

  const team = trainers.data ?? [];
  const clients = (members.data ?? []) as Client[];
  const daySlots = (slots.data ?? []) as TrainerSlot[];
  const known = new Set(team.map((t) => t.id));
  const unassigned = clients.filter((c) => c.pt_remaining > 0 && (!c.pt_trainer_id || !known.has(c.pt_trainer_id)));

  return (
    <div className="p-4 sm:p-7">
      <PageHeader
        title="ลูกค้า PT ของเทรนเนอร์"
        subtitle={`ลูกค้าในมือของแต่ละคน ใครใกล้หมด (เหลือไม่เกิน ${PT_LOW_HOURS} ชั่วโมง) และวันนี้ตารางเต็มหรือยัง`}
      />

      {members.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : (
        <>
          {unassigned.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber bg-amber-bg p-[18px]">
              <div className="text-[13.5px] font-semibold text-text-hi">ลูกค้า PT ที่ยังไม่ได้ระบุเทรนเนอร์ {unassigned.length} คน</div>
              <p className="mt-1 mb-0 text-[12.5px] text-text-lo">กดชื่อแล้วเลือกเทรนเนอร์ที่ดูแล PT เพื่อให้ขึ้นในรายชื่อของเทรนเนอร์</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
                {unassigned.map((c) => (
                  <Link key={c.id} href={`/owner/members/${c.id}`} className="text-text-hi underline decoration-text-faint hover:text-volt">
                    {c.name} ({c.pt_remaining} ชม.)
                  </Link>
                ))}
              </div>
            </div>
          )}

          {team.length === 0 && (
            <div className="rounded-xl border border-border bg-panel p-[18px] text-[13.5px] text-text-lo">
              ยังไม่มีบัญชีเทรนเนอร์ เจ้าของเชิญเทรนเนอร์ได้ที่เมนู ทีมงาน
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {team.map((t) => {
              const mine = clients.filter((c) => c.pt_trainer_id === t.id);
              const active = mine.filter((c) => c.pt_remaining > 0);
              const low = active.filter((c) => c.pt_remaining <= PT_LOW_HOURS);
              const out = mine.filter((c) => c.pt_remaining === 0);
              const day = daySlots.filter((s) => s.trainer_id === t.id);
              const busy = day.filter((s) => s.kind === "pt" || s.kind === "trial");
              const free = day.filter((s) => s.kind === "free");
              // Hours the trainer has not filled in are unknown, not free and not full.
              const unfilled = WORK_HOURS.length - day.length;

              return (
                <section key={t.id} className="rounded-xl border border-border bg-panel p-[18px]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="m-0 font-heading text-[17px] text-text-hi">{t.full_name}</h2>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone="active">ในมือ {active.length} คน</Badge>
                      {low.length > 0 && <Badge tone="due">ใกล้หมด {low.length}</Badge>}
                      {out.length > 0 && <Badge tone="overdue">หมดแล้ว {out.length}</Badge>}
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-border bg-panel-raised px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-text-lo">
                      <span>ตารางวันนี้</span>
                      {day.length === 0 ? (
                        <Badge tone="due">ยังไม่ลงตาราง</Badge>
                      ) : free.length > 0 ? (
                        <Badge tone="active">ว่าง {free.length} ชม.</Badge>
                      ) : unfilled > 0 ? (
                        <Badge tone="due">ยังลงไม่ครบ อีก {unfilled} ช่อง</Badge>
                      ) : (
                        <Badge tone="overdue">เต็ม ไม่มีช่องว่าง</Badge>
                      )}
                    </div>
                    {day.length > 0 && (
                      <div className="mt-1.5 text-[13px] leading-relaxed">
                        <div className="text-text-hi">
                          ติดลูกค้า {busy.length} ชม.
                          {busy.length > 0 && (
                            <span className="text-text-lo">
                              {" "}
                              · {busy.map((s) => `${hourLabel(s.hour)} ${s.client_name ?? SLOT_LABEL[s.kind]}`).join(", ")}
                            </span>
                          )}
                        </div>
                        {free.length > 0 && <div className="text-mint">ว่าง · {free.map((s) => hourLabel(s.hour)).join(", ")}</div>}
                      </div>
                    )}
                  </div>

                  <ClientList title="ใกล้หมด ควรชวนซื้อต่อ" tone="text-amber" clients={low} />
                  <ClientList title="ชั่วโมงหมดแล้ว" tone="text-coral" clients={out} />
                  {active.length > low.length && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[12.5px] text-text-lo hover:text-text-hi">
                        ลูกค้าที่ยังเหลือชั่วโมงอีกมาก {active.length - low.length} คน
                      </summary>
                      <ClientList title="กำลังเทรนอยู่" tone="text-text-lo" clients={active.filter((c) => c.pt_remaining > PT_LOW_HOURS)} />
                    </details>
                  )}
                  {mine.length === 0 && <p className="mt-3 mb-0 text-[13px] text-text-faint">ยังไม่มีลูกค้า PT ที่ระบุชื่อเทรนเนอร์คนนี้</p>}
                </section>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
