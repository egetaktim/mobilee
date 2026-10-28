export const TIME_ZONE = "Europe/Istanbul";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** İstanbul saatine göre YYYY-MM-DD. */
export function toLocalDate(d: Date | string): string {
  return ymd.format(typeof d === "string" ? new Date(d) : d);
}

export function today(): string {
  return toLocalDate(new Date());
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidDate(date: string | undefined): date is string {
  return !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDate(iso: string, opts: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat("tr-TR", {
    timeZone: TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    ...opts,
  }).format(new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso));
}

/** Avrupa sezonu Temmuz'da başlar: 2026-10 -> 2026, 2027-03 -> 2026. */
export function currentSeason(now = new Date()): number {
  const [y, m] = toLocalDate(now).split("-").map(Number);
  return m >= 7 ? y : y - 1;
}
