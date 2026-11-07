import type { Metadata } from "next";
import Link from "next/link";
import { loadTexts } from "@/server/queries/public";

export const metadata: Metadata = {
  title: { absolute: "Page introuvable · Sellerie Equ'Attitud" },
  robots: { index: false },
};

export default function NotFound() {
  const t = loadTexts();
  return (
    <main>
      <section className="page-title">
        <div className="wrap">
          <h1>{t["notFound.title"]}</h1>
          <p>{t["notFound.text"]}</p>
          <p>
            <Link href="/" className="btn">
              {t["notFound.button"]}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
