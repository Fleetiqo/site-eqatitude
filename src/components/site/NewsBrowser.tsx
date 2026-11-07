"use client";

import Link from "next/link";
import { useState } from "react";
import { UNIVERSES, type NewsItem, type Universe } from "@/lib/types";
import { NewsArticle } from "./Lists";

const TABS: { id: "" | Universe; label: string }[] = [
  { id: "", label: "Tout" },
  { id: "equitation", label: UNIVERSES.equitation },
  { id: "amenagement", label: UNIVERSES.amenagement },
];

/** News page: universe tabs (kept in the URL as ?u=…) and the filtered list. */
export function NewsBrowser({
  title,
  items,
  emptyText,
  initialUniverse,
}: {
  title: string;
  items: NewsItem[];
  emptyText: string;
  initialUniverse: "" | Universe;
}) {
  const [universe, setUniverse] = useState(initialUniverse);
  const visible = items.filter((n) => !universe || n.universe === universe).length;

  const select = (u: "" | Universe) => {
    setUniverse(u);
    history.replaceState(null, "", u ? `?u=${u}` : location.pathname);
  };

  return (
    <>
      <section className="page-title">
        <div className="wrap">
          <p className="crumb">
            <Link href="/">Accueil</Link> / {title}
          </p>
          <h1>{title}</h1>
          <div className="tabs" id="news-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                data-u={t.id}
                className={universe === t.id ? "is-active" : undefined}
                aria-selected={universe === t.id}
                onClick={() => select(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </section>
      <section className="block block--tight">
        <div className="wrap">
          <div className="news news--list">
            {items.map((n) => (
              <NewsArticle key={n.id} item={n} hidden={!!universe && n.universe !== universe} />
            ))}
          </div>
          <p className="empty-note" id="news-empty" hidden={visible > 0}>
            {emptyText}
          </p>
        </div>
      </section>
    </>
  );
}
