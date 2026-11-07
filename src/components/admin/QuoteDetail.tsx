"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { addDays, euro, formatDateTime, today } from "@/lib/format";
import {
  ANIMAL_COUNT_FIELD,
  ANIMALS_FIELD,
  CONTACT_FIELDS,
  displayValue,
  fieldLabel,
  type FieldDef,
  type FieldGroup,
  PROFILE_FIELD,
  PROJECT_TYPES,
  projectTypeShortLabel,
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_IDS,
  QUOTE_STATUSES,
  SITE_FIELDS,
  type QuoteStatus,
} from "@/lib/quotes/definitions";
import {
  computeTotals,
  lineTotal,
  PRICING_SUGGESTIONS,
  PRICING_UNITS,
  VAT_RATES,
  type PricingLine,
  type QuotePricing,
} from "@/lib/quotes/pricing";
import type { BusinessInfo, LegalInfo } from "@/lib/types";
import {
  deleteQuote,
  markQuoteSent,
  markQuoteViewed,
  saveFollowUp,
  savePricing,
  setQuoteStatus,
} from "@/server/actions/quotes";
import type { QuoteWithRelations } from "@/server/repositories/quotes";
import { useAdminUi } from "./AdminUi";

// ---------------------------------------------------------------------------
// Read-only blocks
// ---------------------------------------------------------------------------

