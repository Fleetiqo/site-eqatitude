import { Fragment, type CSSProperties } from "react";
import Link from "next/link";
import { formatDateLong, parseFrenchNumber } from "@/lib/format";
import { UNIVERSES, type CardItem, type GoogleRating, type NewsItem, type Review, type UsedItem } from "@/lib/types";

/** Lazy-loaded image with the item title as alternative text. */
const Img = ({ src, alt }: { src: string; alt: string }) => (src ? <img src={src} alt={alt} loading="lazy" /> : null);

const withBreaks = (text: string) =>
  text.split("\n").map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ));

export function DepartmentCards({ items }: { items: CardItem[] }) {
  return items.map((r) => (
    <article className="card" key={r.id}>
      {r.image && (
        <div className="card__img">
          <Img src={r.image} alt={r.title} />
        </div>
      )}
      <div className="card__body">
        <h3>{r.title}</h3>
        <p>{r.text}</p>
      </div>
    </article>
  ));
}

/** Compact offer cards on the home page, linking to the fitting page. */
export function FittingCards({ items }: { items: CardItem[] }) {
  return items.map((a) => (
    <Link className="card card--link" href="/amenagement" key={a.id}>
      {a.image && (
        <div className="card__img">
          <Img src={a.image} alt={a.title} />
        </div>
      )}
      <div className="card__body">
        <h3>{a.title}</h3>
        <p>{a.text}</p>
      </div>
    </Link>
  ));
}

/** Alternating image/text rows on the fitting page. */
export function OfferRows({ items, linkLabel }: { items: CardItem[]; linkLabel: string }) {
  return items.map((a, i) => (
    <article className={i % 2 ? "offer offer--rev" : "offer"} key={a.id}>
      <div className="offer__img">
        <Img src={a.image} alt={a.title} />
      </div>
      <div className="offer__body">
        <h2>{a.title}</h2>
        <p>{a.text}</p>
        <Link href="/devis" className="more">
          {linkLabel}
        </Link>
      </div>
    </article>
  ));
}

export function ServiceList({ items }: { items: CardItem[] }) {
  return items.map((s) => (
    <article className="service" key={s.id}>
      {s.image ? (
        <div className="service__img">
          <Img src={s.image} alt={s.title} />
        </div>
      ) : (
        <div className="service__img service__img--empty"></div>
      )}
      <div>
        <h3>{s.title}</h3>
        <p>{s.text}</p>
      </div>
    </article>
  ));
}

export function NewsArticle({ item, hidden }: { item: NewsItem; hidden?: boolean }) {
  return (
    <article className="news-item" data-u={item.universe} hidden={hidden}>
      {item.image && (
        <div className="news-item__img">
          <Img src={item.image} alt={item.title} />
        </div>
      )}
      <div className="news-item__body">
        <p className="news-item__meta">
          <span className={`tag tag--${item.universe}`}>{UNIVERSES[item.universe]}</span>{" "}
          {item.publishDate ? formatDateLong(item.publishDate) : ""}
        </p>
        <h3>{item.title}</h3>
        <p>{withBreaks(item.text)}</p>
      </div>
    </article>
  );
}

export const BrandList = ({ brands }: { brands: string[] }) => (
  <ul className="brands">
    {brands.map((b, i) => (
      <li key={i}>{b}</li>
    ))}
  </ul>
);

export function UsedItemCards({ items }: { items: UsedItem[] }) {
  return items.map((o) => (
    <article className="card card--occasion" key={o.id}>
      <div className="card__img">
        <Img src={o.image} alt={o.title} />
        {o.status === "reserve" && <span className="badge-res">Réservé</span>}
      </div>
      <div className="card__body">
        <h3>{o.title}</h3>
        <p>{[o.brand, o.size, o.condition].filter(Boolean).join(" · ")}</p>
        {o.price && <p className="card__price">{o.price} €</p>}
      </div>
    </article>
  ));
}

export function ReviewList({ items }: { items: Review[] }) {
  return items.map((a) => (
    <figure className="avis-item" key={a.id}>
      {a.rating ? (
        <div className="avis-item__stars" aria-label={`${a.rating} sur 5`}>
          {"★".repeat(a.rating)}
          {"☆".repeat(5 - a.rating)}
        </div>
      ) : null}
      <blockquote>{a.text}</blockquote>
      <figcaption>
        {a.author}
        {a.location ? ` · ${a.location}` : ""}
      </figcaption>
    </figure>
  ));
}

export const isGoogleRatingVisible = (g: GoogleRating): boolean => g.enabled && !!g.note && !!g.url;

export function GoogleRatingBox({ rating }: { rating: GoogleRating }) {
  const visible = isGoogleRatingVisible(rating);
  const note = parseFrenchNumber(rating.note);
  return (
    <div className="google-rating" id="google-rating" hidden={!visible}>
      <div className="google-rating__note">
        <b>{visible ? rating.note : ""}</b>
        <span>/ 5</span>
      </div>
      <div>
        <div className="google-rating__stars" aria-hidden="true">
          {visible &&
            [1, 2, 3, 4, 5].map((i) => (
              <i key={i} style={{ "--f": `${Math.max(0, Math.min(1, note - i + 1)) * 100}%` } as CSSProperties}></i>
            ))}
        </div>
        <p>
          <span>{visible ? rating.reviewCount : ""}</span> avis clients sur Google
        </p>
        <p className="google-rating__links">
          <a className="more" href={visible ? rating.url : undefined} target="_blank" rel="noopener">
            Lire les avis sur Google
          </a>
        </p>
      </div>
    </div>
  );
}
