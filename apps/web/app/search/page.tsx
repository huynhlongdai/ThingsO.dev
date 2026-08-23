import { IntentSearch } from "@/components/intent-search";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { demoRepositories } from "@/lib/demo-repositories";

export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="search-page">
          <p className="eyebrow">Intent search</p>
          <h1 className="search-page__title">{q ? `Results for “${q}”` : "What do you want to build?"}</h1>
          <IntentSearch compact defaultValue={q} />
          <div className="search-layout">
            <aside className="filter-panel" aria-label="Search filters">
              <strong>Filters</strong>
              <span>Capability</span>
              <span>Deployment</span>
              <span>Language</span>
              <span>License</span>
              <p>Interactive filters arrive with the search backend.</p>
            </aside>
            <section className="search-results" aria-label="Search result preview">
              <div className="result-count">UI preview · source-backed search is implemented in TH-041/042</div>
              {demoRepositories.map((repo) => <RepositoryCard key={`${repo.owner}/${repo.name}`} repo={repo} />)}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
