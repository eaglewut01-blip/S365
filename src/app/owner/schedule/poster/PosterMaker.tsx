"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { uploadImage } from "@/app/owner/website/media";
import { addSitePhoto } from "@/lib/actions/website";
import { classColor } from "@/lib/class-names";
import { addDays } from "@/lib/dates";

export type PosterClass = { name: string; instructor: string; day: number; start: string; minutes: number };

const W = 1440;
const H = 960;
const DAYS = [
  { label: "Monday", day: 1 },
  { label: "Tuesday", day: 2 },
  { label: "Wednesday", day: 3 },
  { label: "Thursday", day: 4 },
  { label: "Friday", day: 5 },
  { label: "Saturday", day: 6 },
  { label: "Sunday", day: 0 },
];
const SANS = "'Leelawadee UI', 'Noto Sans Thai', 'Thonburi', Tahoma, Arial, sans-serif";

function endOf(start: string, minutes: number): string {
  const [h, m] = start.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${Math.floor(total / 60) % 24}.${String(total % 60).padStart(2, "0")}`;
}
const dotted = (time: string) => `${Number(time.slice(0, 2))}.${time.slice(3, 5)}`;

// "23-29/11/2026", or "30/11-6/12/2026" when the week crosses a month.
function weekLabel(monday: string): string {
  const sunday = addDays(monday, 6);
  const [y1, m1, d1] = monday.split("-").map(Number);
  const [y2, m2, d2] = sunday.split("-").map(Number);
  if (m1 === m2) return `${d1}-${d2}/${m2}/${y2}`;
  return y1 === y2 ? `${d1}/${m1}-${d2}/${m2}/${y2}` : `${d1}/${m1}/${y1}-${d2}/${m2}/${y2}`;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: string, family: string): number {
  let px = size;
  do {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    px -= 1;
  } while (px > 11);
  return px;
}

function draw(canvas: HTMLCanvasElement, classes: PosterClass[], monday: string) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  // One row per distinct time range that has a class.
  const rows = [...new Map(classes.map((c) => [`${c.start}-${c.minutes}`, { start: c.start, minutes: c.minutes }])).values()].sort(
    (a, b) => a.start.localeCompare(b.start) || a.minutes - b.minutes
  );

  ctx.fillStyle = "#0b0b0c";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createLinearGradient(0, 0, W, H);
  glow.addColorStop(0, "#1a1a1c");
  glow.addColorStop(1, "#050506");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Header: wordmark, title, updated pill
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = "#F3AC1F";
  ctx.font = `900 64px ${SANS}`;
  ctx.fillText("S365", 44, 88);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 20px ${SANS}`;
  ctx.fillText("F I T N E S S", 48, 120);
  ctx.font = `900 92px ${SANS}`;
  ctx.fillText("ตารางคลาส", 232, 112);
  ctx.fillStyle = "#F3AC1F";
  ctx.font = `800 26px ${SANS}`;
  ctx.fillText("S365 FITNESS", 236, 152);
  const pill = `อัพเดท ${weekLabel(monday)}`;
  ctx.font = `800 52px ${SANS}`;
  const pillWidth = Math.min(700, ctx.measureText(pill).width + 80);
  const pillX = W - 44 - pillWidth;
  ctx.fillStyle = "#f4f4f4";
  ctx.beginPath();
  ctx.roundRect(pillX, 62, pillWidth, 76, 30);
  ctx.fill();
  ctx.fillStyle = "#111111";
  ctx.textAlign = "center";
  fitText(ctx, pill, pillWidth - 50, 52, "800", SANS);
  ctx.fillText(pill, pillX + pillWidth / 2, 120);

  // Grid
  const left = 36;
  const top = 200;
  const timeCol = 172;
  const colW = (W - left * 2 - timeCol) / 7;
  const headH = 84;
  const rowH = rows.length ? Math.min(92, (H - top - headH - 40) / rows.length) : 92;
  const gap = 5;

  DAYS.forEach((d, i) => {
    const x = left + timeCol + i * colW;
    ctx.fillStyle = "#0F9D4A";
    ctx.fillRect(x + gap / 2, top, colW - gap, headH - gap);
    ctx.fillStyle = "#ffffff";
    fitText(ctx, d.label, colW - 24, 34, "500", SANS);
    ctx.fillText(d.label, x + colW / 2, top + headH / 2 + 10);
  });

  rows.forEach((row, r) => {
    const y = top + headH + r * rowH;
    ctx.fillStyle = "#FFC400";
    ctx.fillRect(left, y + gap / 2, timeCol - gap / 2, rowH - gap);
    ctx.fillStyle = "#111111";
    const label = `${dotted(row.start)}-${endOf(row.start, row.minutes)}`;
    fitText(ctx, label, timeCol - 24, 26, "600", SANS);
    ctx.fillText(label, left + timeCol / 2, y + rowH / 2 + 9);

    DAYS.forEach((d, i) => {
      const x = left + timeCol + i * colW;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x + gap / 2, y + gap / 2, colW - gap, rowH - gap);
      const here = classes.filter((c) => c.day === d.day && c.start === row.start && c.minutes === row.minutes);
      const slotH = (rowH - gap) / Math.max(here.length, 1);
      here.forEach((c, k) => {
        const cy = y + gap / 2 + k * slotH;
        const big = here.length === 1;
        ctx.fillStyle = classColor(c.name);
        fitText(ctx, c.name, colW - 22, big ? 30 : 20, "900", SANS);
        ctx.fillText(c.name, x + colW / 2, cy + slotH * (c.instructor ? 0.5 : 0.62));
        if (c.instructor) {
          ctx.fillStyle = "#333333";
          fitText(ctx, c.instructor, colW - 22, big ? 15 : 12, "500", SANS);
          ctx.fillText(c.instructor, x + colW / 2, cy + slotH * 0.5 + (big ? 24 : 15));
        }
      });
    });
  });

  if (rows.length === 0) {
    ctx.fillStyle = "#bbbbbb";
    ctx.font = `500 30px ${SANS}`;
    ctx.fillText("ยังไม่มีคลาสในตาราง", W / 2, top + headH + 120);
  }
}

