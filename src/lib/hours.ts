import { TIME_ZONE, toIsoDay } from "./format";
import type { Closure, OpeningDay } from "./types";

/** French day names indexed like Date#getDay() (0 = Sunday). */
export const WEEK_DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"] as const;

/** A time slot expressed in decimal hours, e.g. [9, 12.5]. */
export type Slot = [open: number, close: number];

const SLOT_RE = /^(\d{1,2}):?(\d{2})?\s*-\s*(\d{1,2}):?(\d{2})?$/;
const SLOTS_LINE_RE = /^\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}(\s*,\s*\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})*\s*$/;

/** Validates the admin input format "09:00-12:30, 14:00-19:00" (empty = closed). */
export const isValidSlots = (value: string): boolean => value.trim() === "" || SLOTS_LINE_RE.test(value);

export function parseSlots(value: string): Slot[] {
  return String(value || "")
    .split(",")
    .map((part) => part.trim().match(SLOT_RE))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => [Number(m[1]) + (Number(m[2]) || 0) / 60, Number(m[3]) + (Number(m[4]) || 0) / 60]);
}

/** 9.5 → "9h30", 14 → "14h" */
export function formatHour(h: number): string {
  const minutes = Math.round((h % 1) * 60);
  return `${Math.floor(h)}h${minutes ? String(minutes).padStart(2, "0") : ""}`;
}

export const slotText = (slots: Slot[]): string =>
  slots.length ? slots.map(([a, b]) => `${formatHour(a)} – ${formatHour(b)}`).join(", ") : "Fermé";

export interface HoursGroup {
  label: string;
  text: string;
}

/** Compact summary for the footer: consecutive days with identical hours are merged ("Lun. – Ven."). */
export function groupHours(hours: OpeningDay[]): HoursGroup[] {
  const groups: { from: string; to: string; text: string }[] = [];
  for (const h of hours) {
    const text = slotText(parseSlots(h.slots));
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.to = h.day;
    else groups.push({ from: h.day, to: h.day, text });
  }
  return groups.map((g) => ({
    label: g.from === g.to ? g.from : `${g.from.slice(0, 3)}. – ${g.to.slice(0, 3)}.`,
    text: g.text,
  }));
}

/** Current weekday name and decimal hour in the shop's time zone. */
export function shopClock(now: Date = new Date()): { dayIndex: number; hour: number; isoDay: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const dayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { dayIndex, hour: Number(get("hour")) + Number(get("minute")) / 60, isoDay: toIsoDay(now) };
}

export const todayName = (now?: Date): string => WEEK_DAYS[shopClock(now).dayIndex] ?? "";

export type OpenStatus =
  | { kind: "open"; until: string }
  | { kind: "closed-opens-today"; at: string }
  | { kind: "closed-opens-later"; when: string; at: string }
  | { kind: "exceptional-closure"; reason: string }
  | { kind: "unknown" };

/** Closure covering the given day, if any. */
export const closureOn = (closures: Closure[], isoDay: string): Closure | undefined =>
  closures.find((c) => c.startDate <= isoDay && (c.endDate || c.startDate) >= isoDay);

export function openStatus(hours: OpeningDay[], closures: Closure[], now: Date = new Date()): OpenStatus {
  const { dayIndex, hour, isoDay } = shopClock(now);
  const closed = closureOn(closures, isoDay);
  if (closed) return { kind: "exceptional-closure", reason: closed.reason };

  const byDay = new Map(hours.map((h) => [h.day, parseSlots(h.slots)]));
  const todaySlots = byDay.get(WEEK_DAYS[dayIndex] ?? "") ?? [];
  const current = todaySlots.find(([a, b]) => hour >= a && hour < b);
  if (current) return { kind: "open", until: formatHour(current[1]) };

  const later = todaySlots.find(([a]) => a > hour);
  if (later) return { kind: "closed-opens-today", at: formatHour(later[0]) };

  for (let i = 1; i <= 7; i++) {
    const name = WEEK_DAYS[(dayIndex + i) % 7] ?? "";
    const slots = byDay.get(name) ?? [];
    if (slots[0])
      return { kind: "closed-opens-later", when: i === 1 ? "demain" : name.toLowerCase(), at: formatHour(slots[0][0]) };
  }
  return { kind: "unknown" };
}

/** Closures that are still relevant (ending today or later), sorted by start date. */
export const upcomingClosures = (closures: Closure[], isoDay: string): Closure[] =>
  closures.filter((c) => (c.endDate || c.startDate) >= isoDay).sort((a, b) => a.startDate.localeCompare(b.startDate));
