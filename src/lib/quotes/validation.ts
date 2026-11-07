import { z } from "zod";
import {
  ANIMAL_COUNT_FIELD,
  ANIMALS_FIELD,
  CONTACT_FIELDS,
  EMPTY_CONTACT,
  type FieldDef,
  type FieldGroup,
  PROFILE_FIELD,
  PROJECT_TYPE_IDS,
  PROJECT_TYPES,
  type QuoteContact,
  type QuoteRequestData,
  SITE_FIELDS,
} from "./definitions";

const MAX_TEXT = 3000;

export const isEmail = (v: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const looseValue = z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]);
const looseGroup = z.record(z.string(), looseValue).default({});

/** Shape posted by the public form (JSON part of the multipart request). */
export const quoteSubmissionSchema = z.object({
  types: z.array(z.string()).default([]),
  details: z.record(z.string(), looseGroup).default({}),
  projectNotes: z.string().default(""),
  site: looseGroup,
  contact: looseGroup,
  consent: z.boolean().default(false),
  /** Honeypot: filled only by bots. */
  website: z.string().default(""),
});
export type QuoteSubmission = z.input<typeof quoteSubmissionSchema>;

const clean = (v: unknown, max = MAX_TEXT): string =>
  typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) : "";

/** Keeps only the declared fields, trims strings and keeps checkbox values that exist in the options. */
export function pickFields(fields: FieldDef[], input: Record<string, unknown>): FieldGroup {
  const out: FieldGroup = {};
  for (const f of fields) {
    const v = input[f.name];
    if (f.kind === "checkboxes") {
      const list = (Array.isArray(v) ? v : []).map((x) => clean(x)).filter((x) => f.options.includes(x));
      if (list.length) out[f.name] = list;
    } else {
      const s = clean(v);
      if (s) out[f.name] = s;
    }
  }
  return out;
}

export function pickContact(input: Record<string, unknown>): QuoteContact {
  const picked = pickFields([...CONTACT_FIELDS, PROFILE_FIELD], input);
  const contact = { ...EMPTY_CONTACT };
  for (const key of Object.keys(contact) as (keyof QuoteContact)[])
    contact[key] = String(picked[key] ?? "").slice(0, 200);
  return contact;
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Validates a public quote request. Returns French error messages suitable for display. */
export function parseQuoteSubmission(raw: unknown): ParseResult<QuoteRequestData> & { spam?: boolean } {
  const parsed = quoteSubmissionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Données invalides." };
  const s = parsed.data;
  if (s.website) return { ok: false, error: "", spam: true };

  const types = [...new Set(s.types.filter((t) => PROJECT_TYPE_IDS.includes(t)))];
  if (!types.length) return { ok: false, error: "Choisissez au moins un type de projet." };

  const contact = pickContact(s.contact);
  if (!contact.lastName || !(isEmail(contact.email) || contact.phone) || !s.consent) {
    return { ok: false, error: "Coordonnées incomplètes." };
  }

  const details: Record<string, FieldGroup> = {};
  for (const type of PROJECT_TYPES) {
    if (!types.includes(type.id)) continue;
    const group = pickFields(type.fields, s.details[type.id] ?? {});
    if (Object.keys(group).length) details[type.id] = group;
  }

  return {
    ok: true,
    data: {
      types,
      details,
      projectNotes: clean(s.projectNotes, 5000),
      site: pickFields([...SITE_FIELDS, ANIMALS_FIELD, ANIMAL_COUNT_FIELD], s.site),
      contact,
    },
  };
}

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------

export const contactMessageSchema = z
  .object({
    name: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    subject: z.string().default(""),
    message: z.string().default(""),
    website: z.string().default(""),
  })
  .transform((m) => ({
    name: m.name.trim().slice(0, 120),
    email: m.email.trim().slice(0, 160),
    phone: m.phone.trim().slice(0, 40),
    subject: m.subject.trim().slice(0, 160),
    message: m.message.trim().slice(0, 5000),
    website: m.website,
  }));

export const CONTACT_FORM_ERROR = "Merci d'indiquer votre nom, un e-mail ou un téléphone, et votre message.";

export const isCompleteContactMessage = (m: { name: string; email: string; phone: string; message: string }): boolean =>
  !!m.name && !!m.message && (isEmail(m.email) || !!m.phone);
