import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { Announcement, BusinessInfo, GoogleRating, LegalInfo } from "@/lib/types";
import type { FieldGroup, QuoteContact } from "@/lib/quotes/definitions";
import type { QuotePricing } from "@/lib/quotes/pricing";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
const createdAt = () => text("created_at").notNull().default(now);
const updatedAt = () => text("updated_at").notNull().default(now);
const position = () => integer("position").notNull().default(0);

// ---------------------------------------------------------------------------
// Site settings & editable content
// ---------------------------------------------------------------------------

/** Typed settings documents, one row per key. */
export interface SettingsDocuments {
  business: BusinessInfo;
  announcement: Announcement;
  google: GoogleRating;
  legal: LegalInfo;
}
export type SettingsKey = keyof SettingsDocuments;

export const settings = sqliteTable("settings", {
  key: text("key").$type<SettingsKey>().primaryKey(),
  value: text("value", { mode: "json" }).notNull(),
  updatedAt: updatedAt(),
});

/** Overrides of the texts and images declared in src/content/blocks.ts. */
export const contentBlocks = sqliteTable("content_blocks", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: updatedAt(),
});

export const openingHours = sqliteTable("opening_hours", {
  /** 0 = first row displayed (Lundi) … 6 (Dimanche). */
  position: integer("position").primaryKey(),
  day: text("day").notNull(),
  slots: text("slots").notNull().default(""),
});

export const closures = sqliteTable("closures", {
  id: text("id").primaryKey(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull().default(""),
  reason: text("reason").notNull().default(""),
});

export const brands = sqliteTable("brands", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  position: position(),
});

/** Store departments ("rayons"), shown on the home and Équitation pages. */
export const departments = sqliteTable("departments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  text: text("text").notNull().default(""),
  image: text("image").notNull().default(""),
  position: position(),
});

/** Stable fitting offers ("offres aménagement"). */
export const fittingOffers = sqliteTable("fitting_offers", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  text: text("text").notNull().default(""),
  image: text("image").notNull().default(""),
  position: position(),
});

export const services = sqliteTable("services", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  text: text("text").notNull().default(""),
  image: text("image").notNull().default(""),
  position: position(),
});

export const news = sqliteTable(
  "news",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    text: text("text").notNull().default(""),
    image: text("image").notNull().default(""),
    universe: text("universe", { enum: ["equitation", "amenagement"] }).notNull(),
    publishDate: text("publish_date").notNull().default(""),
    published: integer("published", { mode: "boolean" }).notNull().default(true),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("news_publish_idx").on(t.published, t.publishDate)],
);

export const galleryPhotos = sqliteTable("gallery_photos", {
  id: text("id").primaryKey(),
  src: text("src").notNull(),
  caption: text("caption").notNull().default(""),
  universe: text("universe", { enum: ["equitation", "amenagement"] }).notNull(),
  position: position(),
});

/** Second-hand saddles and equipment ("occasions"). */
export const usedItems = sqliteTable("used_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  brand: text("brand").notNull().default(""),
  size: text("size").notNull().default(""),
  condition: text("condition").notNull().default(""),
  price: text("price").notNull().default(""),
  status: text("status", { enum: ["dispo", "reserve", "vendu"] })
    .notNull()
    .default("dispo"),
  image: text("image").notNull().default(""),
  description: text("description").notNull().default(""),
  position: position(),
});

export const reviews = sqliteTable("reviews", {
  id: text("id").primaryKey(),
  author: text("author").notNull(),
  location: text("location").notNull().default(""),
  rating: integer("rating"),
  text: text("text").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  position: position(),
});

// ---------------------------------------------------------------------------
// Requests: quotes and contact messages
// ---------------------------------------------------------------------------

export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    ref: text("ref").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    status: text("status", { enum: ["nouveau", "en-cours", "envoye", "accepte", "refuse", "archive"] })
      .notNull()
      .default("nouveau"),
    /** Where the request came from when created by hand (Magasin, Téléphone…); empty for the website form. */
    source: text("source").notNull().default(""),
    notes: text("notes").notNull().default(""),
    reminderDate: text("reminder_date").notNull().default(""),
    types: text("types", { mode: "json" }).$type<string[]>().notNull(),
    details: text("details", { mode: "json" }).$type<Record<string, FieldGroup>>().notNull(),
    projectNotes: text("project_notes").notNull().default(""),
    site: text("site", { mode: "json" }).$type<FieldGroup>().notNull(),
    contact: text("contact", { mode: "json" }).$type<QuoteContact>().notNull(),
    pricing: text("pricing", { mode: "json" }).$type<QuotePricing>(),
  },
  (t) => [
    uniqueIndex("quotes_ref_idx").on(t.ref),
    index("quotes_status_idx").on(t.status),
    index("quotes_created_idx").on(t.createdAt),
  ],
);

/** Last quote number used per year, so numbers are never reused after a deletion. */
export const quoteCounters = sqliteTable("quote_counters", {
  year: integer("year").primaryKey(),
  last: integer("last").notNull(),
});

export const quoteFiles = sqliteTable(
  "quote_files",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    originalName: text("original_name").notNull(),
    storedName: text("stored_name").notNull(),
    size: integer("size").notNull(),
    mimeType: text("mime_type").notNull(),
  },
  (t) => [index("quote_files_quote_idx").on(t.quoteId), uniqueIndex("quote_files_stored_idx").on(t.storedName)],
);

/** Timeline of a quote (status changes, notes, pricing…). */
export const quoteEvents = sqliteTable(
  "quote_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    quoteId: text("quote_id")
      .notNull()
      .references(() => quotes.id, { onDelete: "cascade" }),
    at: text("at").notNull().default(now),
    text: text("text").notNull(),
  },
  (t) => [index("quote_events_quote_idx").on(t.quoteId, t.at)],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    createdAt: createdAt(),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    subject: text("subject").notNull().default(""),
    message: text("message").notNull(),
    read: integer("read", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("messages_created_idx").on(t.createdAt)],
);

// ---------------------------------------------------------------------------
// Analytics & audit
// ---------------------------------------------------------------------------

/** Anonymous daily page views (no cookie, no IP stored). */
export const pageViews = sqliteTable(
  "page_views",
  {
    day: text("day").notNull(),
    path: text("path").notNull(),
    views: integer("views").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.day, t.path] })],
);

export const activityLog = sqliteTable(
  "activity_log",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    at: text("at").notNull().default(now),
    text: text("text").notNull(),
  },
  (t) => [index("activity_at_idx").on(t.at)],
);

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/** Single administrator account (id = 1). */
export const adminAccount = sqliteTable("admin_account", {
  id: integer("id").primaryKey(),
  passwordHash: text("password_hash").notNull(),
  updatedAt: updatedAt(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    /** SHA-256 of the session token: a leaked database does not leak usable sessions. */
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("sessions_expires_idx").on(t.expiresAt)],
);

export const loginAttempts = sqliteTable("login_attempts", {
  key: text("key").primaryKey(),
  failures: integer("failures").notNull().default(0),
  lockedUntil: integer("locked_until").notNull().default(0),
});
