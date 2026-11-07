/**
 * Converts data from the original Express version (data/*.json) to the current model.
 * Used by `npm run import:legacy` and when restoring an old backup file.
 */
import { BLOCKS, LEGACY_PAGE_KEYS } from "@/content/blocks";
import {
  ANIMAL_COUNT_FIELD,
  ANIMALS_FIELD,
  CONTACT_FIELDS,
  EMPTY_CONTACT,
  type FieldDef,
  type FieldGroup,
  type FieldValue,
  PROFILE_FIELD,
  PROJECT_TYPES,
  QUOTE_STATUS_IDS,
  type QuoteContact,
  type QuoteStatus,
  SITE_FIELDS,
} from "@/lib/quotes/definitions";
import type { PricingLine, QuotePricing } from "@/lib/quotes/pricing";
import type { ContactMessage, Universe } from "@/lib/types";
import type { QuoteWithRelations } from "../repositories/quotes";
import { DEFAULT_SETTINGS } from "../repositories/settings";
import type { SiteContent } from "../services/content-transfer";

type Json = Record<string, unknown>;

const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});
const arr = (v: unknown): Json[] => (Array.isArray(v) ? v.map(obj) : []);
const s = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const num = (v: unknown, fallback = 0): number =>
  Number.isFinite(Number(v)) && v !== "" && v != null ? Number(v) : fallback;
const universe = (v: unknown): Universe => (v === "amenagement" ? "amenagement" : "equitation");

// --- Content -----------------------------------------------------------------

export function convertLegacyContent(raw: unknown): SiteContent {
  const c = obj(raw);
  const st = obj(c.settings);
  const ann = obj(st.announcement);
  const legal = obj(st.legal);
  const google = obj(st.google);
  const pages = obj(c.pages);
  const card = (r: Json) => ({ id: s(r.id), title: s(r.title), text: s(r.text), image: s(r.img) });

  const blocks: Record<string, string> = {};
  for (const [legacyKey, blockKey] of Object.entries(LEGACY_PAGE_KEYS)) {
    const value = pages[legacyKey];
    if (typeof value === "string" && value !== BLOCKS[blockKey].default) blocks[blockKey] = value;
  }

  const business = { ...DEFAULT_SETTINGS.business };
  for (const key of [
    "name",
    "tagline",
    "phone",
    "phoneIntl",
    "email",
    "address",
    "city",
    "facebook",
    "instagram",
  ] as const) {
    if (typeof st[key] === "string") business[key] = st[key] as string;
  }

  return {
    settings: {
      business,
      announcement: { enabled: !!ann.enabled, text: s(ann.text), from: s(ann.from), to: s(ann.to) },
      google: { enabled: !!google.enabled, note: s(google.note), reviewCount: num(google.nbAvis), url: s(google.url) },
      legal: {
        companyName: s(legal.raisonSociale) || DEFAULT_SETTINGS.legal.companyName,
        legalForm: s(legal.formeJuridique),
        siret: s(legal.siret),
        vatNumber: s(legal.tvaIntra),
        defaultVatRate: num(legal.tvaDefaut, 20),
        quoteValidityDays: num(legal.validiteJours, 30),
        quoteConditions: s(legal.conditions) || DEFAULT_SETTINGS.legal.quoteConditions,
      },
    },
    hours: arr(c.hours).map((h) => ({ day: s(h.day), slots: s(h.slots) })),
    blocks,
    brands: (Array.isArray(c.brands) ? c.brands : []).map(s).filter(Boolean),
    departments: arr(c.rayons).map(card),
    fittingOffers: arr(c.amenagements).map(card),
    services: arr(c.services).map(card),
    news: arr(c.news).map((n) => ({
      id: s(n.id),
      title: s(n.title),
      text: s(n.text),
      image: s(n.img),
      universe: universe(n.univers),
      publishDate: s(n.date),
      published: n.published !== false,
      featured: n.featured === true,
    })),
    gallery: arr(c.gallery).map((g) => ({
      id: s(g.id),
      src: s(g.src),
      caption: s(g.caption),
      universe: universe(g.univers),
    })),
    usedItems: arr(c.occasions).map((o) => ({
      id: s(o.id),
      title: s(o.title),
      brand: s(o.marque),
      size: s(o.taille),
      condition: s(o.etat),
      price: s(o.prix),
      status: o.statut === "reserve" || o.statut === "vendu" ? o.statut : "dispo",
      image: s(o.img),
      description: s(o.description),
    })),
    reviews: arr(c.avis).map((a) => ({
      id: s(a.id),
      author: s(a.auteur),
      location: s(a.lieu),
      rating: num(a.note) >= 1 && num(a.note) <= 5 ? Math.round(num(a.note)) : null,
      text: s(a.texte),
      published: a.published !== false,
    })),
    closures: arr(c.closures).map((f) => ({ id: s(f.id), startDate: s(f.du), endDate: s(f.au), reason: s(f.motif) })),
  };
}

