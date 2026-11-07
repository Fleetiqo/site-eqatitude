import Link from "next/link";
import { Gallery } from "@/components/site/Gallery";
import { OfferRows } from "@/components/site/Lists";
import type { BlockKey } from "@/content/blocks";
import { renderInline } from "@/lib/rich-text";
import { pageMetadata } from "@/server/queries/metadata";
import { loadFittingOffers, loadGallery, loadRichTextContext, loadTexts, trackPageView } from "@/server/queries/public";

export const generateMetadata = () => pageMetadata("amenagement", "/amenagement");

const STEPS = [1, 2, 3, 4] as const;

export default async function AmenagementPage() {
  await trackPageView("/amenagement");
  const t = loadTexts();

  return (
    <main>
      <section className="page-hero page-hero--green">
        <img src={t["amenagement.hero.image"]} alt="" />
        <div className="wrap page-hero__content">
          <p className="crumb">
            <Link href="/">Accueil</Link> / {t["nav.amenagement"]}
          </p>
          <h1>{t["amenagement.hero.title"]}</h1>
          <Link href="/devis" className="btn btn--light">
            {t["amenagement.hero.button"]}
          </Link>
        </div>
      </section>

      <section className="block">
        <div className="wrap lead-grid">
          <p className="lead">{t["amenagement.intro"]}</p>
          <div className="lead-aside lead-aside--green">
            <p>{renderInline(t["amenagement.aside"], loadRichTextContext())}</p>
            <Link href="/devis" className="btn">
              {t["amenagement.aside.button"]}
            </Link>
          </div>
        </div>
      </section>

      <section className="block block--flush">
        <div className="wrap">
          <div className="offers">
            <OfferRows items={loadFittingOffers()} linkLabel={t["amenagement.offers.link"]} />
          </div>
        </div>
      </section>

      <section className="block block--green">
        <div className="wrap">
          <header className="block__head">
            <h2>{t["amenagement.steps.title"]}</h2>
          </header>
          <ol className="steps">
            {STEPS.map((n) => (
              <li key={n}>
                <strong>{t[`amenagement.step${n}.title` as BlockKey]}</strong>
                <span>{t[`amenagement.step${n}.text` as BlockKey]}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <header className="block__head">
            <h2>{t["amenagement.gallery.title"]}</h2>
            <Link href="/nouveautes?u=amenagement" className="more">
              {t["amenagement.gallery.link"]}
            </Link>
          </header>
          <Gallery photos={loadGallery("amenagement")} />
        </div>
      </section>

      <section className="block block--sand">
        <div className="wrap cta-band cta-band--plain">
          <div>
            <h3>{t["amenagement.cta.title"]}</h3>
            <p>{t["amenagement.cta.text"]}</p>
          </div>
          <Link href="/devis" className="btn">
            {t["amenagement.cta.button"]}
          </Link>
        </div>
      </section>
    </main>
  );
}
