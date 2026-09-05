"use client";

import { useTransition } from "react";
import { Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { bookClass, cancelBooking } from "@/lib/actions/classes";
import { dayLabelTh } from "@/lib/format";
import type { ClassRow } from "@/types/database";

export interface ClassWithBookings extends ClassRow {
  trainer: { full_name: string } | null;
  class_bookings: { member_id: string; status: "booked" | "waitlist" }[];
}

export function MemberClassesClient({ classes, memberId }: { classes: ClassWithBookings[]; memberId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="p-7">
      <PageHeader title="จองคลาส" subtitle="เลือกคลาสที่ต้องการเข้าร่วม — ถ้าคลาสเต็มระบบจะเข้าคิวรอให้อัตโนมัติ" />

      <div className="grid grid-cols-2 gap-4">
        {classes.map((cl) => {
          const booked = cl.class_bookings.filter((b) => b.status === "booked");
          const mine = cl.class_bookings.find((b) => b.member_id === memberId);
          const full = booked.length >= cl.capacity;

          return (
            <div key={cl.id} className="rounded-xl border border-border bg-panel p-[18px]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-heading text-[15.5px] font-bold text-text-hi">{cl.name}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-faint">
                    <Clock size={12} /> {dayLabelTh(cl.day_of_week)} · {cl.start_time?.slice(0, 5)} น. ·{" "}
                    {cl.trainer?.full_name ?? "ไม่ระบุเทรนเนอร์"}
                  </div>
                </div>
                <Badge tone={full ? "overdue" : "neutral"}>
                  {booked.length}/{cl.capacity}
                </Badge>
              </div>

              <div className="mt-4">
                {mine?.status === "booked" && (
                  <div className="flex items-center justify-between">
                    <Badge tone="active">จองแล้ว</Badge>
                    <Button
                      variant="danger"
                      disabled={pending}
                      onClick={() => startTransition(async () => { await cancelBooking(cl.id, memberId, "/member/classes"); })}
                      className="px-3 py-1.5 text-xs"
                    >
                      ยกเลิก
                    </Button>
                  </div>
                )}
                {mine?.status === "waitlist" && (
                  <div className="flex items-center justify-between">
                    <Badge tone="due">อยู่ในคิวรอ</Badge>
                    <Button
                      variant="danger"
                      disabled={pending}
                      onClick={() => startTransition(async () => { await cancelBooking(cl.id, memberId, "/member/classes"); })}
                      className="px-3 py-1.5 text-xs"
                    >
                      ออกจากคิว
                    </Button>
                  </div>
                )}
                {!mine && (
                  <Button
                    variant="primary"
                    disabled={pending}
                    onClick={() => startTransition(async () => { await bookClass(cl.id, memberId, "/member/classes"); })}
                    className="w-full"
                  >
                    {full ? "เข้าคิวรอ" : "จองคลาสนี้"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {classes.length === 0 && (
          <div className="col-span-2 rounded-xl border border-border bg-panel p-6 text-center text-[13.5px] text-text-faint">
            ยังไม่มีคลาสเปิดให้จอง
          </div>
        )}
      </div>
    </div>
  );
}
