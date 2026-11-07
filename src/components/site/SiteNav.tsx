"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface NavItem {
  href: string;
  /** Matches the CSS hooks of the menu underline colours (data-nav). */
  id: string;
  label: string;
  cta?: boolean;
}

const MenuContext = createContext<{ open: boolean; setOpen: (open: boolean) => void }>({
  open: false,
  setOpen: () => {},
});

/** Mobile menu state. Mirrored on <body> because the stylesheet relies on body.menu-open. */
export function MenuProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.classList.toggle("menu-open", open);
  }, [open]);
  return <MenuContext.Provider value={{ open, setOpen }}>{children}</MenuContext.Provider>;
}

export function MenuButton() {
  const { open, setOpen } = useContext(MenuContext);
  return (
    <button
      className="burger"
      id="burger"
      aria-label="Menu"
      aria-expanded={open}
      aria-controls="menu"
      onClick={() => setOpen(!open)}
    >
      <span></span>
    </button>
  );
}

export function SiteMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { setOpen } = useContext(MenuContext);
  return (
    <nav className="menu" id="menu" aria-label="Navigation principale">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          data-nav={item.id}
          className={item.cta ? "menu__cta" : undefined}
          aria-current={pathname === item.href ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
