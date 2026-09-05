import { requireRole } from "@/lib/session";
import { getCurrentMember } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";
import { MemberClassesClient, type ClassWithBookings } from "./MemberClassesClient";

export default async function MemberClassesPage() {
  const profile = await requireRole("member");
  const member = await getCurrentMember(profile.id);

  if (!member) {
    return (
      <div className="p-7">
        <div className="rounded-xl border border-border bg-panel p-6 text-[13.5px] text-text-faint">
          บัญชีนี้ยังไม่ได้เชื่อมกับข้อมูลสมาชิก — กรุณาติดต่อพนักงานหน้าเคาน์เตอร์
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: classes } = await supabase
    .from("classes")
    .select("*, trainer:profiles(full_name), class_bookings(member_id, status)")
    .eq("branch_id", member.branch_id)
    .order("day_of_week")
    .order("start_time");

  return <MemberClassesClient classes={(classes ?? []) as unknown as ClassWithBookings[]} memberId={member.id} />;
}
