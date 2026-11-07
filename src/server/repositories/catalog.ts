import { asc, desc, eq, max, sql } from "drizzle-orm";
import { getDb } from "../db/client";
import { departments, fittingOffers, galleryPhotos, news, reviews, services, usedItems } from "../db/schema";
import { newId } from "../ids";
import type { CardItem, GalleryPhoto, NewsItem, Review, Universe, UsedItem } from "@/lib/types";

/** Tables that share the ordered card shape (title, text, image). */
const CARD_TABLES = { departments, fittingOffers, services } as const;
export type CardCollection = keyof typeof CARD_TABLES;

type OrderedTable =
  | typeof departments
  | typeof fittingOffers
  | typeof services
  | typeof galleryPhotos
  | typeof usedItems
  | typeof reviews;

function nextPosition(table: OrderedTable): number {
  const row = getDb()
    .select({ value: max(table.position) })
    .from(table)
    .get();
  return (row?.value ?? -1) + 1;
}

/** Applies the given order; ids not listed keep their relative order after the listed ones. */
function reorder(table: OrderedTable, ids: string[]): void {
  const db = getDb();
  db.transaction((tx) => {
    const all = tx.select({ id: table.id }).from(table).orderBy(asc(table.position)).all();
    const known = new Set(all.map((r) => r.id));
    const ordered = [...ids.filter((id) => known.has(id)), ...all.map((r) => r.id).filter((id) => !ids.includes(id))];
    ordered.forEach((id, position) => tx.update(table).set({ position }).where(eq(table.id, id)).run());
  });
}

// --- Cards: departments, fitting offers, services -----------------------------

export function listCards(collection: CardCollection): CardItem[] {
  const t = CARD_TABLES[collection];
  return getDb()
    .select({ id: t.id, title: t.title, text: t.text, image: t.image })
    .from(t)
    .orderBy(asc(t.position))
    .all();
}

export function saveCard(collection: CardCollection, data: Omit<CardItem, "id">, id?: string): CardItem {
  const t = CARD_TABLES[collection];
  if (id) {
    getDb().update(t).set(data).where(eq(t.id, id)).run();
    return { id, ...data };
  }
  const row = { id: newId(), ...data, position: nextPosition(t) };
  getDb().insert(t).values(row).run();
  return { id: row.id, ...data };
}

export const deleteCard = (collection: CardCollection, id: string): void => {
  const t = CARD_TABLES[collection];
  getDb().delete(t).where(eq(t.id, id)).run();
};

export const reorderCards = (collection: CardCollection, ids: string[]): void => reorder(CARD_TABLES[collection], ids);

// --- News ---------------------------------------------------------------------

const newsColumns = {
  id: news.id,
  title: news.title,
  text: news.text,
  image: news.image,
  universe: news.universe,
  publishDate: news.publishDate,
  published: news.published,
  featured: news.featured,
};

/** All news, newest first (admin). */
export const listNews = (): NewsItem[] =>
  getDb().select(newsColumns).from(news).orderBy(desc(news.publishDate), desc(news.createdAt)).all();

/** Published news whose date is reached (a future date schedules the publication), featured first. */
export const listPublishedNews = (isoDay: string): NewsItem[] =>
  getDb()
    .select(newsColumns)
    .from(news)
    .where(sql`${news.published} = 1 AND (${news.publishDate} = '' OR ${news.publishDate} <= ${isoDay})`)
    .orderBy(desc(news.featured), desc(news.publishDate))
    .all();

export function saveNews(data: Omit<NewsItem, "id">, id?: string): NewsItem {
  const db = getDb();
  if (id) {
    db.update(news)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(news.id, id))
      .run();
    return { id, ...data };
  }
  const row = { id: newId(), ...data };
  db.insert(news).values(row).run();
  return row;
}

export const deleteNews = (id: string): void => void getDb().delete(news).where(eq(news.id, id)).run();

// --- Gallery ------------------------------------------------------------------

export const listGallery = (universe?: Universe): GalleryPhoto[] => {
  const q = getDb()
    .select({
      id: galleryPhotos.id,
      src: galleryPhotos.src,
      caption: galleryPhotos.caption,
      universe: galleryPhotos.universe,
    })
    .from(galleryPhotos);
  return (universe ? q.where(eq(galleryPhotos.universe, universe)) : q).orderBy(asc(galleryPhotos.position)).all();
};

export function addGalleryPhotos(srcs: string[], universe: Universe): void {
  const db = getDb();
  db.transaction((tx) => {
    let position = nextPosition(galleryPhotos);
    for (const src of srcs)
      tx.insert(galleryPhotos).values({ id: newId(), src, caption: "", universe, position: position++ }).run();
  });
}

export const updateGalleryPhoto = (id: string, data: Partial<Omit<GalleryPhoto, "id">>): void =>
  void getDb().update(galleryPhotos).set(data).where(eq(galleryPhotos.id, id)).run();

export const deleteGalleryPhoto = (id: string): void =>
  void getDb().delete(galleryPhotos).where(eq(galleryPhotos.id, id)).run();

export const reorderGallery = (ids: string[]): void => reorder(galleryPhotos, ids);

// --- Used items ("occasions") -------------------------------------------------

const usedColumns = {
  id: usedItems.id,
  title: usedItems.title,
  brand: usedItems.brand,
  size: usedItems.size,
  condition: usedItems.condition,
  price: usedItems.price,
  status: usedItems.status,
  image: usedItems.image,
  description: usedItems.description,
};

export const listUsedItems = (): UsedItem[] =>
  getDb().select(usedColumns).from(usedItems).orderBy(asc(usedItems.position)).all();

/** Items shown on the site: sold items disappear automatically. */
export const listAvailableUsedItems = (): UsedItem[] => listUsedItems().filter((i) => i.status !== "vendu");

export function saveUsedItem(data: Omit<UsedItem, "id">, id?: string): UsedItem {
  if (id) {
    getDb().update(usedItems).set(data).where(eq(usedItems.id, id)).run();
    return { id, ...data };
  }
  const row = { id: newId(), ...data, position: nextPosition(usedItems) };
  getDb().insert(usedItems).values(row).run();
  return { id: row.id, ...data };
}

export const deleteUsedItem = (id: string): void => void getDb().delete(usedItems).where(eq(usedItems.id, id)).run();
export const reorderUsedItems = (ids: string[]): void => reorder(usedItems, ids);

// --- Reviews ------------------------------------------------------------------

const reviewColumns = {
  id: reviews.id,
  author: reviews.author,
  location: reviews.location,
  rating: reviews.rating,
  text: reviews.text,
  published: reviews.published,
};

export const listReviews = (): Review[] =>
  getDb().select(reviewColumns).from(reviews).orderBy(asc(reviews.position)).all();
export const listPublishedReviews = (): Review[] => listReviews().filter((r) => r.published);

export function saveReview(data: Omit<Review, "id">, id?: string): Review {
  if (id) {
    getDb().update(reviews).set(data).where(eq(reviews.id, id)).run();
    return { id, ...data };
  }
  const row = { id: newId(), ...data, position: nextPosition(reviews) };
  getDb().insert(reviews).values(row).run();
  return { id: row.id, ...data };
}

export const deleteReview = (id: string): void => void getDb().delete(reviews).where(eq(reviews.id, id)).run();
export const reorderReviews = (ids: string[]): void => reorder(reviews, ids);
