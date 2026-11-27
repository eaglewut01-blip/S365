"use client";

import { useEffect } from "react";

// Invite and password emails should open /reset-password. If Supabase is not
// yet told that address is allowed, it sends people to the site's front page
// instead, with the sign-in tokens still attached. Pass them on.
export function AuthLinkForwarder() {
  useEffect(() => {
    const { hash, pathname } = window.location;
    if (pathname === "/reset-password" || !hash) return;
    const params = new URLSearchParams(hash.slice(1));
    const type = params.get("type");
    const fromAuthEmail =
      (params.has("access_token") && (type === "invite" || type === "recovery")) || params.has("error_code");
    if (fromAuthEmail) window.location.replace(`/reset-password${hash}`);
  }, []);

  return null;
}
