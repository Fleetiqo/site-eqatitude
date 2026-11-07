import { asc, desc, eq, like } from "drizzle-orm";
import { getDb, type Db } from "../db/client";
import { quoteCounters, quoteEvents, quoteFiles, quotes } from "../db/schema";
import { newId } from "../ids";
import type { QuoteRequestData, QuoteStatus } from "@/lib/quotes/definitions";
import type { QuotePricing } from "@/lib/quotes/pricing";

export interface QuoteFile {
  id: number;
  originalName: string;
  storedName: string;
  size: number;
  mimeType: string;
}

export interface QuoteEvent {
  at: string;
  text: string;
}

export interface Quote extends QuoteRequestData {
  id: string;
  ref: string;
  createdAt: string;
  status: QuoteStatus;
  /** Origin when created by hand (Magasin, Téléphone…); empty for the website form. */
  source: string;
  /** Internal follow-up notes, never shown to the client. */
  notes: string;
  /** Follow-up date "YYYY-MM-DD", empty when none. */
  reminderDate: string;
  pricing: QuotePricing | null;
}

export interface QuoteWithRelations extends Quote {
  files: QuoteFile[];
  history: QuoteEvent[];
}

type QuoteRow = typeof quotes.$inferSelect;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

function toQuote(r: QuoteRow): Quote {
  return {
    id: r.id,
    ref: r.ref,
    createdAt: r.createdAt,
    status: r.status,
    source: r.source,
    notes: r.notes,
    reminderDate: r.reminderDate,
    types: r.types,
    details: r.details,
    projectNotes: r.projectNotes,
    site: r.site,
    contact: r.contact,
    pricing: r.pricing ?? null,
  };
}

/**
 * Next reference of the year: DEV-2026-0001, DEV-2026-0002… A per-year counter guarantees that a
 * number is never reused, even after deleting the latest quote (a client may hold that reference).
 * The counter also starts above any reference already present (imported data).
 */
function nextRef(tx: Tx, year: number): string {
  const prefix = `DEV-${year}-`;
  const counter = tx.select().from(quoteCounters).where(eq(quoteCounters.year, year)).get();
  const existing = tx
    .select({ ref: quotes.ref })
    .from(quotes)
    .where(like(quotes.ref, `${prefix}%`))
    .all()
    .reduce((m, r) => Math.max(m, Number(r.ref.slice(prefix.length)) || 0), 0);
  const next = Math.max(counter?.last ?? 0, existing) + 1;
  tx.insert(quoteCounters)
    .values({ year, last: next })
    .onConflictDoUpdate({ target: quoteCounters.year, set: { last: next } })
    .run();
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export interface NewQuote {
  request: QuoteRequestData;
  status: QuoteStatus;
  source: string;
  files?: Omit<QuoteFile, "id">[];
  /** First entry of the history, e.g. "Demande reçue depuis le site". */
  event: string;
}

export function createQuote(input: NewQuote, now = new Date()): Quote {
  return getDb().transaction((tx) => {
    const createdAt = now.toISOString();
    const { request } = input;
    const row = tx
      .insert(quotes)
      .values({
        id: newId(),
        ref: nextRef(tx, now.getFullYear()),
        createdAt,
        updatedAt: createdAt,
        status: input.status,
        source: input.source,
        types: request.types,
        details: request.details,
        projectNotes: request.projectNotes,
        site: request.site,
        contact: request.contact,
      })
      .returning()
      .get();
    for (const f of input.files ?? [])
      tx.insert(quoteFiles)
        .values({ ...f, quoteId: row.id })
        .run();
    tx.insert(quoteEvents).values({ quoteId: row.id, at: createdAt, text: input.event }).run();
    return toQuote(row);
  });
}

/** All quotes, newest first, without files and history. */
export const listQuotes = (): Quote[] =>
  getDb().select().from(quotes).orderBy(desc(quotes.createdAt)).all().map(toQuote);

export function getQuote(id: string): QuoteWithRelations | null {
  const db = getDb();
  const row = db.select().from(quotes).where(eq(quotes.id, id)).get();
  if (!row) return null;
  const files = db
    .select({
      id: quoteFiles.id,
      originalName: quoteFiles.originalName,
      storedName: quoteFiles.storedName,
      size: quoteFiles.size,
      mimeType: quoteFiles.mimeType,
    })
    .from(quoteFiles)
    .where(eq(quoteFiles.quoteId, id))
    .orderBy(asc(quoteFiles.id))
    .all();
  const history = db
    .select({ at: quoteEvents.at, text: quoteEvents.text })
    .from(quoteEvents)
    .where(eq(quoteEvents.quoteId, id))
    .orderBy(desc(quoteEvents.at), desc(quoteEvents.id))
    .all();
  return { ...toQuote(row), files, history };
}

export interface QuotePatch {
  status?: QuoteStatus;
  notes?: string;
  reminderDate?: string;
  pricing?: QuotePricing;
}

/** Applies a change and records the given events in the quote's history, atomically. */
export function updateQuote(id: string, patch: QuotePatch, events: string[], now = new Date()): Quote | null {
  return getDb().transaction((tx) => {
    const at = now.toISOString();
    const row = tx
      .update(quotes)
      .set({ ...patch, updatedAt: at })
      .where(eq(quotes.id, id))
      .returning()
      .get();
    if (!row) return null;
    for (const text of events) tx.insert(quoteEvents).values({ quoteId: id, at, text }).run();
    return toQuote(row);
  });
}

/** Deletes a quote (files and history cascade) and returns the stored file names to remove from disk. */
export function deleteQuote(id: string): { ref: string; storedFiles: string[] } | null {
  return getDb().transaction((tx) => {
    const row = tx.select({ ref: quotes.ref }).from(quotes).where(eq(quotes.id, id)).get();
    if (!row) return null;
    const storedFiles = tx
      .select({ name: quoteFiles.storedName })
      .from(quoteFiles)
      .where(eq(quoteFiles.quoteId, id))
      .all()
      .map((f) => f.name);
    tx.delete(quotes).where(eq(quotes.id, id)).run();
    return { ref: row.ref, storedFiles };
  });
}

export const findQuoteFile = (storedName: string): QuoteFile | undefined =>
  getDb()
    .select({
      id: quoteFiles.id,
      originalName: quoteFiles.originalName,
      storedName: quoteFiles.storedName,
      size: quoteFiles.size,
      mimeType: quoteFiles.mimeType,
    })
    .from(quoteFiles)
    .where(eq(quoteFiles.storedName, storedName))
    .get();
