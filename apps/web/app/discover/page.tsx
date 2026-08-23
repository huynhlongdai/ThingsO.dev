import Link from "next/link";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { demoRepositories } from "@/lib/demo-repositories";

export const metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Curated discovery</p>
          <h1>Explore software by capability and use case.</h1>
          <div className="category-list">
            {["AI agents", "Browser automation", "Workflow automation", "Web scraping", "Video generation", "Self-hosting"].map((label) => (
              <Link key={label} href={`/search?q=${encodeURIComponent(label)}`}>{label}</Link>
            ))}
          </div>
          <div className="repo-grid">
            {demoRepositories.map((repo) => <RepositoryCard key={`${repo.owner}/${repo.name}`} repo={repo} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
