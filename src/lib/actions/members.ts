"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { MemberStatus } from "@/types/database";

const STATUS_CYCLE: MemberStatus[] = ["active", "frozen", "cancelled"];

export async function cycleMemberStatus(memberId: string, currentStatus: MemberStatus) {
  await requireRole("owner", "staff");
  const supabase = await createClient();

  const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(currentStatus) + 1) % STATUS_CYCLE.length];
  const { error } = await supabase.from("members").update({ status: next }).eq("id", memberId);
  if (error) return { error: error.message };

  revalidatePath("/owner/members");
  return { success: true };
}
