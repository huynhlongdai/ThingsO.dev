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
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Curated discovery</p>
          <h1>Explore software by capability and use case.</h1>
          <p className="lede">
            Facts come from captured repository snapshots. Inferred use-case fit appears only after review.
          </p>
          <div className="category-list">
            {categories.slice(0, 18).map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>
                {category.label} · {category.repositoryCount}
              </Link>
            ))}
          </div>
          {useCases.length ? (
            <div className="category-list">
              {useCases.slice(0, 10).map((useCase) => (
                <Link key={useCase.slug} href={`/use-cases/${useCase.slug}`}>
                  {useCase.title} · {useCase.repositoryCount} reviewed
                </Link>
              ))}
            </div>
          ) : null}
          <div className="repo-grid">
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