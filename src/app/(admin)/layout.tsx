import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Administration · Equ'Attitud", template: "%s · Administration Equ'Attitud" },
  robots: { index: false, follow: false },
  icons: { icon: "/img/favicon.jpg" },
};

/** Root layout of the admin console (separate from the public site: different styles, no tracking). */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
