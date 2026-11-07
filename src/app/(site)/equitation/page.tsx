import Link from "next/link";
import { Gallery } from "@/components/site/Gallery";
import { BrandList, DepartmentCards, ServiceList, UsedItemCards } from "@/components/site/Lists";
import { renderInline } from "@/lib/rich-text";
import { pageMetadata } from "@/server/queries/metadata";
import {
  loadBrands,
  loadDepartments,
  loadGallery,
  loadRichTextContext,
  loadServices,
  loadTexts,
  loadUsedItems,
  trackPageView,
} from "@/server/queries/public";

export const generateMetadata = () => pageMetadata("equitation", "/equitation");

export default async function EquitationPage() {
  await trackPageView("/equitation");
  const t = loadTexts();
  const usedItems = loadUsedItems();

  return (
    <main>
      <section className="page-hero">
        <img src={t["equitation.hero.image"]} alt="" />
        <div className="wrap page-hero__content">
          <p className="crumb">
            <Link href="/">Accueil</Link> / {t["nav.equitation"]}
          </p>
          <h1>{t["equitation.hero.title"]}</h1>
        </div>
      </section>

      <section className="block">
        <div className="wrap lead-grid">
          <p className="lead">{t["equitation.intro"]}</p>
          <div className="lead-aside">
            <p>{renderInline(t["equitation.aside"], loadRichTextContext())}</p>
          </div>
        </div>
      </section>

      <section className="block block--flush">
        <div className="wrap">
          <header className="block__head">
            <h2>{t["equitation.departments.title"]}</h2>
          </header>
          <div className="cards cards--4">
            <DepartmentCards items={loadDepartments()} />
          </div>
        </div>
      </section>

      <section className="block" data-hide-empty="occasions" hidden={!usedItems.length}>
        <div className="wrap">
          <header className="block__head">
            <h2>{t["equitation.used.title"]}</h2>
            <p className="block__sub">{t["equitation.used.subtitle"]}</p>
          </header>
          <div className="cards cards--4">
            <UsedItemCards items={usedItems} />
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <header className="block__head">
            <h2>{t["equitation.brands.title"]}</h2>
          </header>
          <BrandList brands={loadBrands()} />
        </div>
      </section>

      <section className="block block--sand">
        <div className="wrap">
          <header className="block__head">
            <h2>{t["equitation.services.title"]}</h2>
          </header>
          <div className="services">
            <ServiceList items={loadServices()} />
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <header className="block__head">
            <h2>{t["equitation.gallery.title"]}</h2>
            <Link href="/nouveautes?u=equitation" className="more">
              {t["equitation.gallery.link"]}
            </Link>
          </header>
          <Gallery photos={loadGallery("equitation")} />
        </div>
      </section>
    </main>
  );
}
