import Link from "next/link";
import { HealthScore } from "./health-score";
import { ProvenanceBadge } from "./provenance-badge";

export type RepositoryCardData = {
  owner: string;
  name: string;
  summary: string;
  summarySource?: "source" | "ai_inference" | "editorial";
  healthScore: number | null;
  stars: string | number;
  language: string | null;
  licenseSpdx?: string | null;
  fitReason?: string | null;
  tags: string[];
};

export function RepositoryCard({ repo }: { repo: RepositoryCardData }) {
  const summaryKind = repo.summarySource === "editorial"
    ? "editorial"
    : repo.summarySource === "ai_inference"
      ? "ai_inference"
      : "source_fact";

  return (
    <article className="repo-card">
      <div className="repo-card__main">
        <div className="repo-card__identity">
          <p className="repo-card__owner">{repo.owner}</p>
          <h3><Link href={`/repos/${repo.owner}/${repo.name}`}>{repo.name}</Link></h3>
        </div>
        <HealthScore score={repo.healthScore} />
      </div>
      <div className="repo-card__summary-block">
        <ProvenanceBadge kind={summaryKind} />
        <p className="repo-card__summary">{repo.summary}</p>
      </div>
      {repo.fitReason ? (
        <div className="repo-card__fit">
          <ProvenanceBadge kind="ai_inference" />
          <span>{repo.fitReason}</span>
        </div>
      ) : null}
      <div className="repo-card__meta" aria-label="Repository metadata">
        <span>★ {repo.stars}</span>
        {repo.language ? <span>{repo.language}</span> : null}
        {repo.licenseSpdx ? <span>{repo.licenseSpdx}</span> : null}
        {repo.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
      </div>
    </article>
  );
}
