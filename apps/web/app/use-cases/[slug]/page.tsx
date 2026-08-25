import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { getReviewedUseCase } from "@/lib/use-case-data";
import { formatCompactNumber } from "@/lib/view-models";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getReviewedUseCase(slug);
  if (!result) return { title: "Use case not found" };
  return {
    title: result.useCase.title,
    description: result.useCase.description ?? `Compare reviewed repository fit for ${result.useCase.title}.`,
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getReviewedUseCase(slug);
  if (!result) notFound();

  const scored = result.repositories.filter((repo) => repo.fitScore !== null);
  const topFit = scored.length ? Math.max(...scored.map((repo) => repo.fitScore ?? 0)) : null;
  const compareNames = result.repositories.slice(0, 4).map((repo) => `${repo.owner}/${repo.name}`);
  const compareHref = compareNames.length > 1
    ? `/compare?repos=${encodeURIComponent(compareNames.join(","))}`
    : "/compare";

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page use-case-detail-page">
          <div className="surface-hero surface-hero--ranked">
            <div className="surface-hero__copy">
              <Link className="back-link" href="/use-cases">← All use cases</Link>
              <p className="eyebrow">Use case · decision ranking</p>
              <h1>{result.useCase.title}</h1>
              <p className="lede">{result.useCase.description ?? "Reviewed repository fit for this job-to-be-done."}</p>
              <div className="surface-hero__actions">
                <Link className="button button--primary" href={compareHref}>Compare top matches</Link>
                <Link className="button" href={`/search?q=${encodeURIComponent(result.useCase.title)}`}>Search this intent</Link>
              </div>
            </div>
            <div className="surface-hero__stats" aria-label="Use case ranking summary">
              <div><span>Reviewed matches</span><strong>{result.useCase.repositoryCount}</strong><small>Current public ranking</small></div>
              <div><span>Top fit</span><strong>{topFit === null ? "—" : `${Math.round(topFit * 100)}%`}</strong><small>Use-case-specific, not universal quality</small></div>
              <div><span>Secondary signal</span><strong>Health</strong><small>Deterministic project condition</small></div>
            </div>
          </div>

          <section className="ranking-guide" aria-label="How to read this ranking">
            <div><span className="ranking-guide__icon">↯</span><div><strong>Fit explains relevance</strong><p>Why this repository can satisfy this specific job.</p></div></div>
            <div><span className="ranking-guide__icon">◎</span><div><strong>Health explains project condition</strong><p>Maintenance, adoption, documentation and operational signals stay separate.</p></div></div>
            <div><span className="ranking-guide__icon">?</span><div><strong>Unknown stays visible</strong><p>Missing evidence is not replaced by a confident-looking guess.</p></div></div>
          </section>

          <section className="surface-section" aria-labelledby="ranked-repositories-heading">
            <div className="surface-section__heading">
              <div>
                <p className="eyebrow">Ranked repositories</p>
                <h2 id="ranked-repositories-heading">Strongest reviewed fit first.</h2>
              </div>
              <p>{result.repositories.length} repositories are ranked using reviewed fit and deterministic project health. Open a profile before treating rank as a final adoption decision.</p>
            </div>

            <div className="repo-grid use-case-ranked-grid use-case-ranked-grid--v2">
              {result.repositories.map((repo, index) => (
                <div className="use-case-ranked-item" key={repo.id}>
                  <div className="use-case-rank use-case-rank--v2" aria-label={`Rank ${index + 1}`}>
                    <span>Rank</span><strong>#{index + 1}</strong>
                  </div>
                  <RepositoryCard
                    repo={{
                      owner: repo.owner,
                      name: repo.name,
                      summary: repo.summary,
                      summarySource: repo.summarySource,
                      healthScore: repo.healthScore,
                      stars: formatCompactNumber(repo.stars),
                      language: repo.language,
                      licenseSpdx: repo.licenseSpdx,
                      fitScore: repo.fitScore,
                      fitReason: repo.fitReason,
                      fitSource: repo.fitSource,
                      showCompareAction: true,
                      tags: repo.tags,
                    }}
                  />
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
