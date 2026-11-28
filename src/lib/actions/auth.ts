"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toLoginEmail } from "@/lib/staff-login";
import { AFTER_LOGIN_COOKIE } from "@/lib/supabase/middleware";
import type { Role } from "@/types/database";

const ROLE_HOME: Record<Role, string> = {
  owner: "/owner",
  staff: "/owner",
  trainer: "/trainer/schedule",
  member: "/member",
  pending: "/pending",
  left: "/pending",
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
    .select("*")
    .eq("id", data.user.id)
    .single();

  const role = profile?.role as Role | undefined;

  // They scanned the staff QR before signing in: finish the clock-in.
  const jar = await cookies();
  const after = jar.get(AFTER_LOGIN_COOKIE)?.value ?? "";
  if (after) jar.delete(AFTER_LOGIN_COOKIE);
  if (role && role !== "member" && role !== "pending" && role !== "left" && /^\/work(\?[\w=&%.~-]*)?$/.test(after)) redirect(after);

  // A shared counter account goes straight to the counter screen.
  redirect(role === "staff" && profile?.counter_only ? "/owner/checkin" : role ? ROLE_HOME[role] : "/login");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
