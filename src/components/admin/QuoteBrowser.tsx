"use client";

import { useState } from "react";
import { euro } from "@/lib/format";
import { CLOSED_STATUSES, PROJECT_TYPES, QUOTE_STATUSES, type QuoteStatus } from "@/lib/quotes/definitions";
import { QuoteTable, type QuoteRow } from "./QuoteTable";

interface Filters {
  status: string;
  type: string;
  q: string;
}

export interface QuoteListParams {
  filtre?: string;
  statut?: string;
  type?: string;
  q?: string;
}

/** Filters live in the URL: shareable, and kept when coming back from a quote. */
function fromParams(p: QuoteListParams): Filters {
  const status = p.filtre === "relances" ? "relances" : p.statut === "tous" ? "" : (p.statut ?? "actifs");
  return { status, type: p.type ?? "", q: p.q ?? "" };
}

function toQuery(f: Filters): string {
  const p = new URLSearchParams();
  if (f.status === "relances") p.set("filtre", "relances");
  else if (f.status === "") p.set("statut", "tous");
  else if (f.status !== "actifs") p.set("statut", f.status);
  if (f.type) p.set("type", f.type);
  if (f.q) p.set("q", f.q);
  const qs = p.toString();
  return qs ? `?${qs}` : location.pathname;
}

/** Quote list with status, project type and free-text filters. */
export function QuoteBrowser({ rows, params }: { rows: QuoteRow[]; params: QuoteListParams }) {
  const [f, setF] = useState<Filters>(() => fromParams(params));

  const update = (patch: Partial<Filters>) => {
    const next = { ...f, ...patch };
    setF(next);
    history.replaceState(null, "", toQuery(next));
  };

  const q = f.q.trim().toLowerCase();
  const visible = rows.filter((d) => {
    if (f.status === "actifs" && CLOSED_STATUSES.includes(d.status)) return false;
    if (f.status === "relances" && !d.due) return false;
    if (f.status && f.status !== "actifs" && f.status !== "relances" && d.status !== f.status) return false;
    if (f.type && !d.types.includes(f.type)) return false;
    if (q && !`${d.ref} ${d.name} ${d.organization} ${d.phone} ${d.email} ${d.city}`.toLowerCase().includes(q))
      return false;
    return true;
  });
  const sum = visible.reduce((s, d) => s + (d.total ?? 0), 0);

  return (
    <>
      <div className="filters">
        <select value={f.status} onChange={(e) => update({ status: e.target.value })} aria-label="Statut">
          <option value="actifs">En cours de traitement</option>
          <option value="relances">À relancer</option>
          <option value="">Toutes</option>
          {(Object.entries(QUOTE_STATUSES) as [QuoteStatus, string][]).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select value={f.type} onChange={(e) => update({ type: e.target.value })} aria-label="Type de projet">
          <option value="">Tous les projets</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.shortLabel}
            </option>
          ))}
        </select>
        <input
          type="search"
          value={f.q}
          onChange={(e) => update({ q: e.target.value })}
          placeholder="Rechercher (nom, commune, réf., téléphone)"
        />
      </div>
      <p className="muted small">
        {visible.length} demande(s){sum ? ` · ${euro(sum)} TTC chiffrés` : ""}
      </p>
      <section className="panel">
        {visible.length ? <QuoteTable rows={visible} /> : <p className="muted pad">Aucune demande.</p>}
      </section>
    </>
  );
}
