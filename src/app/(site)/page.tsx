import Link from "next/link";
import { AddressLines, MapEmbed, PhoneLink } from "@/components/site/ContactInfo";
import { ClosuresList, HoursTable } from "@/components/site/Hours";
import {
  DepartmentCards,
  FittingCards,
  GoogleRatingBox,
  isGoogleRatingVisible,
  NewsArticle,
  ReviewList,
  ServiceList,
} from "@/components/site/Lists";
import { StoreJsonLd } from "@/components/site/StoreJsonLd";
import { pageMetadata } from "@/server/queries/metadata";
import {
  loadClosures,
  loadDepartments,
  loadFittingOffers,
  loadHours,
  loadNews,
  loadReviews,
  loadServices,
  loadSettings,
  loadTexts,
  trackPageView,
} from "@/server/queries/public";

export const generateMetadata = () => pageMetadata("home", "/");

export default async function HomePage() {
  await trackPageView("/");
  const t = loadTexts();
  const settings = loadSettings();
  const { business, google } = settings;
  const reviews = loadReviews();
  const showReviews = isGoogleRatingVisible(google) || reviews.length > 0;

  return (
    <>
      <StoreJsonLd settings={settings} />
      <main>
        <section className="split" aria-label="Nos deux métiers">
          <Link className="split__half split__half--equi" href="/equitation">
            <img src={t["home.equitation.image"]} alt="" />
            <div className="split__content">
              <span className="split__kicker">{t["home.equitation.kicker"]}</span>
              <h2>{t["home.equitation.title"]}</h2>
              <p>{t["home.equitation.text"]}</p>
              <span className="split__link">{t["home.equitation.link"]}</span>
            </div>
          </Link>
          <Link className="split__half split__half--amen" href="/amenagement">
            <img src={t["home.amenagement.image"]} alt="" />
            <div className="split__content">
              <span className="split__kicker">{t["home.amenagement.kicker"]}</span>
              <h2>{t["home.amenagement.title"]}</h2>
              <p>{t["home.amenagement.text"]}</p>
              <span className="split__link">{t["home.amenagement.link"]}</span>
            </div>
          </Link>
        </section>

        <section className="intro">
          <div className="wrap intro__grid">
            <h1>{t["home.intro.title"]}</h1>
            <div>
              <p className="intro__text">{t["home.intro.text"]}</p>
              <ul className="intro__points">
                {t["home.intro.points"]
                  .split("\n")
                  .map((p) => p.trim())
                  .filter(Boolean)
                  .map((p) => (
                    <li key={p}>{p}</li>
                  ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <header className="block__head">
              <h2>{t["home.shop.title"]}</h2>
              <Link href="/equitation" className="more">
                {t["home.shop.link"]}
              </Link>
            </header>
            <div className="cards cards--4">
              <DepartmentCards items={loadDepartments()} />
            </div>
          </div>
        </section>

        <section className="block block--green">
          <div className="wrap">
            <header className="block__head">
              <h2>{t["home.fitting.title"]}</h2>
              <Link href="/amenagement" className="more">
                {t["home.fitting.link"]}
              </Link>
            </header>
            <div className="cards cards--3">
              <FittingCards items={loadFittingOffers().slice(0, 6)} />
            </div>
            <div className="cta-band">
              <div>
                <h3>{t["home.cta.title"]}</h3>
                <p>{t["home.cta.text"]}</p>
              </div>
              <Link href="/devis" className="btn btn--light">
                {t["home.cta.button"]}
              </Link>
            </div>
          </div>
        </section>

        <section className="block">
          <div className="wrap">
            <header className="block__head">
              <h2>{t["home.services.title"]}</h2>
            </header>
            <div className="services">
              <ServiceList items={loadServices()} />
            </div>
          </div>
        </section>

        <section className="block block--sand">
          <div className="wrap">
            <header className="block__head">
              <h2>{t["home.news.title"]}</h2>
              <Link href="/nouveautes" className="more">
                {t["home.news.link"]}
              </Link>
            </header>
            <div className="news">
              {loadNews()
                .slice(0, 3)
                .map((n) => (
                  <NewsArticle key={n.id} item={n} />
                ))}
            </div>
          </div>
        </section>

        <section className="block block--sand" id="avis-section" hidden={!showReviews}>
          <div className="wrap">
            <header className="block__head">
              <h2>{t["home.reviews.title"]}</h2>
            </header>
            <GoogleRatingBox rating={google} />
            <div className="avis">
              <ReviewList items={reviews} />
            </div>
          </div>
        </section>

        <section className="block">
          <div className="wrap visit">
            <div>
              <h2>{t["home.visit.title"]}</h2>
              <p className="visit__addr">
                <AddressLines business={business} />
              </p>
              <p>
                <PhoneLink business={business} className="visit__phone" />
              </p>
              <HoursTable hours={loadHours()} />
              <ClosuresList closures={loadClosures()} />
              <p>
                <Link href="/contact" className="btn">
                  {t["home.visit.button"]}
                </Link>
              </p>
            </div>
            <MapEmbed query={business.mapQuery} />
          </div>
        </section>
      </main>
    </>
  );
}
