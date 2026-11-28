"use client";

import { CalendarClock, CalendarDays, ClipboardCheck } from "lucide-react";
import { PortalNav, type NavItem } from "./PortalNav";

const items: NavItem[] = [
  { href: "/trainer/schedule", label: "ลงตารางของฉัน", icon: CalendarClock },
  { href: "/trainer", label: "คลาสของฉัน", icon: CalendarDays },
  { href: "/trainer/pt-sessions", label: "เซสชัน PT", icon: ClipboardCheck },
];

export function TrainerSidebar({ name }: { name: string }) {
  return <PortalNav items={items} home="/trainer" label={name} roleLabel="Trainer" />;
}
