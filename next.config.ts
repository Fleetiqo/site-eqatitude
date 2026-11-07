import type { NextConfig } from "next";

const LEGACY_PAGES = ["equitation", "amenagement", "nouveautes", "devis", "contact", "mentions-legales"];

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      // Photos are resized in the browser before upload, but restoring a backup can be larger.
      bodySizeLimit: "25mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async redirects() {
    // Old static URLs (/equitation.html…) stay valid for bookmarks and search engines.
    return [
      { source: "/index.html", destination: "/", permanent: true },
      ...LEGACY_PAGES.map((page) => ({ source: `/${page}.html`, destination: `/${page}`, permanent: true })),
      { source: "/admin/devis-doc.html", destination: "/admin/devis", permanent: false },
    ];
  },
};

export default nextConfig;
