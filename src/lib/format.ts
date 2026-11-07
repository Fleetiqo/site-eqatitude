/** Formatting helpers. The shop is in Quimper, so "today" is always computed in Europe/Paris. */

export const TIME_ZONE = "Europe/Paris";

const isoDayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar day "YYYY-MM-DD" in the shop's time zone. */
export function toIsoDay(date: Date = new Date()): string {
  return isoDayFormatter.format(date);
}

export const today = (): string => toIsoDay();

/** Adds days to a "YYYY-MM-DD" day (calendar arithmetic, DST-safe). */
export function addDays(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Parses either a "YYYY-MM-DD" day (at noon, to avoid TZ edge cases) or a full ISO timestamp. */
function parse(iso: string): Date {
  return new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
}

export const euro = (n: number | string | null | undefined): string =>
  (Number(n) || 0).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** 04/11/2026 */
export const formatDateShort = (iso: string | null | undefined): string =>
  iso
    ? parse(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: TIME_ZONE })
    : "";

/** 04/11/2026 10:02 */
export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });

/** 4 novembre 2026 */
export const formatDateLong = (isoDay: string): string =>
  parse(isoDay).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: TIME_ZONE });

/** mercredi 4 novembre */
export const formatWeekday = (isoDay: string): string =>
  parse(isoDay).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TIME_ZONE });

/** "2026-11-11" → "11/11/2026" without time-zone conversion. */
export const frenchDay = (isoDay: string): string => isoDay.split("-").reverse().join("/");

export const MONTHS_SHORT = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

/** "4,5" → 4.5 ; returns NaN for anything that is not a number. */
export const parseFrenchNumber = (value: string): number => parseFloat(String(value).replace(",", "."));

export const formatFrenchNumber = (n: number, digits = 2): string => n.toFixed(digits).replace(".", ",");
