import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fetchAll } from "@/lib/supabase/fetch-all";
import type { Member } from "@/types/database";
import { MembersClient } from "./MembersClient";

export default async function MembersPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();

  const { data: members } = await fetchAll<Member>((from, to) =>
    supabase.from("members").select("*").eq("branch_id", profile.branch_id ?? "").order("name").order("id").range(from, to)
  );

  return <MembersClient members={members} />;
}
