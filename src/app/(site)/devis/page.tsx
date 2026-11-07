import Link from "next/link";
import { AddressLines, PhoneLink } from "@/components/site/ContactInfo";
import { QuoteForm } from "@/components/site/QuoteForm";
import { renderInline } from "@/lib/rich-text";
import { pageMetadata } from "@/server/queries/metadata";
import { loadRichTextContext, loadSettings, loadTexts, trackPageView } from "@/server/queries/public";

export const generateMetadata = () => pageMetadata("devis", "/devis");

export default async function QuotePage({ searchParams }: PageProps<"/devis">) {
  await trackPageView("/devis");
  const { type } = await searchParams;
  const t = loadTexts();
  const { business } = loadSettings();

  return (
    <main>
      <section className="page-title page-title--green">
        <div className="wrap">
          <p className="crumb">
            <Link href="/">Accueil</Link> / <Link href="/amenagement">Aménagement</Link> / {t["devis.title"]}
          </p>
          <h1>{t["devis.title"]}</h1>
          <p>{t["devis.intro"]}</p>
        </div>
      </section>

      <section className="block block--tight">
        <QuoteForm
          initialType={typeof type === "string" ? type : undefined}
          phone={business.phone}
          doneTitle={t["devis.done.title"]}
          doneText={renderInline(t["devis.done.text"], loadRichTextContext())}
          aside={
            <aside className="devis__aside">
              <h3>{t["devis.aside.title"]}</h3>
              <p>{t["devis.aside.text"]}</p>
              <p>
                <PhoneLink business={business} className="visit__phone" />
              </p>
              <p className="small">
                <AddressLines business={business} />
              </p>
            </aside>
          }
        />
      </section>
    </main>
  );
}
