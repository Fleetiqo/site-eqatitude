"use client";

import { useCallback, useEffect, useState } from "react";
import type { GalleryPhoto } from "@/lib/types";

/** Photo grid with a keyboard-accessible lightbox (Escape, ←, →). */
export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const count = photos.length;
  const show = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const close = useCallback(() => setIndex(null), []);

  useEffect(() => {
    if (index === null) return;
    document.body.classList.add("no-scroll");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(index - 1);
      if (e.key === "ArrowRight") show(index + 1);
    };
    addEventListener("keydown", onKey);
    return () => {
      removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [index, show, close]);

  const current = index === null ? null : photos[index];

  return (
    <>
      <div className="gallery">
        {photos.map((g, i) => (
          <button
            key={g.id}
            className="gallery__item"
            aria-label={`Agrandir${g.caption ? ` : ${g.caption}` : ""}`}
            onClick={() => show(i)}
          >
            <img src={g.src} alt={g.caption} loading="lazy" />
            {g.caption && <span>{g.caption}</span>}
          </button>
        ))}
      </div>
      {current && (
        <div className="lightbox" onClick={(e) => e.target === e.currentTarget && close()}>
          <button className="lightbox__close" aria-label="Fermer" onClick={close}>
            ×
          </button>
          <button className="lightbox__prev" aria-label="Précédente" onClick={() => show(index! - 1)}>
            ‹
          </button>
          <figure>
            <img src={current.src} alt={current.caption} />
            <figcaption>{current.caption}</figcaption>
          </figure>
          <button className="lightbox__next" aria-label="Suivante" onClick={() => show(index! + 1)}>
            ›
          </button>
        </div>
      )}
    </>
  );
}
