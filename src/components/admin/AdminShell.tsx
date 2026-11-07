"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logout } from "@/server/actions/auth";

interface Counters {
  newQuotes: number;
  dueFollowUps: number;
  unreadMessages: number;
}

type NavEntry = { href: string; label: string; badge?: keyof Counters; pink?: boolean } | { group: string };

const NAV: NavEntry[] = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/statistiques", label: "Statistiques" },
  { group: "Demandes" },
  { href: "/admin/devis", label: "Devis", badge: "newQuotes" },
  { href: "/admin/devis?filtre=relances", label: "À relancer", badge: "dueFollowUps", pink: true },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/messages", label: "Messages", badge: "unreadMessages" },
  { group: "Contenu du site" },
  { href: "/admin/pages", label: "Pages, textes & visuels" },
  { href: "/admin/contenu/nouveautes", label: "Nouveautés" },
  { href: "/admin/contenu/occasions", label: "Occasions" },
  { href: "/admin/contenu/avis", label: "Avis clients" },
  { href: "/admin/galerie", label: "Galerie photos" },
  { href: "/admin/medias", label: "Médiathèque" },
  { href: "/admin/contenu/rayons", label: "Rayons équitation" },
  { href: "/admin/contenu/amenagements", label: "Offres aménagement" },
  { href: "/admin/contenu/services", label: "Services" },
  { href: "/admin/marques", label: "Marques" },
  { group: "Réglages" },
  { href: "/admin/reglages", label: "Infos & horaires" },
  { href: "/admin/contenu/fermetures", label: "Fermetures exceptionnelles" },
  { href: "/admin/documents", label: "Documents de devis" },
  { href: "/admin/sauvegarde", label: "Sauvegarde" },
  { href: "/admin/journal", label: "Journal d'activité" },
  { href: "/admin/compte", label: "Compte" },
];

export function AdminShell({ counters, children }: { counters: Counters; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const filter = useSearchParams().get("filtre") ?? "";

  useEffect(() => {
    document.body.classList.toggle("side-open", menuOpen);
  }, [menuOpen]);

  const isActive = (href: string) => {
    const [path, query] = href.split("?");
    if (query) return pathname === path && filter === new URLSearchParams(query).get("filtre");
    if (path === "/admin") return pathname === "/admin";
    if (path === "/admin/devis") return pathname.startsWith("/admin/devis") && !filter;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <div className="app">
      <aside className="side">
        <div className="side__brand">
          <img src="/img/logo-full.jpg" alt="" width={44} height={33} />
          <span>
            Equ&apos;Attitud<small>Administration</small>
          </span>
        </div>
        <input
          className="side__search"
          type="search"
          placeholder="Rechercher un devis…"
          onKeyDown={(e) => {
            const q = e.currentTarget.value.trim();
            if (e.key !== "Enter" || !q) return;
            setMenuOpen(false);
            router.push(`/admin/devis?statut=tous&q=${encodeURIComponent(q)}`);
          }}
        />
        <nav className="side__nav">
          {NAV.map((entry) =>
            "group" in entry ? (
              <p key={entry.group}>{entry.group}</p>
            ) : (
              <Link
                key={entry.href}
                href={entry.href}
                className={isActive(entry.href) ? "is-active" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                {entry.label}
                {entry.badge && (
                  <b className={entry.pink ? "badge badge--p" : "badge"}>{counters[entry.badge] || ""}</b>
                )}
              </Link>
            ),
          )}
        </nav>
        <div className="side__foot">
          <a href="/" target="_blank" rel="noopener">
            Voir le site ↗
          </a>
          <form action={logout}>
            <button type="submit">Déconnexion</button>
          </form>
        </div>
      </aside>
      <button className="side-toggle" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>
      <main className="main">{children}</main>
    </div>
  );
}
