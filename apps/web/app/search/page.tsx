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
      <div className="page-shell page-shell--marketing">
        <SiteHeader />

        <section className="surface-hero surface-hero--search">
          <div className="search-command">
            <p className="eyebrow">Intent search · Repository Intelligence v3</p>
            <h1 className="search-page__title">
              {query ? `Find the best fit for “${query}”.` : "What do you want to build?"}
            </h1>
            <p className="lede">Search across repository scope, problems, capabilities, limitations, reviewed use cases and decision criteria.</p>
            <IntentSearch compact defaultValue={query} />
          </div>
          <div className="search-command__status" aria-label="Search result status">
            <article><span>Results</span><strong>{repositories.length}</strong><small>evidence-backed matches</small></article>
            <article><span>Filters</span><strong>{hasFilters ? "Active" : "Open"}</strong><small>{hasFilters ? "decision constraints applied" : "all eligible repositories"}</small></article>
            <article><span>Ranking</span><strong>Fit first</strong><small>health remains a separate signal</small></article>
          </div>
        </section>

        <section className="search-layout search-layout--v3">
          <aside className="search-sidebar" aria-label="Search filters and ranking guidance">
            <details className="search-filter-drawer" open>
              <summary>
                <span>Decision filters</span>
                <small>{hasFilters ? "Filters active" : "Refine results"}</small>
              </summary>
              <form className="search-filters search-filters--v3" action="/search" method="get">
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
            </details>

            <div className="search-ranking-card">
              <span>What ranking reads</span>
              <ul>
                <li>Problem & solution approach</li>
                <li>Capabilities & limitations</li>
                <li>Best-fit audiences</li>
                <li>Choose / evaluate criteria</li>
              </ul>
              <p>Current approved V3 intelligence is combined with taxonomy, use cases, source descriptions, full-text relevance and typo-tolerant matching.</p>
            </div>
          </aside>

          <section className="search-results search-results--v3" aria-label="Search results">
            <div className="search-results__heading">
              <div>
                <span>{repositories.length} result{repositories.length === 1 ? "" : "s"}</span>
                <strong>{query ? `Matching “${query}”` : "Curated repository matches"}</strong>
              </div>
              <p>Open a result to inspect its Decision Snapshot, evidence gaps and implementation detail.</p>
            </div>
            {repositories.length ? (
              repositories.map((repo) => (
                <RepositoryCard
                  key={repo.id}
                  repo={{
                    ...repo,
                    stars: formatCompactNumber(repo.stars),
                    analytics: {
                      openEventType: "search_result_open",
                      sourceSurface: "search",
                    },
                  }}
                />
              ))
            ) : (
              <div className="empty-state empty-state--search">
                <strong>No matching repositories yet.</strong>
                <p>Try a broader intent, remove a filter, or search a capability such as “browser automation”, “RAG”, or “self hosting”.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
