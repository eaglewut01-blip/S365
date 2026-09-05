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
