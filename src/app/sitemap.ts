import type { MetadataRoute } from "next";
import { env } from "@/server/env";

/** Read SITE_URL at runtime, not at build time. */
export const dynamic = "force-dynamic";

const PAGES = ["/", "/equitation", "/amenagement", "/nouveautes", "/devis", "/contact", "/mentions-legales"];

/** Requires SITE_URL (absolute URLs are mandatory in a sitemap). */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!env.siteUrl) return [];
  return PAGES.map((path) => ({
    url: `${env.siteUrl}${path}`,
    changeFrequency: path === "/nouveautes" ? "weekly" : "monthly",
  }));
}
