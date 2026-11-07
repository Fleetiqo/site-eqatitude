"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const SELECTOR =
  ".block__head, .card, .service, .news-item, .offer, .steps li, .intro__grid, .lead-grid, .visit > *, .cta-band";

/** Gentle fade-in of blocks below the fold, as on the original site. Respects reduced motion via CSS. */
export function RevealOnScroll() {
  const pathname = usePathname();
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }),
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(SELECTOR).forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight || el.classList.contains("is-in")) return;
      el.classList.add("reveal");
      io.observe(el);
    });
    return () => io.disconnect();
  }, [pathname]);
  return null;
}
