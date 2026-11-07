import type { Settings } from "@/lib/types";

/** schema.org "Store" description for search engines, generated from the shop settings. */
export function StoreJsonLd({ settings }: { settings: Settings }) {
  const { business } = settings;
  const [postalCode, ...locality] = business.city.split(" ");
  const data = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: business.name,
    telephone: business.phoneIntl,
    email: business.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      postalCode,
      addressLocality: locality.join(" "),
      addressCountry: "FR",
    },
    sameAs: [business.facebook, business.instagram].filter(Boolean),
  };
  // JSON.stringify output is safe here once "<" is escaped (prevents closing the script tag).
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
