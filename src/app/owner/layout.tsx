import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { OwnerSidebar } from "@/components/layout/OwnerSidebar";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();

  let branchName = "ยังไม่ได้ผูกสาขา";
  if (profile.branch_id) {
    const { data: branch } = await supabase
      .from("branches")
      .select("name")
      .eq("id", profile.branch_id)
      .single();
    if (branch) branchName = branch.name;
  }

  return (
    <div className="flex min-h-screen bg-base print:block print:bg-white">
      <OwnerSidebar branchName={branchName} isOwner={profile.role === "owner"} />
      <div className="flex-1 overflow-y-auto print:overflow-visible">{children}</div>
    </div>
  );
}
