import { z } from "zod";
import { getDb } from "../db/client";
import {
  brands,
  closures,
  contentBlocks,
  departments,
  fittingOffers,
  galleryPhotos,
  messages,
  news,
  openingHours,
  quoteEvents,
  quoteFiles,
  quotes,
  reviews,
  services,
  settings,
  usedItems,
} from "../db/schema";
import { listGallery, listCards, listNews, listReviews, listUsedItems } from "../repositories/catalog";
import { getBlockOverrides, getBrands, getClosures, getOpeningHours } from "../repositories/content";
import { listMessages } from "../repositories/messages";
import { getQuote, listQuotes, type QuoteWithRelations } from "../repositories/quotes";
import { DEFAULT_SETTINGS, getSettings } from "../repositories/settings";
import { BLOCKS, isBlockKey } from "@/content/blocks";
import type {
  CardItem,
  Closure,
  ContactMessage,
  GalleryPhoto,
  NewsItem,
  OpeningDay,
  Review,
  Settings,
  UsedItem,
} from "@/lib/types";

/** Everything editable on the public site, in a portable form (seed data and backups). */
export interface SiteContent {
  settings: Settings;
  hours: OpeningDay[];
  /** Overrides of src/content/blocks.ts. */
  blocks: Record<string, string>;
  brands: string[];
  departments: CardItem[];
  fittingOffers: CardItem[];
  services: CardItem[];
  news: NewsItem[];
  gallery: GalleryPhoto[];
  usedItems: UsedItem[];
  reviews: Review[];
  closures: Closure[];
}

export interface Backup {
  app: "equattitud";
  version: 2;
  createdAt: string;
  content: SiteContent;
  quotes: QuoteWithRelations[];
  messages: ContactMessage[];
}

// --- Validation of imported data ---------------------------------------------

const str = z.string().default("");
const universe = z.enum(["equitation", "amenagement"]);
const card = z.object({ id: z.string().min(1), title: z.string(), text: str, image: str });

export const siteContentSchema = z.object({
  settings: z.object({
    business: z.object(Object.fromEntries(Object.keys(DEFAULT_SETTINGS.business).map((k) => [k, str]))).partial(),
    announcement: z.object({ enabled: z.boolean().default(false), text: str, from: str, to: str }).partial(),
    google: z.object({ enabled: z.boolean(), note: str, reviewCount: z.number(), url: str }).partial(),
    legal: z
      .object({
        companyName: str,
        legalForm: str,
        siret: str,
        vatNumber: str,
        defaultVatRate: z.number(),
        quoteValidityDays: z.number(),
        quoteConditions: str,
      })
      .partial(),
  }),
  hours: z.array(z.object({ day: z.string(), slots: str })).length(7),
  blocks: z.record(z.string(), z.string()).default({}),
  brands: z.array(z.string()).default([]),
  departments: z.array(card).default([]),
  fittingOffers: z.array(card).default([]),
  services: z.array(card).default([]),
  news: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string(),
        text: str,
        image: str,
        universe,
        publishDate: str,
        published: z.boolean(),
        featured: z.boolean().default(false),
      }),
    )
    .default([]),
  gallery: z.array(z.object({ id: z.string().min(1), src: z.string(), caption: str, universe })).default([]),
  usedItems: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string(),
        brand: str,
        size: str,
        condition: str,
        price: str,
        status: z.enum(["dispo", "reserve", "vendu"]),
        image: str,
        description: str,
      }),
    )
    .default([]),
  reviews: z
    .array(
      z.object({
        id: z.string().min(1),
        author: z.string(),
        location: str,
        rating: z.number().int().min(1).max(5).nullable(),
        text: z.string(),
        published: z.boolean(),
      }),
    )
    .default([]),
  closures: z.array(z.object({ id: z.string().min(1), startDate: z.string(), endDate: str, reason: str })).default([]),
});

// --- Export ------------------------------------------------------------------

export function exportContent(): SiteContent {
  return {
    settings: getSettings(),
    hours: getOpeningHours(),
    blocks: getBlockOverrides(),
    brands: getBrands(),
    departments: listCards("departments"),
    fittingOffers: listCards("fittingOffers"),
    services: listCards("services"),
    news: listNews(),
    gallery: listGallery(),
    usedItems: listUsedItems(),
    reviews: listReviews(),
    closures: getClosures(),
  };
}

