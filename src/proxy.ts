import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only the login page, the three signed-in portals and the staff clock-in
// page need a session check.
// The public website at "/" is static and never touches Supabase.
export const config = {
  matcher: ["/login", "/owner/:path*", "/trainer/:path*", "/member/:path*", "/work"],
};
