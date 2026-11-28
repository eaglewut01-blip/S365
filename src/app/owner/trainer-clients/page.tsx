import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/Card";
import { todayBangkok } from "@/lib/dates";
import { PT_LOW_HOURS, SLOT_LABEL, WORK_HOURS, hourLabel } from "@/lib/labels";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { Member, TrainerSlot } from "@/types/database";
import { ClientsTable, type PtClient, type TrainerCard } from "./ClientsTable";

export const metadata = { title: "ลูกค้า PT | S365 Fitness" };

// For the manager: who has PT hours, with which trainer, who is about to run
// out, and how full each trainer's day is.
export default async function TrainerClientsPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const [trainers, members, slots] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("branch_id", branchId).eq("role", "trainer").order("full_name"),
    fetchAll<Member>((from, to) =>
      supabase.from("members").select("*").eq("branch_id", branchId).neq("status", "cancelled").gt("pt_total", 0).order("id").range(from, to)
    ),
    supabase.from("trainer_slots").select("*").eq("branch_id", branchId).eq("work_date", todayBangkok()).order("hour"),
  ]);

  const day = (slots.data ?? []) as TrainerSlot[];
  const cards: TrainerCard[] = (trainers.data ?? []).map((t) => {
    const mine = day.filter((s) => s.trainer_id === t.id);
    return {
      id: t.id,
      name: t.full_name,
      filled: mine.length >= WORK_HOURS.length,
      busy: mine.filter((s) => s.kind === "pt" || s.kind === "trial").map((s) => `${hourLabel(s.hour)} ${s.client_name ?? SLOT_LABEL[s.kind]}`),
      free: mine.filter((s) => s.kind === "free").map((s) => hourLabel(s.hour)),
    };
  });
  const clients: PtClient[] = members.data.map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    total: m.pt_total,
    left: m.pt_remaining,
    trainerId: m.pt_trainer_id ?? null,
    legacyTrainer: m.legacy_trainer ?? null,
  }));

  return (
    <div className="p-4 sm:p-7">
      <PageHeader
        title="ลูกค้า PT"
        subtitle={`ลูกค้าที่ซื้อชั่วโมง PT ทั้งหมด แยกตามเทรนเนอร์ ใช้ดูว่าใครใกล้หมด (เหลือไม่เกิน ${PT_LOW_HOURS} ชั่วโมง) เพื่อโทรชวนซื้อต่อ และเทรนเนอร์คนไหนยังรับลูกค้าเพิ่มได้`}
      />
      {members.error ? (
        <div className="rounded-xl border border-amber bg-amber-bg p-[18px] text-[13.5px] leading-relaxed text-text-hi">
          ยังใช้หน้านี้ไม่ได้ ต้องเปิด Supabase → SQL Editor แล้วรันไฟล์ <code>supabase/memberships.sql</code> หนึ่งครั้งก่อน
        </div>
      ) : (
        <ClientsTable clients={clients} trainers={cards} />
      )}
    </div>
  );
}
