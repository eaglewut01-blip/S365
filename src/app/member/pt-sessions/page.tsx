import { requireRole } from "@/lib/session";
import { getCurrentMember } from "@/lib/member";
import { createClient } from "@/lib/supabase/server";
import { MemberPtSessionsClient, type MemberPtSession } from "./MemberPtSessionsClient";

export default async function MemberPtSessionsPage() {
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
  const { data: sessions } = await supabase
    .from("pt_sessions")
    .select("*, trainer:profiles(full_name)")
    .eq("member_id", member.id)
    .order("logged_at", { ascending: false });

  return (
    <MemberPtSessionsClient
      sessions={(sessions ?? []) as unknown as MemberPtSession[]}
      ptTotal={member.pt_total}
      ptRemaining={member.pt_remaining}
    />
  );
}
