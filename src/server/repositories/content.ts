import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../db/client";
import { brands, closures, contentBlocks, openingHours } from "../db/schema";
import { newId } from "../ids";
import { BLOCKS, type BlockKey, resolveTexts, type Texts } from "@/content/blocks";
import type { Closure, OpeningDay } from "@/lib/types";

// --- Editable texts & images ------------------------------------------------

export function getBlockOverrides(): Record<string, string> {
  const rows = getDb().select().from(contentBlocks).all();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export const getTexts = (): Texts => resolveTexts(getBlockOverrides());

/**
 * Saves several blocks at once. A value equal to the default removes the override,
 * so later changes to the default wording reach untouched blocks.
 */
export function saveBlocks(values: Partial<Record<BlockKey, string>>): void {
  const db = getDb();
  const updatedAt = new Date().toISOString();
  db.transaction((tx) => {
    for (const [key, value] of Object.entries(values) as [BlockKey, string][]) {
      if (value === BLOCKS[key].default) {
        tx.delete(contentBlocks).where(eq(contentBlocks.key, key)).run();
      } else {
        tx.insert(contentBlocks)
          .values({ key, value, updatedAt })
          .onConflictDoUpdate({ target: contentBlocks.key, set: { value, updatedAt } })
          .run();
      }
    }
  });
}

export function resetBlocks(keys: BlockKey[]): void {
  if (keys.length) getDb().delete(contentBlocks).where(inArray(contentBlocks.key, keys)).run();
}

// --- Opening hours ------------------------------------------------------------

export const DEFAULT_HOURS: OpeningDay[] = [
  { day: "Lundi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Mardi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Mercredi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Jeudi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Vendredi", slots: "09:00-12:30, 14:00-19:00" },
  { day: "Samedi", slots: "09:00-19:00" },
  { day: "Dimanche", slots: "" },
];

export function getOpeningHours(): OpeningDay[] {
  const rows = getDb().select().from(openingHours).orderBy(asc(openingHours.position)).all();
  return rows.length ? rows.map(({ day, slots }) => ({ day, slots })) : DEFAULT_HOURS;
}

export function saveOpeningHours(hours: OpeningDay[]): void {
  getDb().transaction((tx) => {
    tx.delete(openingHours).run();
    if (hours.length)
      tx.insert(openingHours)
        .values(hours.map((h, position) => ({ position, ...h })))
        .run();
  });
}

// --- Brands -------------------------------------------------------------------

export const getBrands = (): string[] =>
  getDb()
    .select({ name: brands.name })
    .from(brands)
    .orderBy(asc(brands.position), asc(brands.id))
    .all()
    .map((b) => b.name);

export function saveBrands(names: string[]): void {
  getDb().transaction((tx) => {
    tx.delete(brands).run();
    if (names.length)
      tx.insert(brands)
        .values(names.map((name, position) => ({ name, position })))
        .run();
  });
}

// --- Exceptional closures -----------------------------------------------------

export const getClosures = (): Closure[] => getDb().select().from(closures).orderBy(asc(closures.startDate)).all();

export function upsertClosure(data: Omit<Closure, "id">, id?: string): Closure {
  const row = { ...data, id: id ?? newId() };
  getDb().insert(closures).values(row).onConflictDoUpdate({ target: closures.id, set: data }).run();
  return row;
}

export const deleteClosure = (id: string): void => void getDb().delete(closures).where(eq(closures.id, id)).run();
