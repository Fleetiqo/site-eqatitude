"use server";

import { z } from "zod";
import { formatFrenchNumber, frenchDay } from "@/lib/format";
import { EMPTY_CONTACT, QUOTE_STATUS_IDS, QUOTE_STATUSES, type QuoteStatus } from "@/lib/quotes/definitions";
import { computeTotals, type QuotePricing } from "@/lib/quotes/pricing";
import { pickContact } from "@/lib/quotes/validation";
import { logActivity } from "../repositories/activity";
import { getMessage, setMessageRead } from "../repositories/messages";
import {
  createQuote,
  deleteQuote as removeQuote,
  getQuote,
  updateQuote,
  type QuotePatch,
} from "../repositories/quotes";
import { removeUploads } from "../services/storage";
import { adminAction, UserError } from "./run";

const statusSchema = z.enum(QUOTE_STATUS_IDS as [QuoteStatus, ...QuoteStatus[]]);
const isoDayOrEmpty = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);

const pricingSchema = z.object({
  subject: z.string().trim().max(300),
  lines: z
    .array(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("section"), label: z.string().trim().max(300) }),
        z.object({
          kind: z.literal("item"),
          label: z.string().trim().max(300),
          quantity: z.coerce.number().min(0).default(0),
          unit: z.string().max(20),
          unitPrice: z.coerce.number().min(0).default(0),
        }),
      ]),
    )
    .max(200),
  discountPercent: z.coerce.number().min(0).max(100),
  vatRate: z.coerce.number().min(0).max(100),
  validityDays: z.coerce.number().int().min(1).max(365),
  conditions: z.string().trim().max(5000),
  date: isoDayOrEmpty,
});

function apply(id: string, patch: QuotePatch, events: string[]) {
  const quote = updateQuote(id, patch, events);
  if (!quote) throw new UserError("Demande introuvable.");
  if (events.length) logActivity(`Mise à jour — devis ${quote.ref} (${events.join(", ")})`);
  return quote;
}

export async function setQuoteStatus(id: string, status: QuoteStatus, event?: string) {
  return adminAction(() => {
    const s = statusSchema.parse(status);
    apply(id, { status: s }, [`Statut : ${QUOTE_STATUSES[s]}`, ...(event ? [event] : [])]);
    return null;
  });
}

/** Opening a new request moves it to "En cours" (as before). */
export async function markQuoteViewed(id: string) {
  return adminAction(() => {
    const q = getQuote(id);
    if (q?.status === "nouveau") apply(id, { status: "en-cours" }, ["Statut : En cours", "Demande consultée"]);
    return null;
  });
}

export async function saveFollowUp(id: string, notes: string, reminderDate: string) {
  return adminAction(() => {
    const q = getQuote(id);
    if (!q) throw new UserError("Demande introuvable.");
    const n = z.string().max(10000).parse(notes);
    const r = isoDayOrEmpty.parse(reminderDate);
    const events: string[] = [];
    if (n !== q.notes) events.push("Notes modifiées");
    if (r !== q.reminderDate) events.push(r ? `Relance prévue le ${frenchDay(r)}` : "Relance supprimée");
    apply(id, { notes: n, reminderDate: r }, events);
    return null;
  });
}

export async function savePricing(id: string, pricing: QuotePricing) {
  return adminAction(() => {
    const p = pricingSchema.parse(pricing);
    const data: QuotePricing = {
      ...p,
      lines: p.lines.filter((l) => (l.kind === "section" ? l.label : l.label || l.unitPrice)),
      date: p.date || new Date().toISOString().slice(0, 10),
    };
    apply(id, { pricing: data }, [`Chiffrage enregistré (${formatFrenchNumber(computeTotals(data).total)} € TTC)`]);
    return null;
  });
}

/** After the e-mail is prepared: "Devis envoyé" with a follow-up in 7 days. */
export async function markQuoteSent(id: string, reminderDate: string) {
  return adminAction(() => {
    apply(id, { status: "envoye", reminderDate: isoDayOrEmpty.parse(reminderDate) }, [
      "Statut : Devis envoyé",
      `Relance prévue le ${frenchDay(reminderDate)}`,
      "Devis envoyé par e-mail",
    ]);
    return null;
  });
}

const manualQuoteSchema = z.object({
  source: z.string().trim().max(40).default("Magasin"),
  types: z.array(z.string()).default([]),
  description: z.string().trim().max(5000).default(""),
  city: z.string().trim().max(120).default(""),
  postalCode: z.string().trim().max(10).default(""),
  contact: z.record(z.string(), z.string()).default({}),
});

/** Request received by phone or in the shop. */
export async function createManualQuote(input: z.input<typeof manualQuoteSchema>) {
  return adminAction(() => {
    const m = manualQuoteSchema.parse(input);
    const contact = pickContact(m.contact);
    if (!contact.lastName) throw new UserError("Le nom du client est obligatoire.");
    const site: Record<string, string> = {};
    if (m.city) site.city = m.city;
    if (m.postalCode) site.postalCode = m.postalCode;
    const quote = createQuote({
      request: { types: m.types.length ? m.types : ["autre"], details: {}, projectNotes: m.description, site, contact },
      status: "en-cours",
      source: m.source || "Magasin",
      event: `Demande créée manuellement (${m.source || "Magasin"})`,
    });
    logActivity(`Ajout — devis ${quote.ref}`);
    return { id: quote.id, ref: quote.ref };
  });
}

/** Turns a contact message into a quote request and marks the message as read. */
export async function quoteFromMessage(messageId: string) {
  return adminAction(() => {
    const m = getMessage(messageId);
    if (!m) throw new UserError("Message introuvable.");
    const quote = createQuote({
      request: {
        types: ["autre"],
        details: {},
        projectNotes: (m.subject ? `${m.subject}\n\n` : "") + m.message,
        site: {},
        contact: { ...EMPTY_CONTACT, lastName: m.name, email: m.email, phone: m.phone },
      },
      status: "en-cours",
      source: "Formulaire de contact",
      event: "Demande créée manuellement (Formulaire de contact)",
    });
    setMessageRead(messageId, true);
    logActivity(`Ajout — devis ${quote.ref} (depuis un message)`);
    return { id: quote.id, ref: quote.ref };
  });
}

export async function deleteQuote(id: string) {
  return adminAction(async () => {
    const removed = removeQuote(id);
    if (!removed) throw new UserError("Demande introuvable.");
    await removeUploads("devis", removed.storedFiles);
    logActivity(`Suppression — devis ${removed.ref}`);
    return null;
  });
}
