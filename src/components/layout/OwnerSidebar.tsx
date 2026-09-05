"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutGrid,
  Users,
  CalendarDays,
  ScanLine,
  Receipt,
  BarChart3,
  ClipboardCheck,
  UserCog,
  Dumbbell,
} from "lucide-react";
import { LogoutButton } from "./LogoutButton";

const baseItems = [
  { href: "/owner", label: "ภาพรวม", icon: LayoutGrid },
  { href: "/owner/members", label: "สมาชิก", icon: Users },
  { href: "/owner/schedule", label: "ตารางคลาส", icon: CalendarDays },
  { href: "/owner/checkin", label: "เช็คอิน", icon: ScanLine },
  { href: "/owner/pt-sessions", label: "เซสชัน PT", icon: ClipboardCheck },
  { href: "/owner/billing", label: "การเงิน", icon: Receipt },
  { href: "/owner/reports", label: "รายงาน", icon: BarChart3 },
];

const ownerOnlyItem = { href: "/owner/team", label: "ทีมงาน", icon: UserCog };

export function OwnerSidebar({ branchName, isOwner }: { branchName: string; isOwner: boolean }) {
  const pathname = usePathname();
  const items = isOwner ? [...baseItems, ownerOnlyItem] : baseItems;

  return (
    <div className="flex w-56 flex-shrink-0 flex-col border-r border-border bg-panel px-3 py-5">
      <div className="px-2.5 pb-4">
        <div className="font-heading text-[22px] leading-none tracking-wide text-text-hi">S365</div>
        <div className="mt-0.5 font-body text-[9px] font-semibold tracking-[0.25em] text-volt">
          FITNESS
        </div>
      </div>

      <div className="mb-[18px] rounded-lg border border-border bg-panel-raised px-2.5 py-2 text-[12.5px] text-text-hi">
        {branchName}
      </div>

      <nav className="flex flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/owner" ? pathname === "/owner" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 rounded-lg px-3 py-2.5 font-body text-sm",
                active ? "bg-volt/10 font-semibold text-volt" : "font-medium text-text-lo hover:text-text-hi"
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-2 px-3 text-text-faint">
          <Dumbbell size={13} />
          <span className="text-[11px]">Owner / Staff</span>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
