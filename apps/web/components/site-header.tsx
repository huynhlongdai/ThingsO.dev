import Link from "next/link";

const navItems = [
  ["/discover", "◉", "Discover"],
  ["/use-cases", "◇", "Use Cases"],
  ["/compare", "⇄", "Compare"],
  ["/ideas", "△", "Build"],
  ["/about/methodology", "▣", "Methodology"],
] as const;

export function SiteHeader() {
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
        {navItems.map(([href, icon, label]) => (
          <Link href={href} key={href}><span aria-hidden="true">{icon}</span>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
