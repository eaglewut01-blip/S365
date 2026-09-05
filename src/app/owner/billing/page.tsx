import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/database";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("branch_id", profile.branch_id ?? "")
    .order("billing_status", { ascending: false });

  return <BillingClient members={(members ?? []) as Member[]} />;
}
