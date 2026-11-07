import type { MetadataRoute } from "next";
import { env } from "@/server/env";

/** Read SITE_URL at runtime, not at build time. */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    sitemap: env.siteUrl ? `${env.siteUrl}/sitemap.xml` : undefined,
  };
}
