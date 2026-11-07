/**
 * Domain types shared by the server (database, actions) and the browser (forms, admin UI).
 * Dates are ISO strings: "YYYY-MM-DD" for calendar days, full ISO for timestamps.
 */

export const UNIVERSES = { equitation: "Équitation", amenagement: "Aménagement" } as const;
export type Universe = keyof typeof UNIVERSES;

export interface BusinessInfo {
  name: string;
  tagline: string;
  phone: string;
  phoneIntl: string;
  email: string;
  address: string;
  city: string;
  facebook: string;
  instagram: string;
  /** Address used for the Google Maps embed and directions link. */
  mapQuery: string;
}

export interface Announcement {
  enabled: boolean;
  text: string;
  from: string;
  to: string;
}

export interface GoogleRating {
  enabled: boolean;
  /** Displayed as typed, e.g. "4,3". */
  note: string;
  reviewCount: number;
  url: string;
}

export interface LegalInfo {
  companyName: string;
  legalForm: string;
  siret: string;
  vatNumber: string;
  defaultVatRate: number;
  quoteValidityDays: number;
  quoteConditions: string;
}

export interface Settings {
  business: BusinessInfo;
  announcement: Announcement;
  google: GoogleRating;
  legal: LegalInfo;
}

export interface OpeningDay {
  day: string;
  /** "09:00-12:30, 14:00-19:00", empty when closed. */
  slots: string;
}

export interface CardItem {
  id: string;
  title: string;
  text: string;
  image: string;
}

export interface NewsItem {
  id: string;
  title: string;
  text: string;
  image: string;
  universe: Universe;
  publishDate: string;
  published: boolean;
  featured: boolean;
}

export interface GalleryPhoto {
  id: string;
  src: string;
  caption: string;
  universe: Universe;
}

export const USED_ITEM_STATUSES = { dispo: "Disponible", reserve: "Réservé", vendu: "Vendu" } as const;
export type UsedItemStatus = keyof typeof USED_ITEM_STATUSES;

export interface UsedItem {
  id: string;
  title: string;
  brand: string;
  size: string;
  condition: string;
  price: string;
  status: UsedItemStatus;
  image: string;
  description: string;
}

export interface Review {
  id: string;
  author: string;
  location: string;
  /** 1–5, null when no rating is displayed. */
  rating: number | null;
  text: string;
  published: boolean;
}

export interface Closure {
  id: string;
  startDate: string;
  /** Inclusive; empty for a single day. */
  endDate: string;
  reason: string;
}

export interface ContactMessage {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  read: boolean;
}

export interface ActivityEntry {
  at: string;
  text: string;
}
