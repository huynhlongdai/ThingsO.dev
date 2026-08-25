import Link from "next/link";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { listRepositories, listTaxonomyTerms } from "@/lib/data";
import { listReviewedUseCases } from "@/lib/use-case-data";
import { toRepositoryCard } from "@/lib/view-models";

export const metadata = { title: "Discover" };
export const revalidate = 300;

export default async function DiscoverPage() {
  const [categories, useCases, repositories] = await Promise.all([
    listTaxonomyTerms("capability"),
    listReviewedUseCases(),
    listRepositories(24),
  ]);

  return (
    <main>
      <div className="page-shell page-shell--marketing">
        <SiteHeader />

        <section className="surface-hero surface-hero--discover">
          <div>
            <p className="eyebrow">Curated discovery</p>
            <h1>Explore software by capability, use case and evidence.</h1>
            <p className="lede">
              Start broad, then narrow toward fit. Repository facts come from captured snapshots; reviewed use-case relationships are kept separate from popularity signals.
            </p>
          </div>
          <div className="surface-hero__stats" aria-label="Discovery dataset summary">
            <article><span>Capabilities</span><strong>{categories.length}</strong><small>curated taxonomy terms</small></article>
            <article><span>Use cases</span><strong>{useCases.length}</strong><small>reviewed decision contexts</small></article>
            <article><span>Visible repos</span><strong>{repositories.length}</strong><small>source-backed results in this view</small></article>
          </div>
        </section>

        <section className="discovery-browser" aria-label="Browse discovery dimensions">
          <article className="discovery-panel discovery-panel--capabilities">
            <div className="discovery-panel__heading">
              <div><span>01</span><h2>Capabilities</h2></div>
              <p>Browse by the technical ability a project provides.</p>
            </div>
            <div className="discovery-link-grid">
              {categories.slice(0, 18).map((category) => (
                <Link key={category.slug} href={`/categories/${category.slug}`}>
                  <strong>{category.label}</strong>
                  <span>{category.repositoryCount} repositories</span>
                  <i aria-hidden="true">→</i>
                </Link>
              ))}
            </div>
          </article>

          <article className="discovery-panel discovery-panel--usecases">
            <div className="discovery-panel__heading">
              <div><span>02</span><h2>Reviewed use cases</h2></div>
              <p>Start from the job you need done and inspect repository fit.</p>
            </div>
            {useCases.length ? (
              <div className="discovery-link-grid discovery-link-grid--usecases">
                {useCases.slice(0, 12).map((useCase) => (
                  <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`}>
                    <strong>{useCase.title}</strong>
                    <span>{useCase.repositoryCount} reviewed matches</span>
                    <i aria-hidden="true">→</i>
                  </Link>
                ))}
              </div>
            ) : <p className="empty-evidence">Reviewed use-case mappings are not available yet.</p>}
          </article>
        </section>

        <section className="surface-section surface-section--repositories" aria-labelledby="discover-repos-heading">
          <div className="surface-section__heading">
            <div>
              <p className="eyebrow">Repository layer</p>
              <h2 id="discover-repos-heading">Explore the curated dataset.</h2>
            </div>
            <p>Open a repository to see the Decision Snapshot first, then architecture, developer workflow, operations and evidence.</p>
          </div>
          <div className="repo-grid repo-grid--discovery">
            {repositories.length ? repositories.map((repo) => (
              <RepositoryCard key={repo.id} repo={toRepositoryCard(repo)} />
            )) : (
              <div className="empty-state">
                <strong>No repository snapshots are available yet.</strong>
                <p>Run the seed ingestion worker to populate source-backed discovery.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
