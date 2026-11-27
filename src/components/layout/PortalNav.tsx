"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Dumbbell, type LucideIcon } from "lucide-react";
import { LogoutButton } from "./LogoutButton";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// The menu for the three signed-in areas. A sidebar on wide screens; on a
// phone it becomes a bar across the top whose items scroll sideways.
export function PortalNav({ items, home, label, roleLabel }: { items: NavItem[]; home: string; label: string; roleLabel: string }) {
  const pathname = usePathname();
  const nav = useRef<HTMLElement>(null);

  // On a phone the menu scrolls sideways; keep the current page's item in view.
  useEffect(() => {
    nav.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  return (
    <div className="flex w-full flex-shrink-0 flex-col border-b border-border bg-panel px-3 pt-3 md:w-56 md:border-r md:border-b-0 md:py-5 print:hidden">
      <div className="flex items-center justify-between gap-3 px-2.5 pb-3 md:block md:pb-4">
        <div>
          <div className="font-heading text-[22px] leading-none tracking-wide text-text-hi">S365</div>
          <div className="mt-0.5 font-body text-[9px] font-semibold tracking-[0.25em] text-volt">FITNESS</div>
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <span className="max-w-[140px] truncate text-[12.5px] text-text-lo">{label}</span>
          <LogoutButton />
        </div>
      </div>

      <div className="mb-[18px] hidden rounded-lg border border-border bg-panel-raised px-2.5 py-2 text-[12.5px] text-text-hi md:block">
        {label}
      </div>

      <nav ref={nav} className="-mx-3 flex gap-0.5 overflow-x-auto px-3 pb-2 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === home ? pathname === home : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "flex flex-shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 font-body text-sm whitespace-nowrap md:gap-2.5",
                active ? "bg-volt/10 font-semibold text-volt" : "font-medium text-text-lo hover:text-text-hi"
              )}
            >
              <Icon size={17} strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-border pt-4 md:block">
        <div className="mb-2 flex items-center gap-2 px-3 text-text-faint">
          <Dumbbell size={13} />
          <span className="text-[11px]">{roleLabel}</span>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
