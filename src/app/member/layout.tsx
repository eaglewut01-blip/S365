import { requireRole } from "@/lib/session";
import { MemberSidebar } from "@/components/layout/MemberSidebar";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("member");

  return (
    <div className="flex min-h-screen flex-col bg-base md:flex-row">
      <MemberSidebar name={profile.full_name} />
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
