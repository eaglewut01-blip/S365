"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Clock, Plus, X } from "lucide-react";
import { PageHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { bookClass, cancelBooking, createClass, deleteClass } from "@/lib/actions/classes";
import { dayLabelTh } from "@/lib/format";
import { CLASS_NAMES } from "@/lib/class-names";
import type { ClassRow, Member } from "@/types/database";

export interface ClassWithBookings extends ClassRow {
  trainer: { id: string; full_name: string } | null;
  class_bookings: { id: string; status: "booked" | "waitlist"; member: { id: string; name: string } }[];
}

function NewClassForm({ onClose }: { onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="mb-4 rounded-xl border border-border bg-panel-raised p-[18px]">
      <div className="mb-3 flex justify-between">
        <h3 className="m-0 font-heading text-[15px] text-text-hi">เพิ่มคลาสใหม่</h3>
        <button onClick={onClose} className="cursor-pointer border-none bg-transparent text-text-faint">
          <X size={16} />
        </button>
      </div>
      <form
        action={(formData) =>
          startTransition(async () => {
            const res = await createClass(formData);
            if (res?.error) setError(res.error);
            else onClose();
          })
        }
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-[1.3fr_1.1fr_0.9fr_0.8fr_0.7fr_auto]"
      >
        <Input name="name" placeholder="ชื่อคลาส" list="class-names" required className="col-span-2 sm:col-span-1" />
        <datalist id="class-names">
          {CLASS_NAMES.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <Input name="instructor_name" placeholder="ครูผู้สอน เช่น K.Maya" />
        <Select name="day_of_week" defaultValue={String(new Date().getDay())} aria-label="วัน">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <option key={d} value={d}>
              {dayLabelTh(d)}
            </option>
          ))}
        </Select>
        <Input type="time" name="start_time" defaultValue="18:00" aria-label="เวลาเริ่ม" required />
        <Input type="number" name="hours" defaultValue={1} min={0.25} max={6} step={0.25} aria-label="กี่ชั่วโมง" title="กี่ชั่วโมง" />
        <Button type="submit" variant="primary" disabled={pending}>
          <Plus size={14} /> เพิ่ม
        </Button>
      </form>
      {error && <div className="mt-2 text-[12.5px] text-coral">{error}</div>}
    </div>
  );
}

function ClassCard({ cls, members }: { cls: ClassWithBookings; members: Member[] }) {
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const booked = cls.class_bookings.filter((b) => b.status === "booked");
  const waitlist = cls.class_bookings.filter((b) => b.status === "waitlist");
  const full = booked.length >= cls.capacity;
  const bookedIds = new Set(cls.class_bookings.map((b) => b.member.id));

  const candidates =
    query.length > 0
      ? members.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()) && !bookedIds.has(m.id))
      : [];

  return (
    <div className="rounded-xl border border-border bg-panel p-[18px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-heading text-[15.5px] font-bold text-text-hi">{cls.name}</div>
          <div className="mt-1 flex items-center gap-1.5 text-[12.5px] text-text-faint">
            <Clock size={12} /> {dayLabelTh(cls.day_of_week)} · {cls.start_time?.slice(0, 5)} น. · {(cls.duration_minutes ?? 60) / 60} ชม. ·{" "}
            {cls.instructor_name || cls.trainer?.full_name || "ไม่ระบุครู"}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={full ? "overdue" : "neutral"}>
            {booked.length}/{cls.capacity}
          </Badge>
          <button
            onClick={() => {
              if (window.confirm(`ลบคลาส ${cls.name} ออกจากตาราง`)) startTransition(async () => void (await deleteClass(cls.id)));
            }}
            className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-text-faint underline hover:text-coral"
          >
            ลบ
          </button>
        </div>
      </div>

      <div className="mt-3.5 border-t border-border pt-3">
        {booked.map((b) => (
          <div key={b.id} className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-text-hi">{b.member.name}</span>
            <button
              disabled={pending}
              onClick={() => startTransition(async () => { await cancelBooking(cls.id, b.member.id, "/owner/schedule"); })}
              className="cursor-pointer border-none bg-transparent text-xs text-text-faint hover:text-coral"
            >
              ลบ
            </button>
          </div>
        ))}
        {waitlist.length > 0 && (
          <div className="mt-2">
            <div className="mb-1 text-[11.5px] text-amber">รอคิว ({waitlist.length})</div>
            {waitlist.map((b) => (
              <div key={b.id} className="py-0.5 text-[13px] text-text-lo">
                {b.member.name}
              </div>
            ))}
          </div>
        )}
        {cls.class_bookings.length === 0 && (
          <div className="text-[13px] text-text-faint">ยังไม่มีคนจอง</div>
        )}
      </div>

      <div className="relative mt-3">
        <Input
          placeholder="พิมพ์ชื่อเพื่อจอง..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={pending}
        />
        {candidates.length > 0 && (
          <div className="absolute top-10 right-0 left-0 z-10 max-h-36 overflow-y-auto rounded-lg border border-border-strong bg-panel-raised">
            {candidates.slice(0, 5).map((m) => (
              <button
                key={m.id}
                onClick={() =>
                  startTransition(async () => {
                    await bookClass(cls.id, m.id, "/owner/schedule");
                    setQuery("");
                  })
                }
                className="block w-full cursor-pointer border-none bg-transparent px-3 py-2 text-left text-[13px] text-text-hi"
              >
                {m.name} {full && <span className="text-[11.5px] text-amber">· เข้าคิวรอ</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function ScheduleClient({
  classes,
  members,
}: {
  classes: ClassWithBookings[];
  members: Member[];
}) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-4 sm:p-7">
      <PageHeader
        title="ตารางคลาส"
        subtitle="พิมพ์ชื่อสมาชิกในช่องค้นหาเพื่อจองคลาส — ถ้าคลาสเต็มจะเข้าคิวรอโดยอัตโนมัติ"
        action={
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/owner/schedule/poster"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3.5 py-2 font-body text-[13.5px] font-semibold text-text-hi no-underline hover:bg-white/5"
            >
              สร้างภาพตารางคลาส
            </Link>
            <Button variant="primary" onClick={() => setShowForm((s) => !s)}>
              <Plus size={14} /> เพิ่มคลาส
            </Button>
          </div>
        }
      />
      {showForm && <NewClassForm onClose={() => setShowForm(false)} />}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {classes.map((cl) => (
          <ClassCard key={cl.id} cls={cl} members={members} />
        ))}
      </div>
      {classes.length === 0 && (
        <div className="rounded-xl border border-border bg-panel p-6 text-center text-[13px] text-text-faint">
          ยังไม่มีคลาส — กด &quot;เพิ่มคลาส&quot; เพื่อเริ่มต้น
        </div>
      )}
    </div>
  );
}
