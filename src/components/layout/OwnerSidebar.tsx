"use client";

import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Contact,
  Globe,
  LayoutGrid,
  Package,
  Receipt,
  ScanLine,
  ShoppingCart,
  UserCheck,
  UserCog,
  Users,
} from "lucide-react";
import { PortalNav, type NavItem } from "./PortalNav";

const baseItems: NavItem[] = [
  { href: "/owner", label: "ภาพรวม", icon: LayoutGrid },
  { href: "/owner/sell", label: "ขาย", icon: ShoppingCart },
  { href: "/owner/members", label: "สมาชิก", icon: Users },
  { href: "/owner/checkin", label: "เช็คอิน", icon: ScanLine },
  { href: "/owner/packages", label: "แพ็กเกจ", icon: Package },
  { href: "/owner/trainer-schedule", label: "ตารางเทรนเนอร์", icon: CalendarClock },
  { href: "/owner/trainer-clients", label: "ลูกค้า PT", icon: Contact },
  { href: "/owner/schedule", label: "ตารางคลาส", icon: CalendarDays },
  { href: "/owner/pt-sessions", label: "เซสชัน PT", icon: ClipboardCheck },
  { href: "/owner/billing", label: "ยอดขาย", icon: Receipt },
  { href: "/owner/attendance", label: "เข้างานพนักงาน", icon: UserCheck },
  { href: "/owner/reports", label: "รายงาน", icon: BarChart3 },
];

const ownerOnlyItems: NavItem[] = [
  { href: "/owner/website", label: "เว็บไซต์", icon: Globe },
  { href: "/owner/team", label: "ทีมงาน", icon: UserCog },
];

// The shared front-counter account sees only what the counter needs.
const counterItems: NavItem[] = [
  { href: "/owner/checkin", label: "เคาน์เตอร์ เช็คอิน", icon: ScanLine },
  { href: "/owner/sell", label: "ขาย", icon: ShoppingCart },
  { href: "/owner/members", label: "สมาชิก", icon: Users },
  { href: "/owner/trainer-schedule", label: "ตารางเทรนเนอร์", icon: CalendarClock },
  { href: "/owner/schedule", label: "ตารางคลาส", icon: CalendarDays },
];

export function OwnerSidebar({ branchName, isOwner, counter }: { branchName: string; isOwner: boolean; counter?: boolean }) {
  return (
    <PortalNav
      items={counter ? counterItems : isOwner ? [...baseItems, ...ownerOnlyItems] : baseItems}
      home={counter ? "/owner/checkin" : "/owner"}
      label={branchName}
      roleLabel={counter ? "Counter" : "Owner / Staff"}
    />
  );
}
