import type { Metadata } from "next";
import type { BlockKey } from "@/content/blocks";
import { loadTexts } from "@/server/queries/public";

type SeoPage = "home" | "equitation" | "amenagement" | "nouveautes" | "devis" | "contact" | "legal";

/** Title and description of a public page, editable in "Pages & visuels > Référencement". */
export function pageMetadata(page: SeoPage, path: string): Metadata {
  const texts = loadTexts();
  const title = texts[`seo.${page}.title` as BlockKey];
  const description = texts[`seo.${page}.description` as BlockKey];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { title, description, type: "website", locale: "fr_FR" },
  };
}
