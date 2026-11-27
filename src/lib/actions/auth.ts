"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toLoginEmail } from "@/lib/staff-login";
import type { Role } from "@/types/database";

const ROLE_HOME: Record<Role, string> = {
  owner: "/owner",
  staff: "/owner",
  trainer: "/trainer",
  member: "/member",
  pending: "/pending",
};

export async function login(_prevState: { error: string } | null, formData: FormData) {
  // An email address, or a staff ID created by the owner.
  const email = toLoginEmail(String(formData.get("email") || ""));
  const password = String(formData.get("password") || "");

  if (!String(formData.get("email") || "").trim() || !password) {
    return { error: "กรอกไอดีหรืออีเมล และรหัสผ่านให้ครบก่อน" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "ไอดีหรือรหัสผ่านไม่ถูกต้อง" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role as Role | undefined;
  redirect(role ? ROLE_HOME[role] : "/login");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
