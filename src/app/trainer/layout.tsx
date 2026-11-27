import { requireRole } from "@/lib/session";
import { TrainerSidebar } from "@/components/layout/TrainerSidebar";

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireRole("trainer");

  return (
    <div className="flex min-h-screen flex-col bg-base md:flex-row">
      <TrainerSidebar name={profile.full_name} />
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
