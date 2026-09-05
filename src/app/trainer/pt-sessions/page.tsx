import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/database";
import { TrainerPtSessionsClient, type TrainerPtSession } from "./TrainerPtSessionsClient";

export default async function TrainerPtSessionsPage() {
  const trainer = await requireRole("trainer");
  const supabase = await createClient();

  const [{ data: ptMembers }, { data: sessions }] = await Promise.all([
    supabase
      .from("members")
      .select("*")
      .eq("branch_id", trainer.branch_id ?? "")
      .gt("pt_total", 0)
      .eq("status", "active")
      .order("name"),
    supabase
      .from("pt_sessions")
      .select("*, member:members(name, pt_total, pt_remaining)")
      .eq("trainer_id", trainer.id)
      .order("logged_at", { ascending: false }),
  ]);

  return (
    <TrainerPtSessionsClient
      ptMembers={(ptMembers ?? []) as Member[]}
      sessions={(sessions ?? []) as unknown as TrainerPtSession[]}
    />
  );
}
