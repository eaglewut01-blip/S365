import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addDays, formatDateTh, todayBangkok } from "@/lib/dates";

// Previous day / next day links around a date, for pages that show one day.
export function DayNav({ basePath, date }: { basePath: string; date: string }) {
  const today = todayBangkok();
  const link = "inline-flex h-9 items-center justify-center rounded-lg border border-border px-2.5 text-text-lo no-underline hover:text-text-hi";
  const weekday = new Date(`${date}T12:00:00Z`).toLocaleDateString("th-TH", { timeZone: "UTC", weekday: "long" });

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Link href={`${basePath}?d=${addDays(date, -1)}`} aria-label="วันก่อนหน้า" className={link}>
        <ChevronLeft size={16} />
      </Link>
      <div className="min-w-[150px] text-center font-body text-[14px] font-semibold text-text-hi">
        {weekday} {formatDateTh(date)}
      </div>
      <Link href={`${basePath}?d=${addDays(date, 1)}`} aria-label="วันถัดไป" className={link}>
        <ChevronRight size={16} />
      </Link>
      {date !== today && (
        <Link href={basePath} className={`${link} text-[12.5px]`}>
          กลับมาวันนี้
        </Link>
      )}
    </div>
  );
}

export function dateParam(value: string | undefined): string {
  return value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : todayBangkok();
}
