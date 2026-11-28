"use client";

import { CalendarClock, CalendarDays, CalendarRange, PenLine, ShoppingCart, Users } from "lucide-react";
import { PortalNav, type NavItem } from "./PortalNav";

const items: NavItem[] = [
  { href: "/trainer/pt-sessions", label: "ให้ลูกค้าเซ็น", icon: PenLine },
  { href: "/trainer/clients", label: "ลูกค้าของฉัน", icon: Users },
  { href: "/trainer/schedule", label: "ลงตารางของฉัน", icon: CalendarClock },
  { href: "/trainer/team-schedule", label: "ตารางทั้งทีม", icon: CalendarRange },
  { href: "/trainer/sell", label: "ขาย", icon: ShoppingCart },
  { href: "/trainer", label: "คลาสของฉัน", icon: CalendarDays },
];

export function TrainerSidebar({ name }: { name: string }) {
  return <PortalNav items={items} home="/trainer" label={name} roleLabel="Trainer" />;
}
