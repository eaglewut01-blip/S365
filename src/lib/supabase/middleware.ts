import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Role } from "@/types/database";

const ROLE_HOME: Record<Role, string> = {
  owner: "/owner",
  staff: "/owner",
  trainer: "/trainer/schedule",
  member: "/member",
  pending: "/pending",
  left: "/pending",
};

const PUBLIC_PATHS = ["/login"];
// The only back-office screens a shared front-counter account may open.
const COUNTER_HOME = "/owner/checkin";
const COUNTER_PATHS = ["/owner/checkin", "/owner/sell", "/owner/members", "/owner/trainer-schedule", "/owner/schedule", "/owner/proof"];
export const AFTER_LOGIN_COOKIE = "s365_after_login";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    const redirect = NextResponse.redirect(url);
    // Someone scanned the staff QR before signing in: bring them back to it
    // after they sign in (see login in lib/actions/auth.ts).
    if (path === "/work") {
      redirect.cookies.set(AFTER_LOGIN_COOKIE, `/work${request.nextUrl.search}`, { httpOnly: true, sameSite: "lax", secure: request.nextUrl.protocol === "https:", maxAge: 600, path: "/" });
    }
    return redirect;
  }

  if (user) {
    // counter_only arrives with a later database update; fall back to the
    // role alone until that has been run.
    const withCounter = await supabase.from("profiles").select("role, counter_only").eq("id", user.id).single();
    const profile: { role?: string; counter_only?: boolean } | null = withCounter.error
      ? (await supabase.from("profiles").select("role").eq("id", user.id).single()).data
      : withCounter.data;

    const role = profile?.role as Role | undefined;
    const counter = role === "staff" && profile?.counter_only === true;
    const home = counter ? COUNTER_HOME : role ? ROLE_HOME[role] : "/login";

    if (path === "/login") {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }

    // Keep each portal fenced off from the others — a trainer can't browse
    // into /owner by typing the URL, a member can't reach /trainer, etc.
    const inOwnerArea = path.startsWith("/owner");
    const inTrainerArea = path.startsWith("/trainer");
    const inMemberArea = path.startsWith("/member");

    const allowed =
      (inOwnerArea && (role === "owner" || role === "staff")) ||
      (inTrainerArea && role === "trainer") ||
      (inMemberArea && role === "member") ||
      (!inOwnerArea && !inTrainerArea && !inMemberArea);

    const counterAllowed = !counter || !inOwnerArea || COUNTER_PATHS.some((p) => path === p || path.startsWith(`${p}/`));

    if (!allowed || !counterAllowed) {
      const url = request.nextUrl.clone();
      url.pathname = home;
      return NextResponse.redirect(url);
    }
  }

  return response;
}
