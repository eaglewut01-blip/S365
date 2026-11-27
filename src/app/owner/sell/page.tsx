import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { Package, Profile } from "@/types/database";
import { SellClient, type Customer } from "./SellClient";

export const metadata = { title: "ขาย | S365 Fitness" };

// One screen for a seller: pick or add the customer, sell a membership, PT
// hours or both, choose the trainer, and save.
export default async function SellPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const [customers, packages, team] = await Promise.all([
    fetchAll<Customer>((from, to) =>
      supabase
        .from("members")
        .select("id, name, phone, membership_expires_on, pt_remaining, pt_trainer_id")
        .eq("branch_id", branchId)
        .neq("status", "cancelled")
        .order("name")
        .order("id")
        .range(from, to)
    ),
    supabase.from("packages").select("*").eq("branch_id", branchId).eq("kind", "membership").eq("active", true).order("price"),
    supabase.from("profiles").select("id, full_name, role").eq("branch_id", branchId).in("role", ["owner", "staff", "trainer"]).order("full_name"),
  ]);

  return (
    <SellClient
      customers={customers.data}
      packages={(packages.data ?? []) as Package[]}
      team={(team.data ?? []) as Pick<Profile, "id" | "full_name" | "role">[]}
      currentUserId={profile.id}
      branchId={branchId}
      missingTables={Boolean(packages.error)}
    />
  );
}
