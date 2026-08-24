import Link from "next/link";
import { IntentSearch } from "@/components/intent-search";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { listTaxonomyTerms, recordSearchQuery } from "@/lib/data";
import { searchRepositoriesV3 } from "@/lib/search-v3";
import { formatCompactNumber } from "@/lib/view-models";

export const metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; health?: string }>;
}) {
  const { q = "", category = "", health = "" } = await searchParams;
  const query = q.trim();
  const parsedHealth = health ? Number(health) : null;
  const minHealth = parsedHealth !== null && Number.isFinite(parsedHealth) ? parsedHealth : null;
  const [repositories, categories] = await Promise.all([
    searchRepositoriesV3(query, 30, { category, minHealth }),
    listTaxonomyTerms("capability"),
  ]);

  if (query) {
    try {
      await recordSearchQuery(query, repositories.length);
    } catch {
      // Analytics must never break the primary search experience.
    }
  }

  const hasFilters = Boolean(category || minHealth !== null);

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="search-page">
          <p className="eyebrow">Intent search · Repository Intelligence v3</p>
          <h1 className="search-page__title">
            {query ? `Results for “${query}”` : "What do you want to build?"}
          </h1>
          <IntentSearch compact defaultValue={query} />
          <div className="search-layout">
            <aside className="filter-panel" aria-label="Search filters and guidance">
              <strong>Decision filters</strong>
              <form className="search-filters" action="/search" method="get">
                <input type="hidden" name="q" value={query} />
                <label>
                  <span>Capability</span>
                  <select name="category" defaultValue={category}>
                    <option value="">Any capability</option>
                    {categories.map((item) => (
                      <option key={item.slug} value={item.slug}>{item.label} ({item.repositoryCount})</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Minimum health</span>
                  <select name="health" defaultValue={minHealth === null ? "" : String(minHealth)}>
                    <option value="">Any health</option>
                    <option value="50">50+</option>
                    <option value="60">60+</option>
                    <option value="70">70+</option>
                    <option value="80">80+</option>
                  </select>
                </label>
                <button type="submit">Apply filters</button>
                {hasFilters ? <Link href={`/search?q=${encodeURIComponent(query)}`}>Clear filters</Link> : null}
              </form>
              <strong>Search understands</strong>
              <span>Problems & solution approach</span>
              <span>Capabilities & limitations</span>
              <span>Best-fit audiences</span>
              <span>Choose / evaluate criteria</span>
              <p>Ranking combines current approved V3 intelligence, taxonomy, use cases, source descriptions, full-text relevance and typo-tolerant matching.</p>
            </aside>
            <section className="search-results" aria-label="Search results">
              <div className="result-count">
                {repositories.length} evidence-backed result{repositories.length === 1 ? "" : "s"}
                {hasFilters ? " after filters" : ""}
              </div>
              {repositories.length ? (
                repositories.map((repo) => (
                  <RepositoryCard
                    key={repo.id}
                    repo={{
                      ...repo,
                      stars: formatCompactNumber(repo.stars),
                    }}
                  />
                ))
              ) : (
                <div className="empty-state">
                  <strong>No matching repositories yet.</strong>
                  <p>Try a broader intent, remove a filter, or search a capability such as “browser automation”, “RAG”, or “self hosting”.</p>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
