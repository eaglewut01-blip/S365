// Calendar dates for the gym, which runs on Bangkok time. Dates travel as
// "YYYY-MM-DD" strings so a server in another time zone never shifts them.

const BANGKOK = "Asia/Bangkok";

export function todayBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: BANGKOK }).format(new Date());
}

// The start of today in Bangkok, as an instant, for "since this morning" queries.
export function startOfTodayBangkok(): Date {
  return new Date(`${todayBangkok()}T00:00:00+07:00`);
}

function parts(date: string): [number, number, number] {
  const [y, m, d] = date.split("-").map(Number);
  return [y, m, d];
}

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const [y, m, d] = parts(date);
  return toIso(new Date(Date.UTC(y, m - 1, d + days)));
}

// Adding a month keeps the day of the month, and stops at the month's last
// day when the target month is shorter (31 Jan + 1 month = 28 or 29 Feb).
export function addMonths(date: string, months: number): string {
  const [y, m, d] = parts(date);
  const lastDay = new Date(Date.UTC(y, m - 1 + months + 1, 0)).getUTCDate();
  return toIso(new Date(Date.UTC(y, m - 1 + months, Math.min(d, lastDay))));
}

// Whole days from `from` to `to`; negative when `to` is earlier.
export function daysBetween(from: string, to: string): number {
  const [y1, m1, d1] = parts(from);
  const [y2, m2, d2] = parts(to);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function formatDateTh(date: string | null | undefined): string {
  if (!date) return "-";
  const [y, m, d] = parts(date.slice(0, 10));
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("th-TH", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTimeTh(instant: string | Date): string {
  return new Date(instant).toLocaleTimeString("th-TH", { timeZone: BANGKOK, hour: "2-digit", minute: "2-digit", hour12: false });
}

// A membership bought today runs through the day before the same date N
// months on: 1 Jan + 1 month ends 31 Jan.
export function membershipEnd(start: string, months: number, bonusMonths: number, bonusDays: number): string {
  return addDays(addMonths(start, months + bonusMonths), bonusDays - 1);
}

export type ExpiryState = "none" | "expired" | "soon" | "ok";

// "soon" = ends within `soonDays` days, counting today.
export function expiryState(expiresOn: string | null | undefined, soonDays = 7): { state: ExpiryState; daysLeft: number | null } {
  if (!expiresOn) return { state: "none", daysLeft: null };
  const daysLeft = daysBetween(todayBangkok(), expiresOn);
  if (daysLeft < 0) return { state: "expired", daysLeft };
  return { state: daysLeft <= soonDays ? "soon" : "ok", daysLeft };
}

export function expiryLabel(expiresOn: string | null | undefined): string {
  const { state, daysLeft } = expiryState(expiresOn);
  if (state === "none") return "ยังไม่มีแพ็กเกจ";
  if (state === "expired") return `หมดอายุแล้ว ${Math.abs(daysLeft!)} วัน`;
  if (daysLeft === 0) return "หมดอายุวันนี้";
  return `เหลือ ${daysLeft} วัน`;
}

// The day a renewal should start: the day after the current membership ends,
// or today when it has already run out.
export function suggestedStart(expiresOn: string | null | undefined): string {
  const today = todayBangkok();
  return expiresOn && expiresOn >= today ? addDays(expiresOn, 1) : today;
}

// Monday of the week that contains `date`.
export function mondayOf(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(date, day === 0 ? -6 : 1 - day);
}
