import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { Package, Profile } from "@/types/database";
import { SellClient, type Customer } from "@/app/owner/sell/SellClient";

export const metadata = { title: "ขาย | S365 Fitness" };

// Trainers sell too. Same sale screen as the sales team, with the seller
// fixed to the trainer who is signed in.
export default async function TrainerSellPage() {
  const profile = await requireRole("trainer");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const [customers, packages, team] = await Promise.all([
    fetchAll<Customer>((from, to) =>
      supabase.from("members").select("id, name, phone, membership_expires_on, pt_remaining, pt_trainer_id").eq("branch_id", branchId).neq("status", "cancelled").order("name").order("id").range(from, to)
    ),
    supabase.from("packages").select("*").eq("branch_id", branchId).eq("kind", "membership").eq("active", true).order("price"),
    supabase.from("profiles").select("*").eq("branch_id", branchId).in("role", ["owner", "staff", "trainer"]).order("full_name"),
  ]);

  // Until the database lets trainers see their team, at least offer themselves.
  const people: Pick<Profile, "id" | "full_name" | "role">[] = ((team.data ?? []) as Profile[]).filter((t) => !t.counter_only);
  const withSelf = people.some((p) => p.id === profile.id) ? people : [...people, { id: profile.id, full_name: profile.full_name, role: profile.role }];

  return (
    <SellClient
      customers={customers.data}
      packages={(packages.data ?? []) as Package[]}
      team={withSelf}
      currentUserId={profile.id}
      branchId={branchId}
      missingTables={Boolean(packages.error)}
      sellerLocked
    />
  );
}
