import { IntentSearch } from "@/components/intent-search";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { recordSearchQuery, searchRepositories } from "@/lib/data";
import { toRepositoryCard } from "@/lib/view-models";

export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const repositories = await searchRepositories(query, 30);

  if (query) {
    try {
      await recordSearchQuery(query, repositories.length);
    } catch {
      // Analytics must never break the primary search experience.
    }
  }

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="search-page">
          <p className="eyebrow">Intent search</p>
          <h1 className="search-page__title">
            {query ? `Results for “${query}”` : "What do you want to build?"}
          </h1>
          <IntentSearch compact defaultValue={query} />
          <div className="search-layout">
            <aside className="filter-panel" aria-label="Search guidance">
              <strong>Search understands</strong>
              <span>Repository names</span>
              <span>Capabilities</span>
              <span>Use cases</span>
              <span>Descriptions</span>
              <p>Ranking combines PostgreSQL full-text relevance and typo-tolerant matching.</p>
            </aside>
            <section className="search-results" aria-label="Search results">
              <div className="result-count">
                {repositories.length} source-backed result{repositories.length === 1 ? "" : "s"}
              </div>
              {repositories.length ? (
                repositories.map((repo) => (
                  <RepositoryCard key={repo.id} repo={toRepositoryCard(repo)} />
                ))
              ) : (
                <div className="empty-state">
                  <strong>No matching repositories yet.</strong>
                  <p>Try a capability such as “browser automation”, “RAG”, or “self hosting”.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
