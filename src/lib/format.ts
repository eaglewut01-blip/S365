export function daysAgo(dateStr: string | null): number {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatBaht(amount: number): string {
  return `฿${amount.toLocaleString("th-TH")}`;
}

const DAY_LABELS_TH = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export function dayLabelTh(dayOfWeek: number): string {
  return DAY_LABELS_TH[dayOfWeek] ?? "-";
}

export function todayDateLabelTh(): string {
  return new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
