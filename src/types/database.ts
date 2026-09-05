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
