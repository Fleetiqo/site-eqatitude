import { describe, expect, it } from "vitest";
import { closureOn, groupHours, isValidSlots, openStatus, parseSlots, slotText, upcomingClosures } from "@/lib/hours";
import type { OpeningDay } from "@/lib/types";

const HOURS: OpeningDay[] = [
  { day: "Lundi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Mardi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Mercredi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Jeudi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Vendredi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Samedi", slots: "09:00-19:00" },
  { day: "Dimanche", slots: "" },
];

/** A Paris wall-clock time (November = UTC+1). */
const paris = (iso: string) => new Date(`${iso}+01:00`);

describe("opening hours", () => {
  it("parses and formats slots", () => {
    expect(parseSlots("09:00-12:30, 14:00-19:00")).toEqual([
      [9, 12.5],
      [14, 19],
    ]);
    expect(slotText(parseSlots("09:00-12:30, 14:00-19:00"))).toBe("9h – 12h30, 14h – 19h");
    expect(slotText([])).toBe("Fermé");
  });

  it("validates the admin input format", () => {
    expect(isValidSlots("")).toBe(true);
    expect(isValidSlots("09:00-12:30, 14:00-19:00")).toBe(true);
    expect(isValidSlots("9h-12h")).toBe(false);
  });

  it("merges identical consecutive days for the footer", () => {
    expect(groupHours(HOURS)).toEqual([
      { label: "Lun. – Ven.", text: "9h – 12h30, 14h – 19h" },
      { label: "Samedi", text: "9h – 19h" },
      { label: "Dimanche", text: "Fermé" },
    ]);
  });

  it("computes the live status in the shop's time zone", () => {
    expect(openStatus(HOURS, [], paris("2026-11-04T10:00:00"))).toEqual({ kind: "open", until: "12h30" });
    expect(openStatus(HOURS, [], paris("2026-11-04T13:00:00"))).toEqual({ kind: "closed-opens-today", at: "14h" });
    expect(openStatus(HOURS, [], paris("2026-11-07T20:00:00"))).toEqual({
      kind: "closed-opens-later",
      when: "lundi",
      at: "9h",
    });
    expect(openStatus(HOURS, [], paris("2026-11-04T20:00:00"))).toEqual({
      kind: "closed-opens-later",
      when: "demain",
      at: "9h",
    });
  });

  it("reports exceptional closures first", () => {
    const closures = [{ id: "c", startDate: "2026-11-03", endDate: "2026-11-05", reason: "Inventaire" }];
    expect(openStatus(HOURS, closures, paris("2026-11-04T10:00:00"))).toEqual({
      kind: "exceptional-closure",
      reason: "Inventaire",
    });
    expect(closureOn(closures, "2026-11-06")).toBeUndefined();
    expect(upcomingClosures(closures, "2026-11-06")).toEqual([]);
    expect(upcomingClosures(closures, "2026-11-05")).toHaveLength(1);
  });
});
