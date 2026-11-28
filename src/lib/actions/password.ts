"use server";

import { redirect } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requestOrigin } from "@/lib/request-origin";
import type { Role } from "@/types/database";

const ROLE_HOME: Record<Role, string> = {
  owner: "/owner",
  staff: "/owner",
  trainer: "/trainer/schedule",
  member: "/member",
  pending: "/pending",
};

const MIN_PASSWORD_LENGTH = 8;

export type PasswordFormState = { error?: string; sent?: boolean } | null;

// "Forgot password": email a link that opens /reset-password.
// The answer is the same whether or not the email has an account, so the
// form cannot be used to find out who is registered.
export async function requestPasswordReset(_prev: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "กรอกอีเมลก่อน" };
  // An ID account has no mailbox: the owner sets a new password for it.
  if (!email.includes("@")) return { error: "บัญชีที่เข้าด้วยไอดี ให้แจ้งเจ้าของตั้งรหัสผ่านใหม่ให้ที่เมนูทีมงาน" };

  // A link from the email must work on any device, so this request uses the
  // token-in-link flow instead of the cookie-bound one the app client uses.
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await requestOrigin()}/reset-password`,
  });

  if (error?.status === 429) {
    return { error: "ขอลิงก์บ่อยเกินไป รอสักครู่แล้วลองใหม่" };
  }
  if (error && error.status !== 400 && error.status !== 404 && error.status !== 422) {
    return { error: "ส่งอีเมลไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }
  return { sent: true };
}

// Sets the password for the person who opened an invite or reset link
// (the link's tokens arrive in the form), or for whoever is signed in.
export async function setPassword(_prev: PasswordFormState, formData: FormData): Promise<PasswordFormState> {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  const accessToken = String(formData.get("access_token") || "");
  const refreshToken = String(formData.get("refresh_token") || "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `รหัสผ่านต้องยาวอย่างน้อย ${MIN_PASSWORD_LENGTH} ตัวอักษร` };
  }
  if (password !== confirm) return { error: "รหัสผ่านสองช่องไม่ตรงกัน" };

  const supabase = await createClient();

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) return { error: "ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้ที่หน้าลืมรหัสผ่าน" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว ขอลิงก์ใหม่ได้ที่หน้าลืมรหัสผ่าน" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" };
    if (error.code === "weak_password") return { error: "รหัสผ่านนี้เดาง่ายเกินไป ลองตั้งให้ยาวขึ้นหรือผสมตัวเลข" };
    return { error: "ตั้งรหัสผ่านไม่สำเร็จ ลองใหม่อีกครั้ง" };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role as Role | undefined;
  redirect(role ? ROLE_HOME[role] : "/login");
}