export function PosterMaker({ classes, monday, prevWeek, nextWeek, canPublish }: { classes: PosterClass[]; monday: string; prevWeek: string; nextWeek: string; canPublish: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [message, setMessage] = useState<{ error?: string; done?: string }>({});
  const [pending, startTransition] = useTransition();
  const fileName = `s365-class-schedule-${monday}.png`;

  useEffect(() => {
    if (canvas.current) draw(canvas.current, classes, monday);
  }, [classes, monday]);

  const toBlob = () =>
    new Promise<Blob | null>((resolve) => {
      if (canvas.current) canvas.current.toBlob(resolve, "image/png");
      else resolve(null);
    });

  const download = async () => {
    const blob = await toBlob();
    if (!blob) return setMessage({ error: "สร้างภาพไม่สำเร็จ" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Give the browser time to start saving before the link is released.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const publish = () =>
    startTransition(async () => {
      try {
        const blob = await toBlob();
        if (!blob) throw new Error("สร้างภาพไม่สำเร็จ");
        const stored = await uploadImage("schedule", new File([blob], fileName, { type: "image/png" }), 2000);
        const res = await addSitePhoto({ section: "schedule", storagePath: stored.path, width: stored.width, height: stored.height });
        setMessage("error" in res ? { error: res.error } : { done: "ขึ้นหน้าเว็บแล้ว ดูได้ที่หน้าแรกของเว็บ หัวข้อคลาส" });
      } catch (e) {
        setMessage({ error: e instanceof Error ? e.message : "อัปโหลดไม่สำเร็จ" });
      }
    });

  const navLink = "inline-flex h-9 items-center justify-center rounded-lg border border-border px-2.5 text-text-lo no-underline hover:text-text-hi";

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link href={`/owner/schedule/poster?w=${prevWeek}`} aria-label="สัปดาห์ก่อนหน้า" className={navLink}>
          <ChevronLeft size={16} />
        </Link>
        <div className="min-w-[170px] text-center font-body text-[14px] font-semibold text-text-hi">สัปดาห์ {weekLabel(monday)}</div>
        <Link href={`/owner/schedule/poster?w=${nextWeek}`} aria-label="สัปดาห์ถัดไป" className={navLink}>
          <ChevronRight size={16} />
        </Link>
        <Button variant="primary" onClick={download} disabled={classes.length === 0}>
          <Download size={14} /> ดาวน์โหลดรูป
        </Button>
        {canPublish && (
          <Button onClick={publish} disabled={pending || classes.length === 0}>
            <Globe size={14} /> {pending ? "กำลังขึ้นหน้าเว็บ..." : "ใช้รูปนี้บนหน้าเว็บ"}
          </Button>
        )}
      </div>
      {message.error && <div className="mb-3 text-[13px] text-coral">{message.error}</div>}
      {message.done && <div className="mb-3 text-[13px] text-mint">{message.done}</div>}
      {classes.length === 0 && (
        <div className="mb-3 text-[13px] text-amber">
          ยังไม่มีคลาส เพิ่มคลาสที่หน้า{" "}
          <Link href="/owner/schedule" className="text-volt">
            ตารางคลาส
          </Link>{" "}
          ก่อน
        </div>
      )}
      <canvas ref={canvas} width={W} height={H} className="h-auto w-full max-w-[1100px] rounded-lg border border-border" aria-label={`ภาพตารางคลาส สัปดาห์ ${weekLabel(monday)}`} />
    </div>
  );
}
