import type { Metadata } from "next";
import Link from "next/link";
import { QuoteBrowser } from "@/components/admin/QuoteBrowser";
import { requireAdmin } from "@/server/auth/session";
import { loadQuotes, toQuoteRow } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Demandes de devis" };

export default async function QuotesPage({ searchParams }: PageProps<"/admin/devis">) {
  await requireAdmin();
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
  const params = { filtre: one(sp.filtre), statut: one(sp.statut), type: one(sp.type), q: one(sp.q) };
  return (
    <>
      <div className="head-row">
        <h1>Demandes de devis</h1>
        <div className="actions">
          <a className="btn btn--ghost" href="/api/admin/export/devis" download>
            Exporter (Excel)
          </a>
          <Link className="btn" href="/admin/devis/nouveau">
            + Nouvelle demande
          </Link>
        </div>
      </div>
      {/* Re-apply the URL filters on navigation (sidebar links, global search). Typing only updates the URL in place. */}
      <QuoteBrowser key={JSON.stringify(params)} rows={loadQuotes().map(toQuoteRow)} params={params} />
    </>
  );
}
