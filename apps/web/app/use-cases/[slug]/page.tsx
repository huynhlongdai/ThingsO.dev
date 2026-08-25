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
  const strongestFit = result.repositories[0];

  return (
    <main>
      <div className="page-shell page-shell--marketing">
        <SiteHeader />

        <section className="surface-hero surface-hero--usecase-detail">
          <div>
            <Link className="back-link" href="/use-cases">← All use cases</Link>
            <p className="eyebrow">Use case · decision ranking</p>
            <h1>{result.useCase.title}</h1>
            {result.useCase.description ? <p className="lede">{result.useCase.description}</p> : null}
          </div>
          <div className="usecase-detail-summary">
            <article><span>Reviewed matches</span><strong>{result.useCase.repositoryCount}</strong><small>eligible repository relationships</small></article>
            <article><span>Top fit</span><strong>{strongestFit?.fitScore !== null && strongestFit?.fitScore !== undefined ? `${Math.round(strongestFit.fitScore * 100)}%` : "—"}</strong><small>{strongestFit ? `${strongestFit.owner}/${strongestFit.name}` : "not established"}</small></article>
            <article><span>Ranking</span><strong>Fit + health</strong><small>signals remain distinct in the result cards</small></article>
          </div>
        </section>

        <section className="usecase-ranking-explainer" aria-label="How ranking should be interpreted">
          <div><span>Fit</span><strong>Does it match this job?</strong><p>Reviewed use-case fit is contextual and includes a reason when available.</p></div>
          <div><span>Health</span><strong>What is the project condition?</strong><p>Deterministic project health is shown separately from suitability.</p></div>
          <div><span>Evidence</span><strong>Why should you trust the signal?</strong><p>Provenance badges distinguish source facts from reviewed interpretation.</p></div>
        </section>

        <section className="surface-section surface-section--ranked-fit" aria-labelledby="ranked-heading">
          <div className="surface-section__heading">
            <div>
              <p className="eyebrow">Ranked candidates</p>
              <h2 id="ranked-heading">Repositories for this decision context</h2>
            </div>
            <p>{result.useCase.repositoryCount} reviewed match{result.useCase.repositoryCount === 1 ? "" : "es"}. Open a profile or compare candidates before treating rank as a final choice.</p>
          </div>
          <div className="repo-grid use-case-ranked-grid use-case-ranked-grid--v3">
            {result.repositories.map((repo, index) => (
              <div className="use-case-ranked-item use-case-ranked-item--v3" key={repo.id}>
                <div className="use-case-rank use-case-rank--v3" aria-label={`Rank ${index + 1}`}>
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
      </div>
    </main>
  );
}
