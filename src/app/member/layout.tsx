import { requireRole } from "@/lib/session";
import { MemberSidebar } from "@/components/layout/MemberSidebar";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("member");

  return (
    <div className="flex min-h-screen bg-base">
      <MemberSidebar name={profile.full_name} />
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
