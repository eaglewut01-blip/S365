"use server";

import { adminKeyProblem, createAdminClient, setAccountProfile } from "@/lib/supabase/admin";
import { LOGIN_ID_PATTERN, STAFF_LOGIN_DOMAIN, normalizeLoginId } from "@/lib/staff-login";

// `values` hands back what was typed, so a mistake does not clear the form.
export type SignupState = { error?: string; done?: boolean; loginId?: string; values?: { fullName: string; loginId: string; phone: string } } | null;

// Enough for a whole team to sign up at once, and a ceiling on junk sign-ups.
const MAX_WAITING = 30;

// A trainer or staff member asks for an account. It is created as "pending":
// it can sign in but opens nothing until the owner approves it on the team page.
export async function applyForAccount(_prev: SignupState, formData: FormData): Promise<SignupState> {
  // A field people never see; programs that fill in every field give themselves away.
  if (String(formData.get("website") || "")) return { done: true };

  const fullName = String(formData.get("full_name") || "").trim();
  const loginId = normalizeLoginId(String(formData.get("login_id") || ""));
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const phone = String(formData.get("phone") || "").trim();

  const values = { fullName, loginId, phone };
  const fail = (error: string): SignupState => ({ error, values });

  if (!fullName) return fail("กรอกชื่อที่ใช้เรียก");
  if (fullName.length > 60) return fail("ชื่อยาวเกินไป");
  if (!LOGIN_ID_PATTERN.test(loginId)) return fail("ไอดีใช้ได้เฉพาะ a-z ตัวเลข จุด ขีด ยาว 2 ถึง 30 ตัว");
  if (password.length < 6) return fail("รหัสผ่านต้องยาวอย่างน้อย 6 ตัว");
  if (password !== confirm) return fail("รหัสผ่านสองช่องไม่ตรงกัน");

  if (await adminKeyProblem()) return fail("ระบบยังไม่พร้อมรับสมัคร แจ้งเจ้าของยิม");
  const admin = createAdminClient();
  const { data: branch } = await admin.from("branches").select("id").order("created_at").limit(1).maybeSingle();
  if (!branch) return fail("ระบบยังไม่พร้อมรับสมัคร แจ้งเจ้าของยิม");

  const { count } = await admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "pending");
  if ((count ?? 0) >= MAX_WAITING) return fail("มีคำขอรออนุมัติจำนวนมาก แจ้งเจ้าของยิมให้อนุมัติก่อน แล้วลองใหม่");

  const { data: created, error } = await admin.auth.admin.createUser({
    email: `${loginId}@${STAFF_LOGIN_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, phone },
  });
  if (error || !created.user) {
    if (error && (error.code === "email_exists" || /already/i.test(error.message))) return fail("ไอดีนี้มีคนใช้แล้ว ลองไอดีอื่น");
    return fail("สมัครไม่สำเร็จ แจ้งเจ้าของยิม");
  }
  if (await setAccountProfile(admin, created.user.id, { role: "pending", full_name: fullName, phone, branch_id: branch.id })) {
    await admin.auth.admin.deleteUser(created.user.id);
    return fail("สมัครไม่สำเร็จ แจ้งเจ้าของยิม");
  }
  return { done: true, loginId };
}
