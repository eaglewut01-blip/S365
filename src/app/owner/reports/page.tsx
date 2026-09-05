import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/database";
import { ReportsClient } from "./ReportsClient";

const MONTHS_TH = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

export default async function ReportsPage() {
  const profile = await requireRole("owner", "staff");
  const supabase = await createClient();
  const branchId = profile.branch_id ?? "";

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [{ data: members }, { data: payments }] = await Promise.all([
    supabase.from("members").select("*").eq("branch_id", branchId),
    supabase
      .from("payments")
      .select("amount, paid_at")
      .eq("branch_id", branchId)
      .gte("paid_at", sixMonthsAgo.toISOString()),
  ]);

  const list = (members ?? []) as Member[];

  const buckets: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    buckets.push({ month: MONTHS_TH[d.getMonth()], revenue: 0 });
  }

  (payments ?? []).forEach((p) => {
    const d = new Date(p.paid_at);
    const monthsBack =
      (new Date().getFullYear() - d.getFullYear()) * 12 + (new Date().getMonth() - d.getMonth());
    const idx = 5 - monthsBack;
    if (idx >= 0 && idx < buckets.length) buckets[idx].revenue += Number(p.amount);
  });

  const active = list.filter((m) => m.status === "active");
  const retentionRate = list.length > 0 ? Math.round((active.length / list.length) * 1000) / 10 : 0;
  const avgVisits = list.length > 0 ? Math.round(list.reduce((s, m) => s + m.visit_count, 0) / list.length) : 0;
  const currentMonthRevenue = buckets[buckets.length - 1]?.revenue ?? 0;

  return (
    <ReportsClient
      revenueHistory={buckets}
      retentionRate={retentionRate}
      avgVisits={avgVisits}
      currentMonthRevenue={currentMonthRevenue}
    />
  );
}