export function exportBackup(): Backup {
  return {
    app: "equattitud",
    version: 2,
    createdAt: new Date().toISOString(),
    content: exportContent(),
    quotes: listQuotes()
      .map((q) => getQuote(q.id))
      .filter((q): q is QuoteWithRelations => q !== null),
    messages: listMessages(),
  };
}

// --- Import ------------------------------------------------------------------

/** Replaces all site content (not quotes or messages) in one transaction. */
export function importContent(input: SiteContent): void {
  const c = siteContentSchema.parse(input);
  const db = getDb();
  db.transaction((tx) => {
    for (const t of [
      contentBlocks,
      openingHours,
      brands,
      departments,
      fittingOffers,
      services,
      news,
      galleryPhotos,
      usedItems,
      reviews,
      closures,
    ]) {
      tx.delete(t).run();
    }
    const s = {
      business: { ...DEFAULT_SETTINGS.business, ...c.settings.business },
      announcement: { ...DEFAULT_SETTINGS.announcement, ...c.settings.announcement },
      google: { ...DEFAULT_SETTINGS.google, ...c.settings.google },
      legal: { ...DEFAULT_SETTINGS.legal, ...c.settings.legal },
    };
    for (const [key, value] of Object.entries(s) as [keyof typeof s, (typeof s)[keyof typeof s]][]) {
      tx.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } }).run();
    }
    c.hours.forEach((h, position) =>
      tx
        .insert(openingHours)
        .values({ position, ...h })
        .run(),
    );
    for (const [key, value] of Object.entries(c.blocks)) {
      if (isBlockKey(key) && value !== BLOCKS[key].default) tx.insert(contentBlocks).values({ key, value }).run();
    }
    c.brands.forEach((name, position) => tx.insert(brands).values({ name, position }).run());
    c.departments.forEach((r, position) =>
      tx
        .insert(departments)
        .values({ ...r, position })
        .run(),
    );
    c.fittingOffers.forEach((r, position) =>
      tx
        .insert(fittingOffers)
        .values({ ...r, position })
        .run(),
    );
    c.services.forEach((r, position) =>
      tx
        .insert(services)
        .values({ ...r, position })
        .run(),
    );
    c.news.forEach((r) => tx.insert(news).values(r).run());
    c.gallery.forEach((r, position) =>
      tx
        .insert(galleryPhotos)
        .values({ ...r, position })
        .run(),
    );
    c.usedItems.forEach((r, position) =>
      tx
        .insert(usedItems)
        .values({ ...r, position })
        .run(),
    );
    c.reviews.forEach((r, position) =>
      tx
        .insert(reviews)
        .values({ ...r, position })
        .run(),
    );
    c.closures.forEach((r) => tx.insert(closures).values(r).run());
  });
}

/** Replaces all quotes and messages (used when restoring a full backup or importing the old site). */
export function importRequests(quoteList: QuoteWithRelations[], messageList: ContactMessage[]): void {
  const db = getDb();
  db.transaction((tx) => {
    tx.delete(quotes).run(); // files and events cascade
    tx.delete(messages).run();
    for (const q of quoteList) {
      const { files, history, ...quote } = q;
      tx.insert(quotes)
        .values({ ...quote, updatedAt: history[0]?.at ?? quote.createdAt, pricing: quote.pricing ?? undefined })
        .run();
      for (const f of files) {
        const { id: _id, ...file } = f;
        tx.insert(quoteFiles)
          .values({ ...file, quoteId: q.id })
          .run();
      }
      // History is shown newest first; insert oldest first so ids follow chronology.
      for (const e of [...history].reverse())
        tx.insert(quoteEvents).values({ quoteId: q.id, at: e.at, text: e.text }).run();
    }
    for (const m of messageList) tx.insert(messages).values(m).run();
  });
}

export const isEmptyDatabase = (): boolean => !getDb().select({ key: settings.key }).from(settings).limit(1).get();
