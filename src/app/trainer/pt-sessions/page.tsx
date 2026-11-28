import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayBangkok } from "@/lib/dates";
import { SignOffClient, type SignClient, type SignedSession } from "./SignOffClient";

export const metadata = { title: "ให้ลูกค้าเซ็นรับการเทรน | S365 Fitness" };

// After a session the trainer opens this on their own phone, picks the
// client, and hands the phone over to be signed. Built for a phone first.
export default async function TrainerSignOffPage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const trainer = await requireRole("trainer");
  const supabase = await createClient();
  const today = todayBangkok();

  const [{ data: members }, { data: sessions }] = await Promise.all([
    supabase
      .from("members")
      .select("id, name, pt_total, pt_remaining, pt_trainer_id")
      .eq("branch_id", trainer.branch_id ?? "")
      .gt("pt_remaining", 0)
      .neq("status", "cancelled")
      .order("name")
      .limit(1000),
    supabase
      .from("pt_sessions")
      .select("id, session_date, session_time, status, signature, member:members(name)")
      .eq("trainer_id", trainer.id)
      .gte("session_date", addDays(today, -30))
      .order("logged_at", { ascending: false })
      .limit(200),
  ]);

  const clients: SignClient[] = ((members ?? []) as { id: string; name: string; pt_total: number; pt_remaining: number; pt_trainer_id: string | null }[]).map((m) => ({
    id: m.id,
    name: m.name,
    total: m.pt_total,
    left: m.pt_remaining,
    mine: m.pt_trainer_id === trainer.id,
  }));

  const signed: SignedSession[] = ((sessions ?? []) as unknown as { id: string; session_date: string; session_time: string; status: string; signature: string | null; member: { name: string } | null }[])
    .filter((s) => s.status === "approved")
    .map((s) => ({ id: s.id, date: s.session_date, time: s.session_time.slice(0, 5), name: s.member?.name ?? "", signature: s.signature }));

  const asked = (await searchParams).m;
  return <SignOffClient clients={clients} signed={signed} today={today} trainerName={trainer.full_name} startWith={asked} />;
}
