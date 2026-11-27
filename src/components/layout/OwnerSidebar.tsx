"use client";

import {
  LayoutGrid,
  Users,
  CalendarDays,
  ScanLine,
  Receipt,
  BarChart3,
  ClipboardCheck,
  UserCog,
  Globe,
  Package,
  CalendarClock,
} from "lucide-react";
import { PortalNav, type NavItem } from "./PortalNav";

const baseItems: NavItem[] = [
  { href: "/owner", label: "ภาพรวม", icon: LayoutGrid },
  { href: "/owner/members", label: "สมาชิก", icon: Users },
  { href: "/owner/checkin", label: "เช็คอิน", icon: ScanLine },
  { href: "/owner/packages", label: "แพ็กเกจ", icon: Package },
  { href: "/owner/trainer-schedule", label: "ตารางเทรนเนอร์", icon: CalendarClock },
  { href: "/owner/schedule", label: "ตารางคลาส", icon: CalendarDays },
  { href: "/owner/pt-sessions", label: "เซสชัน PT", icon: ClipboardCheck },
  { href: "/owner/billing", label: "การขาย", icon: Receipt },
  { href: "/owner/reports", label: "รายงาน", icon: BarChart3 },
];

const ownerOnlyItems: NavItem[] = [
  { href: "/owner/website", label: "เว็บไซต์", icon: Globe },
  { href: "/owner/team", label: "ทีมงาน", icon: UserCog },
];

export function OwnerSidebar({ branchName, isOwner }: { branchName: string; isOwner: boolean }) {
  return (
    <PortalNav
      items={isOwner ? [...baseItems, ...ownerOnlyItems] : baseItems}
      home="/owner"
      label={branchName}
      roleLabel="Owner / Staff"
    />
  );
}
