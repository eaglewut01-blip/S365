"use client";

import { LayoutGrid, CalendarDays, ClipboardCheck, Receipt } from "lucide-react";
import { PortalNav, type NavItem } from "./PortalNav";

const items: NavItem[] = [
  { href: "/member", label: "ภาพรวม", icon: LayoutGrid },
  { href: "/member/classes", label: "จองคลาส", icon: CalendarDays },
  { href: "/member/pt-sessions", label: "เซสชัน PT", icon: ClipboardCheck },
  { href: "/member/billing", label: "แพ็กเกจของฉัน", icon: Receipt },
];

export function MemberSidebar({ name }: { name: string }) {
  return <PortalNav items={items} home="/member" label={name} roleLabel="Member" />;
}
