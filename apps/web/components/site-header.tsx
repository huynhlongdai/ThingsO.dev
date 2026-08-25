"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  ["/discover", "◉", "Discover"],
  ["/use-cases", "◇", "Use Cases"],
  ["/compare", "⇄", "Compare"],
  ["/ideas", "△", "Build"],
  ["/about/methodology", "▣", "Methodology"],
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === "/discover") {
    return pathname === href || pathname.startsWith("/categories/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header site-header--product">
      <div className="site-header__primary">
        <Link className="brand brand--product" href="/" aria-label="ThingsO home">
          <span className="brand-mark brand-mark--rings" aria-hidden="true"><i /><i /></span>
          <span>ThingsO</span>
        </Link>
        <Link className="global-search-trigger" href="/search" aria-label="Search ThingsO">
          <span aria-hidden="true">⌕</span>
          <span>Search repositories, frameworks, tools…</span>
          <kbd>⌘K</kbd>
        </Link>
      </div>
      <nav className="site-nav site-nav--product" aria-label="Primary navigation">
        {navItems.map(([href, icon, label]) => {
          const active = isActiveRoute(pathname, href);
          return (
            <Link
              href={href}
              key={href}
              className={active ? "site-nav__link site-nav__link--active" : "site-nav__link"}
              aria-current={active ? "page" : undefined}
            >
              <span aria-hidden="true">{icon}</span>{label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
