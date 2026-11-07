import type { Metadata } from "next";
import { Bars } from "@/components/admin/Bars";
import { euro, formatDateShort, MONTHS_SHORT } from "@/lib/format";
import { projectTypeShortLabel, QUOTE_STATUS_COLORS, QUOTE_STATUS_IDS, QUOTE_STATUSES } from "@/lib/quotes/definitions";
import { requireAdmin } from "@/server/auth/session";
import { getTraffic } from "@/server/repositories/analytics";
import { loadQuotes, quoteStats } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Statistiques" };

const PAGE_LABELS: Record<string, string> = {
  "/": "Accueil",
  "/equitation": "Équitation",
  "/amenagement": "Aménagement",
  "/nouveautes": "Nouveautés",
  "/devis": "Demande de devis",
  "/contact": "Le magasin",
  "/mentions-legales": "Mentions légales",
};

export default async function StatsPage() {
  await requireAdmin();
  const s = quoteStats(loadQuotes());
  const traffic = getTraffic(30);
  const totalVisits = traffic.days.reduce((a, d) => a + d.total, 0);
  const maxPage = Math.max(1, ...traffic.pages.map((p) => p[1]));
  const monthBars = s.byMonth.map(([m, v]) => ({
    label: `${MONTHS_SHORT[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`,
    short: MONTHS_SHORT[Number(m.slice(5)) - 1],
    value: v,
  }));

  return (
    <>
      <h1>Statistiques</h1>
      <div className="stats">
        <div className="stat stat--g">
          <b>{totalVisits}</b>
          <span>visites (30 jours)</span>
        </div>
        <div className="stat stat--y">
          <b>{s.total}</b>
          <span>demandes de devis au total</span>
        </div>
        <div className="stat stat--b">
          <b>{s.conversion === null ? "—" : `${s.conversion} %`}</b>
          <span>devis acceptés (sur les devis tranchés)</span>
        </div>
        <div className="stat stat--p">
          <b>{euro(s.acceptedAmount)}</b>
          <span>montant accepté TTC</span>
        </div>
      </div>
      <div className="dash-grid">
        <section className="panel span-2">
          <header className="panel__head">
            <h2>Visites du site — 30 derniers jours</h2>
          </header>
          <div className="pad">
            <Bars
              data={traffic.days.map((d) => ({ label: formatDateShort(d.day), short: d.day.slice(8), value: d.total }))}
              color="var(--g)"
              labelEvery={3}
            />
          </div>
        </section>
        <section className="panel">
          <header className="panel__head">
            <h2>Pages les plus vues</h2>
          </header>
          <div className="pad">
            {traffic.pages.length ? (
              traffic.pages.map(([p, n]) => (
                <div className="hbar" key={p}>
                  <span>{PAGE_LABELS[p] ?? p}</span>
                  <i style={{ width: `${(n / maxPage) * 100}%` }}></i>
                  <b>{n}</b>
                </div>
              ))
            ) : (
              <p className="muted">Pas encore de visite enregistrée.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <header className="panel__head">
            <h2>Demandes par type de projet</h2>
          </header>
          <div className="pad">
            {s.byType.length ? (
              <Bars data={s.byType.map(([t, v]) => ({ label: projectTypeShortLabel(t), value: v }))} color="var(--b)" />
            ) : (
              <p className="muted">Aucune demande.</p>
            )}
          </div>
        </section>
        <section className="panel">
          <header className="panel__head">
            <h2>Demandes par mois</h2>
          </header>
          <div className="pad">
            <Bars data={monthBars} color="var(--y)" labelEvery={2} />
          </div>
        </section>
        <section className="panel">
          <header className="panel__head">
            <h2>Suivi des devis</h2>
          </header>
          <div className="pad">
            {s.total ? (
              <Bars
                data={QUOTE_STATUS_IDS.map((k) => ({
                  label: QUOTE_STATUSES[k],
                  value: s.byStatus[k] ?? 0,
                  color: QUOTE_STATUS_COLORS[k],
                }))}
              />
            ) : (
              <p className="muted">Aucune demande.</p>
            )}
            <p className="muted small">
              Montant total des devis envoyés : <b>{euro(s.sentAmount)}</b> TTC
            </p>
          </div>
        </section>
      </div>
      <p className="muted small">
        Les visites sont comptées de façon anonyme, sans cookie ni outil externe (les robots sont ignorés).
      </p>
    </>
  );
}
