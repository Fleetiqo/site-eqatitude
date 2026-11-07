import Link from "next/link";
import type { Texts } from "@/content/blocks";
import { renderInline, type RichTextContext } from "@/lib/rich-text";
import { shopClock } from "@/lib/hours";
import type { OpeningDay, Settings } from "@/lib/types";
import { AddressLines, EmailLink, PhoneLink } from "./ContactInfo";
import { HoursSummary } from "./Hours";
import { Tetra } from "./SiteHeader";

export function SiteFooter({
  settings,
  texts,
  hours,
  ctx,
}: {
  settings: Settings;
  texts: Texts;
  hours: OpeningDay[];
  ctx: RichTextContext;
}) {
  const { business } = settings;
  const year = shopClock().isoDay.slice(0, 4);
  return (
    <footer className="site-footer">
      <Tetra />
      <div className="wrap site-footer__grid">
        <div>
          <img src={texts["global.logo"]} alt="" width={80} height={60} className="site-footer__logo" />
          <p className="site-footer__name">{business.name}</p>
          <p>{renderInline(texts["footer.tagline"], ctx)}</p>
        </div>
        <div>
          <h3>Le magasin</h3>
          <p>
            <AddressLines business={business} />
          </p>
          <p>
            <PhoneLink business={business} />
            <br />
            <EmailLink business={business} />
          </p>
        </div>
        <div>
          <h3>Horaires</h3>
          <HoursSummary hours={hours} />
        </div>
        <div>
          <h3>Le site</h3>
          <ul>
            <li>
              <Link href="/equitation">{texts["nav.equitation"]}</Link>
            </li>
            <li>
              <Link href="/amenagement">{texts["nav.amenagement"]}</Link>
            </li>
            <li>
              <Link href="/nouveautes">{texts["nav.news"]}</Link>
            </li>
            <li>
              <Link href="/devis">Demande de devis</Link>
            </li>
            <li>
              <Link href="/contact">Contact &amp; accès</Link>
            </li>
          </ul>
          <p className="site-footer__social">
            <a href={business.facebook} target="_blank" rel="noopener">
              Facebook
            </a>{" "}
            ·{" "}
            <a href={business.instagram} target="_blank" rel="noopener">
              Instagram
            </a>
          </p>
        </div>
      </div>
      <div className="wrap site-footer__bottom">
        <span>
          © <span>{year}</span> {business.name}
        </span>
        <Link href="/mentions-legales">Mentions légales</Link>
      </div>
    </footer>
  );
}
