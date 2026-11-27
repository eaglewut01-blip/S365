"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { requestOrigin } from "@/lib/request-origin";
import type { Role } from "@/types/database";

// Owner-only: create a login for a new staff member or trainer.
// Sends a Supabase invite email so they set their own password.
export async function createStaffAccount(formData: FormData) {
  const owner = await requireRole("owner");

  const email = String(formData.get("email") || "").trim();
  const fullName = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const role = String(formData.get("role") || "staff") as Role;

  if (!email || !fullName || !["staff", "trainer"].includes(role)) {
    return { error: "กรอกข้อมูลให้ครบถ้วน" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { role, full_name: fullName, phone, branch_id: owner.branch_id },
    // The invite email opens the page where they choose a password.
    redirectTo: `${await requestOrigin()}/reset-password`,
  });

  if (error) return { error: error.message };

  revalidatePath("/owner/team");
  return { success: true };
}

// Owner/staff: link an existing walk-in member to a new login so they can
// use the customer portal. Sends an invite email; the profile row is
// created automatically by the handle_new_user trigger, we just link it.
export async function inviteMemberAccount(memberId: string, email: string) {
  const staffer = await requireRole("owner", "staff");
  const supabase = await createClient();

  const { data: member } = await supabase
    .from("members")
    .select("id, name, phone, branch_id, profile_id")
    .eq("id", memberId)
    .single();

  if (!member) return { error: "ไม่พบข้อมูลสมาชิก" };
  if (member.profile_id) return { error: "สมาชิกคนนี้มีบัญชีอยู่แล้ว" };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      role: "member",
      full_name: member.name,
      phone: member.phone,
      branch_id: member.branch_id ?? staffer.branch_id,
    },
    redirectTo: `${await requestOrigin()}/reset-password`,
  });

  if (error || !data.user) return { error: error?.message ?? "ส่งคำเชิญไม่สำเร็จ" };

  const { error: linkError } = await supabase
    .from("members")
    .update({ profile_id: data.user.id })
    .eq("id", memberId);

  if (linkError) return { error: linkError.message };

  revalidatePath("/owner/members");
  return { success: true };
}