function KeyValues({ fields, group, empty }: { fields: FieldDef[]; group: FieldGroup; empty?: string }) {
  const known = new Set(fields.map((f) => f.name));
  const rows: [string, string][] = [
    ...fields
      .filter((f) => group[f.name] !== undefined && group[f.name] !== "")
      .map((f) => [fieldLabel(f, true), displayValue(group[f.name])] as [string, string]),
    // Values from older forms that no longer have a definition are still shown.
    ...Object.entries(group)
      .filter(([k]) => !known.has(k))
      .map(([k, v]) => [k, displayValue(v)] as [string, string]),
  ];
  if (!rows.length)
    return empty ? (
      <table className="kv">
        <tbody>
          <tr>
            <td className="muted">{empty}</td>
          </tr>
        </tbody>
      </table>
    ) : null;
  return (
    <table className="kv">
      <tbody>
        {rows.map(([k, v]) => (
          <tr key={k}>
            <th>{k}</th>
            <td>{v}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const pick = (group: FieldGroup, keys: string[]): FieldGroup =>
  Object.fromEntries(Object.entries(group).filter(([k]) => keys.includes(k)));

const fileUrl = (storedName: string) => `/api/admin/files/devis/${encodeURIComponent(storedName)}`;

// ---------------------------------------------------------------------------
// Pricing editor
// ---------------------------------------------------------------------------

/** Editable line: numbers are kept as typed text until saved. */
type DraftLine =
  | { kind: "section"; label: string }
  | { kind: "item"; label: string; quantity: string; unit: string; unitPrice: string };

const toDraft = (l: PricingLine): DraftLine =>
  l.kind === "section"
    ? l
    : {
        kind: "item",
        label: l.label,
        quantity: String(l.quantity),
        unit: l.unit,
        unitPrice: l.unitPrice ? String(l.unitPrice) : "",
      };

const toLine = (l: DraftLine): PricingLine =>
  l.kind === "section"
    ? l
    : {
        kind: "item",
        label: l.label,
        quantity: Number(l.quantity.replace(",", ".")) || 0,
        unit: l.unit,
        unitPrice: Number(l.unitPrice.replace(",", ".")) || 0,
      };

const emptyItem = (): DraftLine => ({ kind: "item", label: "", quantity: "1", unit: "u", unitPrice: "" });

interface PricingDraft {
  subject: string;
  lines: DraftLine[];
  discountPercent: string;
  vatRate: string;
  validityDays: string;
  conditions: string;
  date: string;
}

function initialDraft(quote: QuoteWithRelations, legal: LegalInfo): PricingDraft {
  const p = quote.pricing;
  const lines = p?.lines.map(toDraft) ?? [];
  return {
    subject: p?.subject ?? quote.types.map(projectTypeShortLabel).join(", "),
    lines: lines.length ? lines : [emptyItem()],
    discountPercent: String(p?.discountPercent ?? 0),
    vatRate: String(p?.vatRate ?? legal.defaultVatRate),
    validityDays: String(p?.validityDays ?? legal.quoteValidityDays),
    conditions: p?.conditions ?? legal.quoteConditions,
    date: p?.date ?? "",
  };
}

const toPricing = (d: PricingDraft): QuotePricing => ({
  subject: d.subject.trim(),
  lines: d.lines.map(toLine),
  discountPercent: Number(d.discountPercent) || 0,
  vatRate: Number(d.vatRate),
  validityDays: Number(d.validityDays) || 30,
  conditions: d.conditions.trim(),
  date: d.date,
});

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface Props {
  quote: QuoteWithRelations;
  legal: LegalInfo;
  business: BusinessInfo;
}

export function QuoteDetail({ quote, legal, business }: Props) {
  const { run, confirm, toast } = useAdminUi();
  const router = useRouter();
  const c = quote.contact;
  const [draft, setDraft] = useState(() => initialDraft(quote, legal));
  const [notes, setNotes] = useState(quote.notes);
  const [reminder, setReminder] = useState(quote.reminderDate);
  const viewed = useRef(false);

  // Opening a new request moves it to "En cours".
  useEffect(() => {
    if (quote.status === "nouveau" && !viewed.current) {
      viewed.current = true;
      void markQuoteViewed(quote.id);
    }
  }, [quote.id, quote.status]);

  const pricing = toPricing(draft);
  const totals = computeTotals(pricing);
  const setLine = (i: number, patch: Partial<DraftLine>) =>
    setDraft((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? ({ ...l, ...patch } as DraftLine) : l)) }));
  const moveUp = (i: number) =>
    setDraft((d) => {
      const lines = [...d.lines];
      [lines[i - 1], lines[i]] = [lines[i]!, lines[i - 1]!];
      return { ...d, lines };
    });

  const save = () => run(savePricing(quote.id, pricing), "Chiffrage enregistré");

  async function openDocument() {
    if (!pricing.lines.some((l) => l.kind === "item" && (l.label || l.unitPrice)))
      return toast("Ajoutez au moins une ligne chiffrée.", true);
    // Open the window synchronously (Safari blocks pop-ups opened after an await).
    const w = window.open("about:blank", "_blank");
    if (!w) toast("Autorisez les fenêtres pop-up pour afficher le devis.", true);
    const ok = await run(savePricing(quote.id, pricing));
    if (ok === undefined) return w?.close();
    const url = `/admin/devis/${quote.id}/document`;
    if (w && !w.closed) w.location.assign(url);
    else router.push(url);
  }

  async function sendByEmail() {
    if ((await run(savePricing(quote.id, pricing))) === undefined) return;
    const body = [
      `Bonjour ${c.firstName || c.lastName},`,
      "",
      `Suite à votre demande, vous trouverez ci-joint notre devis ${quote.ref}${pricing.subject ? ` (${pricing.subject})` : ""} d'un montant de ${euro(totals.total)} TTC, valable ${pricing.validityDays} jours.`,
      "",
      "Nous restons à votre disposition pour toute question.",
      "",
      "Bien cordialement,",
      "",
      business.name,
      `${business.address}, ${business.city}`,
      business.phone,
    ].join("\n");
    window.location.assign(
      `mailto:${c.email}?subject=${encodeURIComponent(`Votre devis ${quote.ref} — ${business.name}`)}&body=${encodeURIComponent(body)}`,
    );
    if (
      (quote.status === "en-cours" || quote.status === "nouveau") &&
      (await confirm(
        "Passer la demande au statut « Devis envoyé » et prévoir une relance dans 7 jours ?",
        "Oui",
        false,
      ))
    ) {
      await run(markQuoteSent(quote.id, addDays(today(), 7)), "Statut mis à jour");
    }
  }

  async function remove() {
    if (!(await confirm(`Supprimer définitivement la demande ${quote.ref} et ses fichiers ?`))) return;
    if ((await run(deleteQuote(quote.id), "Demande supprimée")) !== undefined) router.push("/admin/devis");
  }

  const siteOnly = Object.fromEntries(
    Object.entries(quote.site).filter(([k]) => k !== ANIMALS_FIELD.name && k !== ANIMAL_COUNT_FIELD.name),
  );

  return (
    <>
      <p>
        <Link href="/admin/devis">← Toutes les demandes</Link>
      </p>
      <div className="head-row">
        <h1>
          {quote.ref}{" "}
          <small>
            {formatDateTime(quote.createdAt)}
            {quote.source ? ` · ${quote.source}` : ""}
          </small>
        </h1>
        <div className="actions">
          <button className="btn btn--ghost" onClick={() => print()}>
            Imprimer la demande
          </button>
          <button className="btn btn--danger-ghost" onClick={remove}>
            Supprimer
          </button>
        </div>
      </div>

      <div className="status-bar">
        {QUOTE_STATUS_IDS.map((k: QuoteStatus) => (
          <button
            key={k}
            className={k === quote.status ? "is-active" : undefined}
            style={{ "--c": QUOTE_STATUS_COLORS[k] } as CSSProperties}
            onClick={() => run(setQuoteStatus(quote.id, k), `Statut : ${QUOTE_STATUSES[k]}`)}
          >
            {QUOTE_STATUSES[k]}
          </button>
        ))}
      </div>

      <div className="detail">
        <div>
          <section className="panel pad">
            <h2>Projet</h2>
            <p className="types">
              {quote.types.map((t) => (
                <span className="chip" key={t}>
                  {projectTypeShortLabel(t)}
                </span>
              ))}
            </p>
            <KeyValues
              fields={[PROFILE_FIELD, ANIMALS_FIELD, ANIMAL_COUNT_FIELD]}
              group={{ profile: c.profile, ...pick(quote.site, [ANIMALS_FIELD.name, ANIMAL_COUNT_FIELD.name]) }}
            />
            {PROJECT_TYPES.filter(
              (t) => quote.types.includes(t.id) && Object.keys(quote.details[t.id] ?? {}).length,
            ).map((t) => (
              <div key={t.id}>
                <h3>{t.shortLabel}</h3>
                <KeyValues fields={t.fields} group={quote.details[t.id] ?? {}} />
              </div>
            ))}
            {quote.projectNotes && (
              <>
                <h3>Précisions du client</h3>
                <p className="pre">{quote.projectNotes}</p>
              </>
            )}
            <h3>Terrain &amp; chantier</h3>
            <KeyValues fields={SITE_FIELDS} group={siteOnly} empty="Non renseigné" />
            {quote.files.length > 0 && (
              <>
                <h3>Fichiers joints</h3>
                <div className="files">
                  {quote.files.map((f) =>
                    f.mimeType.startsWith("image/") ? (
                      <a key={f.id} href={fileUrl(f.storedName)} target="_blank" rel="noopener">
                        <img src={fileUrl(f.storedName)} alt={f.originalName} />
                      </a>
                    ) : (
                      <a key={f.id} className="file" href={fileUrl(f.storedName)} target="_blank" rel="noopener">
                        📄 {f.originalName}
                      </a>
                    ),
                  )}
                </div>
              </>
            )}
          </section>

          <section className="panel pad" id="chiffrage">
            <div className="head-row">
              <h2>Chiffrage</h2>
              <span className="muted small">Prix unitaires HT</span>
            </div>
            <label>
              Objet du devis
              <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </label>
            <datalist id="sugg">
              {PRICING_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <div className="table-wrap">
              <table className="lines">
                <thead>
                  <tr>
                    <th>Désignation</th>
                    <th>Qté</th>
                    <th>Unité</th>
                    <th>PU HT</th>
                    <th>Total HT</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {draft.lines.map((l, i) =>
                    l.kind === "section" ? (
                      <tr className="is-section" key={i}>
                        <td colSpan={5}>
                          <input
                            value={l.label}
                            onChange={(e) => setLine(i, { label: e.target.value })}
                            placeholder="Titre de section (ex. Clôture prairie nord)"
                          />
                        </td>
                        <td>
                          <button
                            className="icon icon--danger"
                            title="Retirer"
                            onClick={() => setDraft({ ...draft, lines: draft.lines.filter((_, j) => j !== i) })}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={i}>
                        <td>
                          <input
                            list="sugg"
                            value={l.label}
                            onChange={(e) => setLine(i, { label: e.target.value })}
                            placeholder="Désignation"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={l.quantity}
                            onChange={(e) => setLine(i, { quantity: e.target.value })}
                          />
                        </td>
                        <td>
                          <select value={l.unit} onChange={(e) => setLine(i, { unit: e.target.value })}>
                            {PRICING_UNITS.map((u) => (
                              <option key={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={l.unitPrice}
                            onChange={(e) => setLine(i, { unitPrice: e.target.value })}
                          />
                        </td>
                        <td className="num">{euro(lineTotal(toLine(l)))}</td>
                        <td className="nowrap">
                          <button className="icon" title="Monter" disabled={i === 0} onClick={() => moveUp(i)}>
                            ↑
                          </button>
                          <button
                            className="icon icon--danger"
                            title="Retirer"
                            onClick={() => setDraft({ ...draft, lines: draft.lines.filter((_, j) => j !== i) })}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
            <div className="actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setDraft({ ...draft, lines: [...draft.lines, emptyItem()] })}
              >
                + Ajouter une ligne
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => setDraft({ ...draft, lines: [...draft.lines, { kind: "section", label: "" }] })}
              >
                + Ajouter un titre de section
              </button>
            </div>
            <div className="totals">
              <div className="grid-3">
                <label>
                  Remise (%)
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={draft.discountPercent}
                    onChange={(e) => setDraft({ ...draft, discountPercent: e.target.value })}
                  />
                </label>
                <label>
                  TVA (%)
                  <select value={draft.vatRate} onChange={(e) => setDraft({ ...draft, vatRate: e.target.value })}>
                    {VAT_RATES.map((t) => (
                      <option key={t} value={t}>
                        {t} %
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Validité (jours)
                  <input
                    type="number"
                    min={1}
                    value={draft.validityDays}
                    onChange={(e) => setDraft({ ...draft, validityDays: e.target.value })}
                  />
                </label>
              </div>
              <dl>
                <dt>Total HT</dt>
                <dd>{euro(totals.subtotal)}</dd>
                {totals.discount > 0 && (
                  <>
                    <dt>Remise</dt>
                    <dd>− {euro(totals.discount)}</dd>
                    <dt>Net HT</dt>
                    <dd>{euro(totals.net)}</dd>
                  </>
                )}
                <dt>TVA</dt>
                <dd>{euro(totals.vat)}</dd>
                <dt className="ttc">Total TTC</dt>
                <dd className="ttc">{euro(totals.total)}</dd>
              </dl>
            </div>
            <label>
              Conditions / mentions
              <textarea
                rows={3}
                value={draft.conditions}
                onChange={(e) => setDraft({ ...draft, conditions: e.target.value })}
              />
            </label>
            <div className="actions">
              <button className="btn" onClick={save}>
                Enregistrer le chiffrage
              </button>
              <button className="btn btn--ghost" onClick={openDocument}>
                Aperçu / PDF du devis
              </button>
              {c.email && (
                <button className="btn btn--ghost" onClick={sendByEmail}>
                  Envoyer par e-mail
                </button>
              )}
            </div>
          </section>
        </div>

        <div>
          <section className="panel pad">
            <h2>Client</h2>
            <p className="client-name">
              {c.firstName} {c.lastName}
            </p>
            {c.organization && <p>{c.organization}</p>}
            <p>
              {c.phone && (
                <>
                  <a className="big-link" href={`tel:${c.phone.replace(/\s/g, "")}`}>
                    📞 {c.phone}
                  </a>
                  <br />
                </>
              )}
              {c.email && <a href={`mailto:${c.email}`}>✉️ {c.email}</a>}
            </p>
            <KeyValues
              fields={CONTACT_FIELDS.filter((f) => f.name === "preference" || f.name === "slot")}
              group={{ preference: c.preference, slot: c.slot }}
            />
          </section>
          <section className="panel pad">
            <h2>Suivi</h2>
            <label>
              Date de relance
              <input type="date" value={reminder} onChange={(e) => setReminder(e.target.value)} />
            </label>
            <div className="chips-row">
              {(
                [
                  ["+2 j", 2],
                  ["+1 sem.", 7],
                  ["+2 sem.", 14],
                  ["+1 mois", 30],
                ] as const
              ).map(([label, n]) => (
                <button
                  key={n}
                  type="button"
                  className="btn btn--ghost btn--xs"
                  onClick={() => setReminder(addDays(today(), n))}
                >
                  {label}
                </button>
              ))}
              <button type="button" className="btn btn--ghost btn--xs" onClick={() => setReminder("")}>
                Aucune
              </button>
            </div>
            <label>
              Notes internes
              <textarea
                rows={7}
                placeholder="Appel, visite, remarques…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <button className="btn" onClick={() => run(saveFollowUp(quote.id, notes, reminder), "Suivi enregistré")}>
              Enregistrer le suivi
            </button>
          </section>
          <section className="panel pad">
            <h2>Historique</h2>
            {quote.history.length ? (
              <ul className="timeline">
                {quote.history.map((h, i) => (
                  <li key={i}>
                    <time>{formatDateTime(h.at)}</time>
                    {h.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">—</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
