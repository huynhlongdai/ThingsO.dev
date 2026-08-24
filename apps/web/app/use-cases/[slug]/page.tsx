import type { Metadata } from "next";
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

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Use case · decision ranking</p>
          <h1>{result.useCase.title}</h1>
          {result.useCase.description ? <p className="lede">{result.useCase.description}</p> : null}
          <p>{result.useCase.repositoryCount} reviewed matches, ranked by fit and deterministic project health.</p>
          <div className="repo-grid use-case-ranked-grid">
            {result.repositories.map((repo, index) => (
              <div className="use-case-ranked-item" key={repo.id}>
                <div className="use-case-rank" aria-label={`Rank ${index + 1}`}>#{index + 1}</div>
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
