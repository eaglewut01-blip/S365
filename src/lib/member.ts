import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/database";

export async function getCurrentMember(profileId: string): Promise<Member | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("members").select("*").eq("profile_id", profileId).single();
  return data as Member | null;
}
