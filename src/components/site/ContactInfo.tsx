import type { BusinessInfo } from "@/lib/types";

export function PhoneLink({ business, className }: { business: BusinessInfo; className?: string }) {
  return (
    <a href={`tel:${business.phoneIntl}`} className={className}>
      {business.phone}
    </a>
  );
}

export const EmailLink = ({ business }: { business: BusinessInfo }) => (
  <a href={`mailto:${business.email}`}>{business.email}</a>
);

export function AddressLines({ business }: { business: BusinessInfo }) {
  return (
    <>
      {business.address}
      <br />
      {business.city}
    </>
  );
}

export function MapEmbed({ query, tall = false }: { query: string; tall?: boolean }) {
  const src = `https://www.google.com/maps?${new URLSearchParams({ q: query, output: "embed" })}`;
  return (
    <div className={tall ? "visit__map visit__map--tall" : "visit__map"}>
      <iframe title="Plan d'accès" loading="lazy" src={src} />
    </div>
  );
}
