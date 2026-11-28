import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { MyClients, type MyClient } from "./MyClients";

export const metadata = { title: "ลูกค้าของฉัน | S365 Fitness" };

// Every client tied to the trainer who is signed in, and nobody else's.
export default async function TrainerClientsPage() {
  const trainer = await requireRole("trainer");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("members")
    .select("id, name, phone, pt_total, pt_remaining, membership_expires_on, last_visit")
    .eq("branch_id", trainer.branch_id ?? "")
    .eq("pt_trainer_id", trainer.id)
    .neq("status", "cancelled")
    .order("name")
    .limit(1000);

  const clients: MyClient[] = ((data ?? []) as { id: string; name: string; phone: string | null; pt_total: number; pt_remaining: number; membership_expires_on: string | null; last_visit: string | null }[]).map((m) => ({
    id: m.id,
    name: m.name,
    phone: m.phone,
    total: m.pt_total,
    left: m.pt_remaining,
    expiresOn: m.membership_expires_on,
    lastVisit: m.last_visit,
  }));

  return <MyClients clients={clients} loadError={error?.message ?? ""} />;
}
