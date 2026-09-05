"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-transparent px-3 py-2 text-left font-body text-[13px] text-text-faint hover:text-coral"
      >
        <LogOut size={14} /> ออกจากระบบ
      </button>
    </form>
  );
}
