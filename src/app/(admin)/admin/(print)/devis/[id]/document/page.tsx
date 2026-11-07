import type { Metadata } from "next";
import Link from "next/link";
import { addDays, euro, formatDateShort } from "@/lib/format";
import { computeTotals, hasPricedLines, lineTotal } from "@/lib/quotes/pricing";
import { requireAdmin } from "@/server/auth/session";
import { getTexts } from "@/server/repositories/content";
import { getQuote } from "@/server/repositories/quotes";
import { getSettings } from "@/server/repositories/settings";
import { PrintButton } from "./PrintButton";
import styles from "./document.module.css";

export async function generateMetadata({ params }: PageProps<"/admin/devis/[id]/document">): Promise<Metadata> {
  const quote = getQuote((await params).id);
  return { title: { absolute: quote ? `Devis ${quote.ref}` : "Devis" } };
}

/** Printable A4 quote ("Imprimer / Enregistrer en PDF" from the browser). */
export default async function QuoteDocumentPage({ params }: PageProps<"/admin/devis/[id]/document">) {
  await requireAdmin();
  const quote = getQuote((await params).id);
  const fail = (text: string) => (
    <p className={styles.message}>
      {text} <Link href="/admin/devis">Retour à la console</Link>
    </p>
  );
  if (!quote) return fail("Devis introuvable.");
  if (!hasPricedLines(quote.pricing))
    return fail("Ce devis n'a pas encore de chiffrage. Ajoutez des lignes puis enregistrez.");

  const { business: s, legal } = getSettings();
  const logo = getTexts()["global.logo"];
  const p = quote.pricing;
  const t = computeTotals(p);
  const c = quote.contact;
  const date = p.date || new Date().toISOString().slice(0, 10);
  const company = legal.companyName || s.name;
  const site = quote.site;
  const qty = (n: number) => String(n).replace(".", ",");

  return (
    <div className={styles.page}>
      <PrintButton className={styles.noprint} />
      <div className={styles.tetra}>
        <i></i>
        <i></i>
        <i></i>
        <i></i>
      </div>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={logo} alt="" />
          <div>
            <b>{company}</b>
            {s.address}
            <br />
            {s.city}
            <br />
            {s.phone} · {s.email}
          </div>
        </div>
        <div className={styles.doc}>
          <h1>Devis</h1>
          <p>
            N° <b>{quote.ref}</b>
            <br />
            Date : {formatDateShort(date)}
            <br />
            Valable jusqu&apos;au {formatDateShort(addDays(date, p.validityDays || 30))}
          </p>
        </div>
      </header>
      <div className={styles.boxes}>
        <div className={styles.box}>
          <h3>Client</h3>
          <b>
            {c.firstName} {c.lastName}
          </b>
          {c.organization && (
            <>
              <br />
              {c.organization}
            </>
          )}
          {c.phone && (
            <>
              <br />
              {c.phone}
            </>
          )}
          {c.email && (
            <>
              <br />
              {c.email}
            </>
          )}
        </div>
        <div className={styles.box}>
          <h3>Chantier</h3>
          {site.address && (
            <>
              {String(site.address)}
              <br />
            </>
          )}
          {String(site.postalCode ?? "")} {String(site.city ?? "")}
          {p.subject && (
            <>
              <br />
              <br />
              <b>Objet :</b> {p.subject}
            </>
          )}
        </div>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Désignation</th>
            <th className={styles.r}>Qté</th>
            <th>Unité</th>
            <th className={styles.r}>PU HT</th>
            <th className={styles.r}>Total HT</th>
          </tr>
        </thead>
        <tbody>
          {p.lines.map((l, i) =>
            l.kind === "section" ? (
              <tr className={styles.sec} key={i}>
                <td colSpan={5}>{l.label}</td>
              </tr>
            ) : (
              <tr key={i}>
                <td>{l.label}</td>
                <td className={styles.r}>{qty(l.quantity)}</td>
                <td>{l.unit}</td>
                <td className={styles.r}>{euro(l.unitPrice)}</td>
                <td className={styles.r}>{euro(lineTotal(l))}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
      <div className={styles.tot}>
        <div>
          <span>Total HT</span>
          <span>{euro(t.subtotal)}</span>
        </div>
        {t.discount > 0 && (
          <>
            <div>
              <span>Remise {qty(p.discountPercent)} %</span>
              <span>− {euro(t.discount)}</span>
            </div>
            <div>
              <span>Net HT</span>
              <span>{euro(t.net)}</span>
            </div>
          </>
        )}
        <div>
          <span>TVA {qty(p.vatRate)} %</span>
          <span>{euro(t.vat)}</span>
        </div>
        <div className={styles.ttc}>
          <span>Total TTC</span>
          <span>{euro(t.total)}</span>
        </div>
      </div>
      {p.conditions && <div className={styles.cond}>{p.conditions}</div>}
      <div className={styles.sign}>
        <div>
          Date et signature du client
          <br />
          précédées de la mention « Bon pour accord »
        </div>
        <div>Cachet de l&apos;entreprise</div>
      </div>
      <footer className={styles.footer}>
        {[
          company,
          legal.legalForm,
          legal.siret && `SIRET ${legal.siret}`,
          legal.vatNumber && `TVA ${legal.vatNumber}`,
          `${s.address}, ${s.city}`,
        ]
          .filter(Boolean)
          .join(" · ")}
      </footer>
    </div>
  );
}
