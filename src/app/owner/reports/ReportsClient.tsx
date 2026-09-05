"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { PageHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { formatBaht } from "@/lib/format";

const COLORS = {
  volt: "#f2a91e",
  border: "rgba(255,255,255,0.09)",
  borderStrong: "rgba(255,255,255,0.2)",
  textFaint: "#68665f",
  textHi: "#f6f5f0",
  panelRaised: "#242423",
};

export function ReportsClient({
  revenueHistory,
  retentionRate,
  avgVisits,
  currentMonthRevenue,
}: {
  revenueHistory: { month: string; revenue: number }[];
  retentionRate: number;
  avgVisits: number;
  currentMonthRevenue: number;
}) {
  return (
    <div className="p-7">
      <PageHeader title="รายงาน" subtitle="แนวโน้มรายได้และตัวชี้วัดการรักษาสมาชิก" />

      <div className="mb-[22px] flex gap-3.5">
        <StatTile label="อัตราสมาชิก active" value={`${retentionRate}%`} tone="mint" />
        <StatTile label="เข้าใช้เฉลี่ย/คน" value={avgVisits} sub="ครั้งนับตั้งแต่สมัคร" />
        <StatTile label="รายได้เดือนนี้" value={formatBaht(currentMonthRevenue)} tone="mint" />
      </div>

      <div className="rounded-xl border border-border bg-panel p-5">
        <h3 className="m-0 mb-4 font-heading text-[15px] text-text-hi">รายได้ 6 เดือนล่าสุด (จากการบันทึกจ่ายจริง)</h3>
        <div className="h-60 w-full">
          <ResponsiveContainer>
            <BarChart data={revenueHistory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.border} vertical={false} />
              <XAxis dataKey="month" stroke={COLORS.textFaint} fontSize={12} tickLine={false} axisLine={{ stroke: COLORS.border }} />
              <YAxis
                stroke={COLORS.textFaint}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{ background: COLORS.panelRaised, border: `1px solid ${COLORS.borderStrong}`, borderRadius: 8, fontSize: 12.5 }}
                labelStyle={{ color: COLORS.textHi }}
                formatter={(v) => [formatBaht(Number(v)), "รายได้"]}
              />
              <Bar dataKey="revenue" fill={COLORS.volt} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
