import { cache } from "react";
import { today } from "@/lib/format";
import { CLOSED_STATUSES, type QuoteStatus } from "@/lib/quotes/definitions";
import { computeTotals, hasPricedLines } from "@/lib/quotes/pricing";
import { listMessages } from "../repositories/messages";
import { listQuotes, type Quote } from "../repositories/quotes";

/** A follow-up is due when its date is reached and the quote is still open. */
export const isFollowUpDue = (q: Pick<Quote, "reminderDate" | "status">, day = today()): boolean =>
  !!q.reminderDate && q.reminderDate <= day && !CLOSED_STATUSES.includes(q.status);

export const quoteTotal = (q: Pick<Quote, "pricing">): number | null =>
  hasPricedLines(q.pricing) ? computeTotals(q.pricing).total : null;

export const loadQuotes = cache(listQuotes);
export const loadMessages = cache(listMessages);

/** Badges of the sidebar and dashboard tiles. */
export const loadCounters = cache(() => {
  const quotes = loadQuotes();
  return {
    newQuotes: quotes.filter((q) => q.status === "nouveau").length,
    dueFollowUps: quotes.filter((q) => isFollowUpDue(q)).length,
    unreadMessages: loadMessages().filter((m) => !m.read).length,
  };
});

export interface QuoteStats {
  total: number;
  /** "YYYY-MM" → count, last 12 months. */
  byMonth: [month: string, count: number][];
  byType: [type: string, count: number][];
  byStatus: Partial<Record<QuoteStatus, number>>;
  /** Accepted / (accepted + refused), in %, null when nothing is decided yet. */
  conversion: number | null;
  acceptedAmount: number;
  sentAmount: number;
}

export function quoteStats(quotes: Quote[], now = new Date()): QuoteStats {
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const byMonth = new Map(months.map((m) => [m, 0]));
  const byType = new Map<string, number>();
  const byStatus: Partial<Record<QuoteStatus, number>> = {};
  let acceptedAmount = 0;
  let sentAmount = 0;
  for (const q of quotes) {
    const m = q.createdAt.slice(0, 7);
    if (byMonth.has(m)) byMonth.set(m, (byMonth.get(m) ?? 0) + 1);
    for (const t of q.types) byType.set(t, (byType.get(t) ?? 0) + 1);
    byStatus[q.status] = (byStatus[q.status] ?? 0) + 1;
    const total = quoteTotal(q);
    if (total !== null) {
      if (q.status === "accepte") acceptedAmount += total;
      if (["envoye", "accepte", "refuse"].includes(q.status)) sentAmount += total;
    }
  }
  const decided = (byStatus.accepte ?? 0) + (byStatus.refuse ?? 0);
  return {
    total: quotes.length,
    byMonth: [...byMonth.entries()],
    byType: [...byType.entries()].sort((a, b) => b[1] - a[1]),
    byStatus,
    conversion: decided ? Math.round(((byStatus.accepte ?? 0) / decided) * 100) : null,
    acceptedAmount,
    sentAmount,
  };
}

export interface Client {
  key: string;
  lastName: string;
  firstName: string;
  organization: string;
  email: string;
  phone: string;
  city: string;
  quotes: { id: string; ref: string; status: QuoteStatus }[];
  messages: number;
  acceptedAmount: number;
  lastContact: string;
}

/** Customer file built from quotes and messages, grouped by e-mail, then phone, then name. */
export function buildClients(quotes: Quote[], messages: ReturnType<typeof listMessages>): Client[] {
  const keyOf = (email: string, phone: string, name: string) =>
    email.toLowerCase().trim() || phone.replace(/\D/g, "") || name.toLowerCase().trim();
  const map = new Map<string, Client>();
  const get = (key: string, base: Partial<Client>) => {
    let c = map.get(key);
    if (!c) {
      c = {
        key,
        lastName: "",
        firstName: "",
        organization: "",
        email: "",
        phone: "",
        city: "",
        quotes: [],
        messages: 0,
        acceptedAmount: 0,
        lastContact: "",
      };
      map.set(key, c);
    }
    for (const [field, value] of Object.entries(base) as [keyof Client, string][]) {
      if (value && !c[field]) (c as unknown as Record<string, unknown>)[field] = value;
    }
    return c;
  };
  for (const q of quotes) {
    const ct = q.contact;
    const c = get(keyOf(ct.email, ct.phone, ct.lastName), {
      lastName: ct.lastName,
      firstName: ct.firstName,
      organization: ct.organization,
      email: ct.email,
      phone: ct.phone,
      city: String(q.site.city ?? ""),
    });
    c.quotes.push({ id: q.id, ref: q.ref, status: q.status });
    if (q.status === "accepte") c.acceptedAmount += quoteTotal(q) ?? 0;
    if (q.createdAt > c.lastContact) c.lastContact = q.createdAt;
  }
  for (const m of messages) {
    const c = get(keyOf(m.email, m.phone, m.name), { lastName: m.name, email: m.email, phone: m.phone });
    c.messages++;
    if (m.createdAt > c.lastContact) c.lastContact = m.createdAt;
  }
  return [...map.values()].sort((a, b) => b.lastContact.localeCompare(a.lastContact));
}

/** Serializable row for the quote tables. */
export const toQuoteRow = (q: Quote) => ({
  id: q.id,
  ref: q.ref,
  createdAt: q.createdAt,
  name: `${q.contact.firstName} ${q.contact.lastName}`.trim(),
  organization: q.contact.organization,
  phone: q.contact.phone,
  email: q.contact.email,
  city: String(q.site.city ?? ""),
  types: q.types,
  total: quoteTotal(q),
  reminderDate: q.reminderDate,
  due: isFollowUpDue(q),
  status: q.status,
});
