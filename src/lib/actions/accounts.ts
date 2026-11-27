"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/session";
import { requestOrigin } from "@/lib/request-origin";
import { LOGIN_ID_PATTERN, STAFF_LOGIN_DOMAIN, normalizeLoginId } from "@/lib/staff-login";
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

const MIN_STAFF_PASSWORD = 6;

type NewLogin = { fullName: string; loginId: string; password: string; role: Role; phone?: string };

function checkLogin(entry: NewLogin): string | null {
  if (!entry.fullName) return "กรอกชื่อ";
  if (!LOGIN_ID_PATTERN.test(entry.loginId)) return "ไอดีใช้ได้เฉพาะ a-z ตัวเลข จุด ขีด ยาว 2 ถึง 30 ตัว";
  if (entry.password.length < MIN_STAFF_PASSWORD) return `รหัสผ่านต้องยาวอย่างน้อย ${MIN_STAFF_PASSWORD} ตัว`;
  if (!["staff", "trainer"].includes(entry.role)) return "เลือกบทบาท";
  return null;
}

async function createLogin(entry: NewLogin, branchId: string): Promise<string | null> {
  const problem = checkLogin(entry);
  if (problem) return problem;
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: `${entry.loginId}@${STAFF_LOGIN_DOMAIN}`,
    password: entry.password,
    email_confirm: true,
    user_metadata: { role: entry.role, full_name: entry.fullName, phone: entry.phone ?? "", branch_id: branchId },
  });
  if (!error) return null;
  if (error.code === "email_exists" || /already/i.test(error.message)) return "ไอดีนี้มีคนใช้แล้ว";
  return error.message;
}

// Owner only: create a staff or trainer login with an ID and a password the
// owner chooses, with no email involved.
export async function createStaffLogin(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const owner = await requireRole("owner");
  if (!owner.branch_id) return { error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" };

  const problem = await createLogin(
    {
      fullName: String(formData.get("full_name") || "").trim(),
      loginId: normalizeLoginId(String(formData.get("login_id") || "")),
      password: String(formData.get("password") || ""),
      role: String(formData.get("role") || "trainer") as Role,
      phone: String(formData.get("phone") || "").trim(),
    },
    owner.branch_id
  );
  if (problem) return { error: problem };

  revalidatePath("/owner/team");
  return { success: true };
}

// Owner only: create several logins at once. One person per line:
// name, ID, password (separated by commas or tabs).
export async function createStaffLoginsBulk(formData: FormData): Promise<{ results: { line: string; error?: string }[] }> {
  const owner = await requireRole("owner");
  const role = String(formData.get("role") || "trainer") as Role;
  const lines = String(formData.get("lines") || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 60);

  const results: { line: string; error?: string }[] = [];
  for (const line of lines) {
    const [fullName = "", loginId = "", password = ""] = line.split(/[,\t]/).map((part) => part.trim());
    const label = `${fullName} (${loginId})`;
    if (!owner.branch_id) {
      results.push({ line: label, error: "บัญชีนี้ยังไม่ได้ผูกกับสาขา" });
      continue;
    }
    const problem = await createLogin({ fullName, loginId: normalizeLoginId(loginId), password, role }, owner.branch_id);
    results.push(problem ? { line: label, error: problem } : { line: label });
  }

  revalidatePath("/owner/team");
  return { results };
}

// Owner only: set a new password for someone on the team (ID accounts have
// no email to recover with).
export async function setStaffPassword(userId: string, password: string): Promise<{ error?: string; success?: boolean }> {
  const owner = await requireRole("owner");
  if (password.length < MIN_STAFF_PASSWORD) return { error: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_STAFF_PASSWORD} ตัว` };

  const supabase = await createClient();
  const { data: target } = await supabase.from("profiles").select("id, role, branch_id").eq("id", userId).maybeSingle();
  if (!target || target.branch_id !== owner.branch_id || !["staff", "trainer"].includes(target.role)) {
    return { error: "ไม่พบทีมงานคนนี้" };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return { success: true };
}

async function pendingApplicant(userId: string, ownerBranch: string | null) {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, role, branch_id").eq("id", userId).maybeSingle();
  return data && data.role === "pending" && data.branch_id === ownerBranch ? data : null;
}

// Owner only: let someone who signed up on their own into the system.
export async function approveApplicant(userId: string, role: "trainer" | "staff"): Promise<{ error?: string; success?: boolean }> {
  const owner = await requireRole("owner");
  if (role !== "trainer" && role !== "staff") return { error: "เลือกบทบาท" };
  if (!(await pendingApplicant(userId, owner.branch_id))) return { error: "ไม่พบคำขอนี้" };

  // profiles.role is not writable through row level security by design.
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ role }).eq("id", userId).eq("role", "pending");
  if (error) return { error: error.message };

  revalidatePath("/owner/team");
  return { success: true };
}

// Owner only: turn down a sign-up and remove the account.
export async function rejectApplicant(userId: string): Promise<{ error?: string; success?: boolean }> {
  const owner = await requireRole("owner");
  if (!(await pendingApplicant(userId, owner.branch_id))) return { error: "ไม่พบคำขอนี้" };

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/owner/team");
  return { success: true };
}
