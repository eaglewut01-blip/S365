import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireRole } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { addDays, mondayOf, todayBangkok } from "@/lib/dates";
import type { ClassRow } from "@/types/database";
import { PosterMaker, type PosterClass } from "./PosterMaker";

export const metadata = { title: "ภาพตารางคลาส | S365 Fitness" };

// Draws the week's class timetable as an image for Facebook and the website.
export default async function PosterPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const profile = await requireRole("owner", "staff");
  const asked = (await searchParams).w;
  const monday = mondayOf(asked && /^\d{4}-\d{2}-\d{2}$/.test(asked) ? asked : todayBangkok());
  const supabase = await createClient();

  const { data } = await supabase.from("classes").select("*").eq("branch_id", profile.branch_id ?? "").order("start_time");
  const classes: PosterClass[] = ((data ?? []) as ClassRow[]).map((c) => ({
    name: c.name,
    instructor: c.instructor_name ?? "",
    day: c.day_of_week,
    start: c.start_time.slice(0, 5),
    minutes: c.duration_minutes ?? 60,
  }));

  return (
    <div className="p-4 sm:p-7">
      <Link href="/owner/schedule" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-text-lo hover:text-text-hi">
        <ArrowLeft size={13} /> ตารางคลาส
      </Link>
      <h1 className="m-0 mb-1.5 font-heading text-2xl font-bold text-text-hi">ภาพตารางคลาส</h1>
      <p className="mt-0 mb-4 text-[13.5px] text-text-lo">สร้างจากคลาสที่เพิ่มไว้ในหน้าตารางคลาส เลือกสัปดาห์ แล้วดาวน์โหลดไปโพสต์ หรือกดใช้เป็นภาพบนหน้าเว็บ</p>
      <PosterMaker classes={classes} monday={monday} prevWeek={addDays(monday, -7)} nextWeek={addDays(monday, 7)} canPublish={profile.role === "owner"} />
    </div>
  );
}
