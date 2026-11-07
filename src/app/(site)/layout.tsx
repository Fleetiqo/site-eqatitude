import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import type { ReactNode } from "react";
import { RevealOnScroll } from "@/components/site/RevealOnScroll";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { env } from "@/server/env";
import {
  activeAnnouncement,
  loadClosures,
  loadHours,
  loadRichTextContext,
  loadSettings,
  loadTexts,
} from "@/server/queries/public";
import "@/styles/site.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-oswald",
  display: "swap",
});

/** Content is edited live from the admin console, so pages are rendered on each request. */
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const texts = loadTexts();
  return {
    metadataBase: env.siteUrl ? new URL(env.siteUrl) : undefined,
    icons: { icon: texts["global.favicon"] },
  };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function SiteLayout({ children }: { children: ReactNode }) {
  const settings = loadSettings();
  const texts = loadTexts();
  const hours = loadHours();
  const closures = loadClosures();
  return (
    <html lang="fr" className={`${inter.variable} ${oswald.variable}`}>
      <body>
        <SiteHeader
          settings={settings}
          texts={texts}
          hours={hours}
          closures={closures}
          announcement={activeAnnouncement(settings.announcement)}
        />
        {children}
        <SiteFooter settings={settings} texts={texts} hours={hours} ctx={loadRichTextContext()} />
        <RevealOnScroll />
      </body>
    </html>
  );
}
