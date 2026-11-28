import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. Server-only. Never import this from
// a Client Component or expose SUPABASE_SERVICE_ROLE_KEY to the browser.
// Used only for privileged admin actions such as creating login accounts
// for members/trainers (see lib/actions/accounts.ts).
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type AdminClient = ReturnType<typeof createAdminClient>;

// Roles and branches are written here, by the server, and never taken from
// what a sign-up request says about itself: the database trigger gives every
// new account the lowest role, then this sets the real one.
export async function setAccountProfile(
  admin: AdminClient,
  userId: string,
  profile: { role: string; full_name: string; phone?: string | null; branch_id: string | null }
): Promise<string | null> {
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, role: profile.role, full_name: profile.full_name, phone: profile.phone || null, branch_id: profile.branch_id });
  return error ? error.message : null;
}

// Why accounts cannot be created, in words the owner can act on. Empty when
// the key works. Looks only at the key's label, never shows the key itself.
export async function adminKeyProblem(): Promise<string> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!key) return "ยังไม่ได้ใส่ค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel";
  if (key.startsWith("sb_publishable_")) return "ค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel เป็นคีย์ publishable ต้องใช้คีย์ service_role (หรือ secret)";
  const payload = key.split(".")[1];
  if (payload) {
    try {
      const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; ref?: string };
      if (claims.role === "anon") return "ค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel เป็นคีย์ anon ต้องใช้คีย์ service_role";
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
      if (claims.ref && url && !url.includes(claims.ref)) return "ค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel เป็นคีย์ของโปรเจกต์ Supabase อื่น";
    } catch {
      return "ค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel ไม่ครบ อาจคัดลอกมาไม่หมด";
    }
  }
  try {
    const { error } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) return "ค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel ใช้ไม่ได้ อาจคัดลอกมาไม่ครบหรือถูกเปลี่ยนไปแล้ว";
  } catch {
    return "ค่า SUPABASE_SERVICE_ROLE_KEY ใน Vercel ใช้ไม่ได้";
  }
  return "";
}
