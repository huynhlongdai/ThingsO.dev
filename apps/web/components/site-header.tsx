import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="ThingsO home">
        <span className="brand-mark" aria-hidden="true">O</span>
        <span>ThingsO</span>
      </Link>
      <nav className="site-nav" aria-label="Primary navigation">
        <Link href="/discover">Discover</Link>
        <Link href="/ideas">Build Ideas</Link>
        <Link href="/about/methodology">Methodology</Link>
      </nav>
    </header>
  );
}
