import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { PtSessionsClient, type PtSessionRow } from "./PtSessionsClient";

export default async function OwnerPtSessionsPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("pt_sessions")
    .select("*, member:members(name, pt_total, pt_remaining), trainer:profiles(full_name)")
    .eq("branch_id", profile.branch_id ?? "")
    .order("session_date", { ascending: false })
    .order("session_time", { ascending: false });

  return <PtSessionsClient sessions={(sessions ?? []) as unknown as PtSessionRow[]} />;
}
