import Link from "next/link";
import { AddressLines, EmailLink, MapEmbed, PhoneLink } from "@/components/site/ContactInfo";
import { ContactForm } from "@/components/site/ContactForm";
import { ClosuresList, HoursTable } from "@/components/site/Hours";
import { renderParagraphs } from "@/lib/rich-text";
import { pageMetadata } from "@/server/queries/metadata";
import {
  loadClosures,
  loadHours,
  loadRichTextContext,
  loadSettings,
  loadTexts,
  trackPageView,
} from "@/server/queries/public";

export const generateMetadata = () => pageMetadata("contact", "/contact");

export default async function ContactPage() {
  await trackPageView("/contact");
  const t = loadTexts();
  const { business } = loadSettings();

  return (
    <main>
      <section className="page-title">
        <div className="wrap">
          <p className="crumb">
            <Link href="/">Accueil</Link> / {t["contact.title"]}
          </p>
          <h1>{t["contact.title"]}</h1>
        </div>
      </section>
      <section className="block block--tight">
        <div className="wrap contact-grid">
          <div>
            <h2>{t["contact.details.title"]}</h2>
            <p className="visit__addr">
              <AddressLines business={business} />
            </p>
            <p>
              <PhoneLink business={business} className="visit__phone" />
              <br />
              <EmailLink business={business} />
            </p>
            <h2>{t["contact.hours.title"]}</h2>
            <HoursTable hours={loadHours()} />
            <ClosuresList closures={loadClosures()} />
            <p className="small">{t["contact.hours.note"]}</p>
          </div>
          <div>
            <MapEmbed query={business.mapQuery} tall />
          </div>
        </div>
      </section>
      <section className="block block--sand">
        <div className="wrap contact-grid">
          <div>
            <h2>{t["contact.form.title"]}</h2>
            {renderParagraphs(t["contact.form.text"], loadRichTextContext())}
          </div>
          <ContactForm phone={business.phone} successText={t["contact.form.success"]} />
        </div>
      </section>
    </main>
  );
}
