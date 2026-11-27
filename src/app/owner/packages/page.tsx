import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Package, Promotion } from "@/types/database";
import { PackagesClient } from "./PackagesClient";

export const metadata = { title: "แพ็กเกจและโปรโมชั่น | S365 Fitness" };

export default async function PackagesPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const [packages, promotions] = await Promise.all([
    supabase.from("packages").select("*").eq("branch_id", branchId).order("kind").order("price"),
    supabase.from("promotions").select("*").eq("branch_id", branchId).order("created_at", { ascending: false }),
  ]);

  return (
    <PackagesClient
      packages={(packages.data ?? []) as Package[]}
      promotions={(promotions.data ?? []) as Promotion[]}
      canEdit={profile.role === "owner"}
      // The tables come from supabase/memberships.sql; say so if it has not been run yet.
      missingTables={Boolean(packages.error)}
    />
  );
}
