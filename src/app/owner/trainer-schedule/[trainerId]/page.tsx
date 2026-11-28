import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { DayNav, dateParam } from "@/components/DayNav";
import { DayBoard, type BoardClient } from "@/components/DayBoard";
import type { TrainerSlot } from "@/types/database";

export const metadata = { title: "ลงตารางแทนเทรนเนอร์ | S365 Fitness" };

// The manager fills in or corrects one trainer's day.
export default async function TrainerDayPage({ params, searchParams }: { params: Promise<{ trainerId: string }>; searchParams: Promise<{ d?: string }> }) {
  const { trainerId } = await params;
  const profile = await requireRole("owner", "staff");
  const date = dateParam((await searchParams).d);
  const supabase = await createClient();

  const { data: trainer } = await supabase.from("profiles").select("id, full_name, role, branch_id").eq("id", trainerId).maybeSingle();
  if (!trainer || trainer.role !== "trainer" || trainer.branch_id !== profile.branch_id) notFound();

  const [slots, clients] = await Promise.all([
    supabase.from("trainer_slots").select("*").eq("trainer_id", trainerId).eq("work_date", date),
    supabase.from("members").select("id, name, pt_remaining").eq("pt_trainer_id", trainerId).gt("pt_remaining", 0).neq("status", "cancelled").order("name"),
  ]);

  return (
    <div className="max-w-2xl p-4 sm:p-7">
      <Link href={`/owner/trainer-schedule?d=${date}`} className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-text-lo hover:text-text-hi">
        <ArrowLeft size={13} /> ตารางทั้งทีม
      </Link>
      <h1 className="m-0 mb-4 font-heading text-2xl font-bold text-text-hi">ตารางของ {trainer.full_name}</h1>
      <DayNav basePath={`/owner/trainer-schedule/${trainerId}`} date={date} />
      <DayBoard
        key={date}
        date={date}
        trainerId={trainerId}
        slots={(slots.data ?? []) as TrainerSlot[]}
        clients={(clients.data ?? []).map((c) => ({ id: c.id, name: c.name, hoursLeft: c.pt_remaining })) as BoardClient[]}
      />
    </div>
  );
}
