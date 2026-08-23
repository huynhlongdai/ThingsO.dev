import Link from "next/link";
import { HealthScore } from "./health-score";
import { ProvenanceBadge } from "./provenance-badge";

export type RepositoryCardData = {
  owner: string;
  name: string;
  summary: string;
  healthScore: number;
  stars: string;
  language: string;
  fitReason: string;
  tags: string[];
};

export function RepositoryCard({ repo }: { repo: RepositoryCardData }) {
  return (
    <article className="repo-card">
      <div className="repo-card__main">
        <div className="repo-card__identity">
          <p className="repo-card__owner">{repo.owner}</p>
          <h3><Link href={`/repos/${repo.owner}/${repo.name}`}>{repo.name}</Link></h3>
        </div>
        <HealthScore score={repo.healthScore} />
      </div>
      <p className="repo-card__summary">{repo.summary}</p>
      <div className="repo-card__fit">
        <ProvenanceBadge kind="ai_inference" />
        <span>{repo.fitReason}</span>
      </div>
      <div className="repo-card__meta" aria-label="Repository metadata">
        <span>★ {repo.stars}</span>
        <span>{repo.language}</span>
        {repo.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}
      </div>
    </article>
  );
}
