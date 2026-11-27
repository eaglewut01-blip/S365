export type Role = "owner" | "staff" | "trainer" | "member";

export type MemberStatus = "active" | "frozen" | "cancelled";
export type BillingStatus = "paid" | "due" | "overdue";
export type BookingStatus = "booked" | "waitlist";
export type PtStatus = "pending" | "approved" | "disputed";

export interface Branch {
  id: string;
  name: string;
  created_at: string;
}

export interface Profile {
  id: string;
  role: Role;
  full_name: string;
  phone: string | null;
  branch_id: string | null;
  created_at: string;
}

export interface Member {
  id: string;
  profile_id: string | null;
  branch_id: string;
  name: string;
  phone: string | null;
  plan: string;
  status: MemberStatus;
  joined_date: string;
  last_visit: string | null;
  visit_count: number;
  billing_status: BillingStatus;
  next_bill_date: string | null;
  amount: number;
  pt_total: number;
  pt_remaining: number;
  membership_expires_on: string | null;
  line_user_id: string | null;
  pt_trainer_id: string | null;
  created_at: string;
}

export interface ClassRow {
  id: string;
  branch_id: string;
  name: string;
  trainer_id: string | null;
  day_of_week: number;
  start_time: string;
  capacity: number;
  created_at: string;
}

export interface ClassBooking {
  id: string;
  class_id: string;
  member_id: string;
  status: BookingStatus;
  created_at: string;
}

export interface Checkin {
  id: string;
  member_id: string;
  branch_id: string;
  checked_in_at: string;
}

export interface PtSession {
  id: string;
  member_id: string;
  trainer_id: string;
  branch_id: string;
  session_date: string;
  session_time: string;
  status: PtStatus;
  logged_at: string;
  resolved_at: string | null;
}

export type VisitActivity = "weights" | "cardio" | "class";

export type PackageKind = "membership" | "pt";
export type PaymentMethod = "transfer" | "credit" | "cash" | "other";

export interface Package {
  id: string;
  branch_id: string;
  kind: PackageKind;
  name: string;
  price: number;
  months: number;
  bonus_months: number;
  bonus_days: number;
  sessions: number;
  bonus_sessions: number;
  note: string | null;
  active: boolean;
  created_at: string;
}

export interface MemberPurchase {
  id: string;
  branch_id: string;
  member_id: string;
  package_id: string | null;
  kind: PackageKind;
  package_name: string;
  amount: number;
  payment_method: PaymentMethod;
  sold_by: string | null;
  purchased_on: string;
  starts_on: string | null;
  ends_on: string | null;
  pt_sessions: number;
  is_renewal: boolean;
  note: string | null;
  created_at: string;
}

export type PromotionAudience = "membership_expiring" | "pt_low" | "all";

export interface Promotion {
  id: string;
  branch_id: string;
  title: string;
  body: string;
  audience: PromotionAudience;
  days_before: number;
  pt_at_most: number;
  active: boolean;
  created_at: string;
}

export type SlotKind = "pt" | "trial" | "free" | "off";

export interface TrainerSlot {
  id: string;
  branch_id: string;
  trainer_id: string;
  work_date: string;
  hour: number;
  kind: SlotKind;
  client_name: string | null;
}
