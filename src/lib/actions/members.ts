"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import type { MemberStatus } from "@/types/database";

// Tapping the status badge switches between active and paused only; removing
// a member is its own button (removeMember) so it cannot happen by a stray tap.

export async function cycleMemberStatus(memberId: string, currentStatus: MemberStatus) {
  await requireRole("owner", "staff");
  const supabase = await createClient();

  const next = currentStatus === "active" ? "frozen" : "active";
  const { error } = await supabase.from("members").update({ status: next }).eq("id", memberId);
  if (error) return { error: error.message };

  revalidatePath("/owner/members");
  return { success: true };
}

// Owner only: take a member off every list. The row is kept (status
// "cancelled") so past sales, check-ins and PT sessions stay intact, and the
// member can be brought back.
export async function removeMember(memberId: string): Promise<{ error?: string; success?: boolean }> {
  await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ status: "cancelled" }).eq("id", memberId);
  if (error) return { error: error.message };
  revalidatePath("/owner/members");
  revalidatePath(`/owner/members/${memberId}`);
  return { success: true };
}

export async function restoreMember(memberId: string): Promise<{ error?: string; success?: boolean }> {
  await requireRole("owner");
  const supabase = await createClient();
  const { error } = await supabase.from("members").update({ status: "active" }).eq("id", memberId).eq("status", "cancelled");
  if (error) return { error: error.message };
  revalidatePath("/owner/members");
  revalidatePath(`/owner/members/${memberId}`);
  return { success: true };
}
