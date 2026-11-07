import Link from "next/link";
import type { Texts } from "@/content/blocks";
import type { Closure, OpeningDay, Settings } from "@/lib/types";
import { OpenStatus } from "./OpenStatus";
import { MenuButton, MenuProvider, SiteMenu, type NavItem } from "./SiteNav";

interface Props {
  settings: Settings;
  texts: Texts;
  hours: OpeningDay[];
  closures: Closure[];
  announcement: string;
}

export function SiteHeader({ settings, texts, hours, closures, announcement }: Props) {
  const { business } = settings;
  const nav: NavItem[] = [
    { href: "/", id: "accueil", label: texts["nav.home"] },
    { href: "/equitation", id: "equitation", label: texts["nav.equitation"] },
    { href: "/amenagement", id: "amenagement", label: texts["nav.amenagement"] },
    { href: "/nouveautes", id: "nouveautes", label: texts["nav.news"] },
    { href: "/contact", id: "contact", label: texts["nav.contact"] },
    { href: "/devis", id: "devis", label: texts["nav.quote"], cta: true },
  ];

  return (
    <>
      <div className="announce" id="announce" hidden={!announcement}>
        {announcement}
      </div>
      <div className="topbar">
        <div className="wrap topbar__inner">
          <OpenStatus hours={hours} closures={closures} />
          <span className="topbar__addr">
            {business.address} · {business.city}
          </span>
        </div>
      </div>
      <MenuProvider>
        <header className="site-header">
          <div className="wrap site-header__inner">
            <a className="site-header__phone" href={`tel:${business.phoneIntl}`}>
              {business.phone}
            </a>
            <Link className="logo" href="/" aria-label={`${business.name}, accueil`}>
              <img src={texts["global.logo"]} alt="" width={64} height={48} />
              <span className="logo__text">
                <strong>{texts["global.logoTitle"]}</strong>
                <span>{texts["global.logoSubtitle"]}</span>
              </span>
            </Link>
            <Link className="site-header__cta" href="/devis">
              {texts["global.headerCta"]}
            </Link>
            <MenuButton />
          </div>
          <SiteMenu items={nav} />
          <Tetra />
        </header>
      </MenuProvider>
    </>
  );
}

/** The four brand colour stripes. */
export const Tetra = () => (
  <div className="tetra" aria-hidden="true">
    <i></i>
    <i></i>
    <i></i>
    <i></i>
  </div>
);