// --- Quotes ------------------------------------------------------------------

/** Renames legacy keys (French) to current field names; unknown keys are kept as is so nothing is lost. */
function mapFields(fields: FieldDef[], input: Json): FieldGroup {
  const out: FieldGroup = {};
  for (const [key, value] of Object.entries(input)) {
    const def = fields.find((f) => f.legacy === key);
    const v: FieldValue = Array.isArray(value) ? value.map(s) : s(value);
    if (v === "" || (Array.isArray(v) && !v.length)) continue;
    out[def ? def.name : key] = v;
  }
  return out;
}

function convertPricing(raw: unknown, fallbackDate: string): QuotePricing | null {
  const ch = obj(raw);
  if (!Array.isArray(ch.lignes)) return null;
  const lines: PricingLine[] = arr(ch.lignes).map((l) =>
    l.section
      ? { kind: "section", label: s(l.designation) }
      : { kind: "item", label: s(l.designation), quantity: num(l.qte), unit: s(l.unite) || "u", unitPrice: num(l.pu) },
  );
  return {
    subject: s(ch.objet),
    lines,
    discountPercent: num(ch.remise),
    vatRate: num(ch.tva, 20),
    validityDays: num(ch.validite, 30),
    conditions: s(ch.conditions),
    date: s(ch.date) || fallbackDate,
  };
}

export function convertLegacyQuote(raw: unknown): QuoteWithRelations {
  const q = obj(raw);
  const details = obj(q.details);
  const contactIn = obj(q.contact);
  const types = (Array.isArray(q.types) ? q.types : []).map(s).filter(Boolean);

  const contactGroup = mapFields([...CONTACT_FIELDS, PROFILE_FIELD], contactIn);
  const contact: QuoteContact = { ...EMPTY_CONTACT };
  for (const key of Object.keys(contact) as (keyof QuoteContact)[]) contact[key] = s(contactGroup[key]);

  const typeDetails: Record<string, FieldGroup> = {};
  for (const t of PROJECT_TYPES) {
    const group = mapFields(t.fields, obj(details[t.id]));
    if (Object.keys(group).length) typeDetails[t.id] = group;
  }

  const status = QUOTE_STATUS_IDS.includes(q.status as QuoteStatus) ? (q.status as QuoteStatus) : "nouveau";
  const createdAt = s(q.createdAt) || new Date().toISOString();

  return {
    id: s(q.id),
    ref: s(q.ref),
    createdAt,
    status,
    source: s(q.source),
    notes: s(q.notes),
    reminderDate: s(q.rappel),
    types,
    details: typeDetails,
    projectNotes: s(details.precisions),
    site: mapFields([...SITE_FIELDS, ANIMALS_FIELD, ANIMAL_COUNT_FIELD], obj(q.chantier)),
    contact,
    pricing: convertPricing(q.chiffrage, createdAt.slice(0, 10)),
    files: arr(q.files).map((f, i) => ({
      id: i + 1,
      originalName: s(f.name),
      storedName: s(f.file),
      size: num(f.size),
      mimeType: s(f.type),
    })),
    history: arr(q.history).map((h) => ({ at: s(h.at), text: s(h.text) })),
  };
}

export const convertLegacyMessage = (raw: unknown): ContactMessage => {
  const m = obj(raw);
  return {
    id: s(m.id),
    createdAt: s(m.createdAt),
    name: s(m.name),
    email: s(m.email),
    phone: s(m.phone),
    subject: s(m.subject),
    message: s(m.message),
    read: !!m.read,
  };
};
