import { z } from "zod";
import type { CollectionItem, CollectionSlug, ItemValues } from "@/lib/admin-collections";
import {
  deleteCard,
  deleteNews,
  deleteReview,
  deleteUsedItem,
  listCards,
  listNews,
  listReviews,
  listUsedItems,
  reorderCards,
  reorderReviews,
  reorderUsedItems,
  saveCard,
  saveNews,
  saveReview,
  saveUsedItem,
  type CardCollection,
} from "./repositories/catalog";
import { deleteClosure, getClosures, upsertClosure } from "./repositories/content";

/**
 * Server side of the generic content editor: validation and persistence per collection.
 * The admin form sends flat string/boolean values; each schema converts them to the domain type.
 */

const text = (max = 2000) => z.string().trim().max(max).default("");
const required = (label: string, max = 300) => z.string().trim().min(1, `« ${label} » est obligatoire.`).max(max);
const isoDay = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.")]).default("");
const imageUrl = z
  .union([z.literal(""), z.string().regex(/^\/(img|uploads\/site)\/[\w.\-]+$/, "Image invalide.")])
  .default("");

const cardSchema = z.object({ title: required("Titre"), text: text(), image: imageUrl });

const newsSchema = z.object({
  title: required("Titre"),
  text: text(10000),
  image: imageUrl,
  universe: z.enum(["equitation", "amenagement"]),
  publishDate: isoDay,
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
});

const usedItemSchema = z.object({
  title: required("Titre"),
  brand: text(120),
  size: text(120),
  condition: text(60),
  price: text(30),
  status: z.enum(["dispo", "reserve", "vendu"]).default("dispo"),
  image: imageUrl,
  description: text(),
});

const reviewSchema = z.object({
  author: required("Nom affiché", 120),
  location: text(120),
  rating: z
    .string()
    .default("")
    .transform((v) => (v ? Number(v) : null))
    .pipe(z.number().int().min(1).max(5).nullable()),
  text: required("Avis", 3000),
  published: z.boolean().default(false),
});

const closureSchema = z
  .object({ startDate: isoDay.refine(Boolean, "« Du » est obligatoire."), endDate: isoDay, reason: text(200) })
  .refine((c) => !c.endDate || c.endDate >= c.startDate, "La date de fin précède la date de début.");

interface ServerCollection {
  list(): CollectionItem[];
  /** Returns a short label for the activity log. */
  save(values: ItemValues, id?: string): string;
  remove(id: string): void;
  reorder?(ids: string[]): void;
}

const asItems = <T extends { id: string }>(rows: T[]): CollectionItem[] =>
  rows.map(
    (r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v === null ? "" : typeof v === "number" ? String(v) : v]),
      ) as CollectionItem,
  );

const cards = (collection: CardCollection): ServerCollection => ({
  list: () => asItems(listCards(collection)),
  save: (values, id) => saveCard(collection, cardSchema.parse(values), id).title,
  remove: (id) => deleteCard(collection, id),
  reorder: (ids) => reorderCards(collection, ids),
});

export const SERVER_COLLECTIONS: Record<CollectionSlug, ServerCollection> = {
  nouveautes: {
    list: () => asItems(listNews()),
    save: (values, id) => saveNews(newsSchema.parse(values), id).title,
    remove: deleteNews,
  },
  occasions: {
    list: () => asItems(listUsedItems()),
    save: (values, id) => saveUsedItem(usedItemSchema.parse(values), id).title,
    remove: deleteUsedItem,
    reorder: reorderUsedItems,
  },
  avis: {
    list: () => asItems(listReviews()),
    save: (values, id) => saveReview(reviewSchema.parse(values), id).author,
    remove: deleteReview,
    reorder: reorderReviews,
  },
  fermetures: {
    list: () => asItems(getClosures().sort((a, b) => b.startDate.localeCompare(a.startDate))),
    save: (values, id) => {
      const c = closureSchema.parse(values);
      upsertClosure(c, id);
      return c.reason || c.startDate;
    },
    remove: deleteClosure,
  },
  rayons: cards("departments"),
  amenagements: cards("fittingOffers"),
  services: cards("services"),
};
