import Link from "next/link";
import { Bars } from "@/components/admin/Bars";
import { ActivityList } from "@/components/admin/parts";
import { QuoteTable } from "@/components/admin/QuoteTable";
import { MONTHS_SHORT, TIME_ZONE } from "@/lib/format";
import { requireAdmin } from "@/server/auth/session";
import { listActivity } from "@/server/repositories/activity";
import { getTraffic } from "@/server/repositories/analytics";
import { isMailConfigured } from "@/server/services/mailer";
import { isFollowUpDue, loadCounters, loadQuotes, quoteStats, toQuoteRow } from "@/server/queries/admin";

export default async function DashboardPage() {
  await requireAdmin();
  const quotes = loadQuotes();
  const counters = loadCounters();
  const stats = quoteStats(quotes);
  const visits7 = getTraffic(7).days.reduce((s, d) => s + d.total, 0);
  const due = quotes.filter((q) => isFollowUpDue(q));
  const now = new Date();
  const hour = Number(
    new Intl.DateTimeFormat("fr-FR", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(now),
  );

  return (
    <>
      <div className="head-row">
        <h1>{hour < 18 ? "Bonjour" : "Bonsoir"} 👋</h1>
        <span className="muted">
          {now.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: TIME_ZONE,
          })}
        </span>
      </div>
      <div className="stats">
        <Link className="stat stat--y" href="/admin/devis">
          <b>{counters.newQuotes}</b>
          <span>nouvelle(s) demande(s)</span>
        </Link>
        <Link className="stat stat--p" href="/admin/devis?filtre=relances">
          <b>{counters.dueFollowUps}</b>
          <span>devis à relancer</span>
        </Link>
        <Link className="stat stat--b" href="/admin/messages">
          <b>{counters.unreadMessages}</b>
          <span>message(s) non lu(s)</span>
        </Link>
        <Link className="stat stat--g" href="/admin/statistiques">
          <b>{visits7}</b>
          <span>visites sur 7 jours</span>
        </Link>
      </div>
      <div className="quick">
        <Link className="btn" href="/admin/devis/nouveau">
          + Nouvelle demande de devis
        </Link>
        <Link className="btn btn--ghost" href="/admin/contenu/nouveautes?nouveau=1">
          Publier une nouveauté
        </Link>
        <Link className="btn btn--ghost" href="/admin/contenu/occasions?nouveau=1">
          Ajouter une occasion
        </Link>
        <Link className="btn btn--ghost" href="/admin/pages">
          Modifier les textes et photos
        </Link>
        <Link className="btn btn--ghost" href="/admin/contenu/fermetures?nouveau=1">
          Fermeture exceptionnelle
        </Link>
      </div>
      {!isMailConfigured() && (
        <div className="notice">
          Les notifications par e-mail ne sont pas configurées : les demandes arrivent uniquement ici (réglages SMTP du
          fichier <code>.env</code>).
        </div>
      )}
      <div className="dash-grid">
        <section className="panel">
          <header className="panel__head">
            <h2>À relancer aujourd&apos;hui</h2>
            <Link href="/admin/devis?filtre=relances">Tout voir</Link>
          </header>
          {due.length ? (
            <QuoteTable rows={due.slice(0, 6).map(toQuoteRow)} />
          ) : (
            <p className="muted pad">
              Aucune relance prévue. Ajoutez une date de relance dans une fiche devis pour la voir ici.
            </p>
          )}
        </section>
        <section className="panel">
          <header className="panel__head">
            <h2>Demandes de devis — 12 mois</h2>
            <Link href="/admin/statistiques">Statistiques</Link>
          </header>
          <div className="pad">
            <Bars
              data={stats.byMonth.map(([m, v]) => ({
                label: `${MONTHS_SHORT[Number(m.slice(5)) - 1]} ${m.slice(0, 4)}`,
                short: MONTHS_SHORT[Number(m.slice(5)) - 1],
                value: v,
              }))}
              color="var(--y)"
              labelEvery={2}
            />
          </div>
        </section>
        <section className="panel span-2">
          <header className="panel__head">
            <h2>Dernières demandes</h2>
            <Link href="/admin/devis?statut=tous">Toutes les demandes</Link>
          </header>
          {quotes.length ? (
            <QuoteTable rows={quotes.slice(0, 6).map(toQuoteRow)} />
          ) : (
            <p className="muted pad">Aucune demande pour le moment.</p>
          )}
        </section>
        <section className="panel span-2">
          <header className="panel__head">
            <h2>Activité récente</h2>
            <Link href="/admin/journal">Journal complet</Link>
          </header>
          <ActivityList entries={listActivity(8)} />
        </section>
      </div>
    </>
  );
}
