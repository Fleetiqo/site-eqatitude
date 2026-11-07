import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { settings, type SettingsDocuments, type SettingsKey } from "../db/schema";
import type { Settings } from "@/lib/types";

export const DEFAULT_SETTINGS: Settings = {
  business: {
    name: "Sellerie Equ'Attitud",
    tagline: "Sellerie, équipement équestre et aménagement d'écurie à Quimper",
    phone: "02 98 53 01 77",
    phoneIntl: "+33298530177",
    email: "contact@sellerie-equattitud.fr",
    address: "7 allée du Dr Picquenard",
    city: "29000 Quimper",
    facebook: "https://www.facebook.com/equattitud",
    instagram: "https://www.instagram.com/sellerie.equattitud/",
    mapQuery: "7 allée du Docteur Picquenard, 29000 Quimper",
  },
  announcement: { enabled: false, text: "", from: "", to: "" },
  google: { enabled: false, note: "", reviewCount: 0, url: "" },
  legal: {
    companyName: "Sellerie Equ'Attitud",
    legalForm: "",
    siret: "",
    vatNumber: "",
    defaultVatRate: 20,
    quoteValidityDays: 30,
    quoteConditions: "Devis gratuit, valable 30 jours à compter de sa date d'émission. Prix exprimés en euros.",
  },
};

/** All settings, each document merged over its defaults (new fields get a value automatically). */
export function getSettings(): Settings {
  const rows = getDb().select().from(settings).all();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Partial<SettingsDocuments>;
  return {
    business: { ...DEFAULT_SETTINGS.business, ...stored.business },
    announcement: { ...DEFAULT_SETTINGS.announcement, ...stored.announcement },
    google: { ...DEFAULT_SETTINGS.google, ...stored.google },
    legal: { ...DEFAULT_SETTINGS.legal, ...stored.legal },
  };
}

export function saveSettings<K extends SettingsKey>(key: K, value: SettingsDocuments[K]): void {
  const updatedAt = new Date().toISOString();
  getDb()
    .insert(settings)
    .values({ key, value, updatedAt })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt } })
    .run();
}

export const hasSettings = (): boolean =>
  !!getDb().select({ key: settings.key }).from(settings).where(eq(settings.key, "business")).get();
