import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, CircleAlert } from "lucide-react";
import { getCurrentProfile } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { formatDateTh, formatTimeTh, todayBangkok } from "@/lib/dates";

export const metadata = { title: "เข้างาน | S365 Fitness" };
export const dynamic = "force-dynamic";

const HOME = { owner: "/owner", staff: "/owner", trainer: "/trainer/schedule" } as const;

// Where the staff QR at the gym leads. Opening it on a phone that is signed in
// records the arrival time straight away: scan, see your name, done.
export default async function WorkPage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const token = (await searchParams).t ?? "";
  const isTeam = profile.role === "owner" || profile.role === "staff" || profile.role === "trainer";

  const supabase = await createClient();
  let result: { ok: boolean; reason?: string; new?: boolean; at?: string } = { ok: false, reason: "not_allowed" };
  if (isTeam) {
    const { data, error } = await supabase.rpc("clock_in", { p_token: token });
    result = error || !data ? { ok: false, reason: "error" } : (data as typeof result);
  }

  const today = todayBangkok();
  const { count } = await supabase
    .from("staff_attendance")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profile.id)
    .gte("work_date", `${today.slice(0, 7)}-01`);

  const problem =
    result.reason === "bad_link"
      ? "QR นี้ใช้ไม่ได้แล้ว ให้สแกนป้ายเข้างานแผ่นล่าสุดที่ยิม"
      : result.reason === "not_allowed"
        ? "บัญชีนี้ยังไม่ใช่ทีมงาน ถ้าเพิ่งสมัครให้รอเจ้าของอนุมัติก่อน"
        : "ยังบันทึกเข้างานไม่ได้ แจ้งเจ้าของยิม";

  return (
    <div className="flex min-h-screen items-center justify-center bg-base p-6">
      <div className="w-full max-w-[380px] rounded-2xl border border-border bg-panel p-8 text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${result.ok ? "bg-mint" : "bg-coral-bg"}`}>
          {result.ok ? <Check size={34} color="#0A2A1F" strokeWidth={3} /> : <CircleAlert size={30} className="text-coral" />}
        </div>
        <div className="text-[13px] text-text-lo">{formatDateTh(today)}</div>
        <h1 className="mt-1 mb-0 font-heading text-[30px] leading-tight text-text-hi">{profile.full_name}</h1>
        {result.ok && result.at ? (
          <>
            <p className="mt-3 mb-0 text-[16px] text-text-hi">
              {result.new ? "บันทึกเข้างานแล้ว" : "วันนี้เข้างานไปแล้ว"} เวลา <span className="font-semibold text-volt">{formatTimeTh(result.at)}</span> น.
            </p>
            <p className="mt-2 mb-0 text-[13px] text-text-lo">เดือนนี้มาทำงานแล้ว {count ?? 0} วัน</p>
          </>
        ) : (
          <p className="mt-3 mb-0 text-[14.5px] leading-relaxed text-text-hi">{problem}</p>
        )}
        {isTeam && (
          <Link href={HOME[profile.role as keyof typeof HOME]} className="mt-6 inline-block text-[13.5px] text-volt">
            ไปหน้าทำงานของฉัน
          </Link>
        )}
      </div>
    </div>
  );
}
