import { redirect } from "next/navigation";
import { Hourglass } from "lucide-react";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { getCurrentProfile } from "@/lib/session";

export const metadata = { title: "รออนุมัติ | S365 Fitness", robots: { index: false, follow: false } };

// Where someone who signed up lands until the owner approves the account.
export default async function PendingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "pending") redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-panel p-8 text-center">
        <Hourglass size={40} className="mx-auto text-amber" strokeWidth={1.8} />
        <h1 className="m-0 mt-4 font-heading text-[24px] leading-tight tracking-wide text-text-hi">รอเจ้าของอนุมัติ</h1>
        <p className="mt-2 mb-5 text-[13.5px] leading-relaxed text-text-lo">
          คุณ{profile.full_name} สมัครเรียบร้อยแล้ว เมื่อเจ้าของยิมอนุมัติ ให้ออกจากระบบแล้วเข้าใหม่อีกครั้ง
        </p>
        <div className="flex justify-center">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
