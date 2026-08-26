import Link from "next/link";
import { DecisionLink } from "./decision-event";
import { HealthScore } from "./health-score";
import { ProvenanceBadge } from "./provenance-badge";
import type { DecisionEventType, DecisionSurface } from "@/lib/decision-analytics";

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
  fitScore?: number | null;
  fitSource?: "source" | "ai_inference" | "editorial" | null;
  showCompareAction?: boolean;
  tags: string[];
  analytics?: {
    openEventType: DecisionEventType;
    sourceSurface: DecisionSurface;
    useCaseSlug?: string | null;
  };
};

function provenanceKind(source: RepositoryCardData["fitSource"] | RepositoryCardData["summarySource"]) {
  if (source === "editorial") return "editorial" as const;
  if (source === "ai_inference") return "ai_inference" as const;
  return "source_fact" as const;
}

function ProfileLink({ repo, children, className }: { repo: RepositoryCardData; children: React.ReactNode; className?: string }) {
  const profileHref = `/repos/${repo.owner}/${repo.name}`;
  if (!repo.analytics) return <Link href={profileHref} className={className}>{children}</Link>;
  return (
    <DecisionLink
      href={profileHref}
      className={className}
      eventType={repo.analytics.openEventType}
      sourceSurface={repo.analytics.sourceSurface}
      repositoryFullName={`${repo.owner}/${repo.name}`}
      useCaseSlug={repo.analytics.useCaseSlug}
    >
      {children}
    </DecisionLink>
  );
}

export function RepositoryCard({ repo }: { repo: RepositoryCardData }) {
  const summaryKind = provenanceKind(repo.summarySource);
  const showFit = Boolean(repo.fitReason && repo.fitSource);

  return (
    <article className="repo-card repo-card--v3">
      <div className="repo-card__accent" aria-hidden="true" />
      <div className="repo-card__main">
        <div className="repo-card__identity">
          <p className="repo-card__owner">{repo.owner}</p>
          <h3><ProfileLink repo={repo}>{repo.name}</ProfileLink></h3>
        </div>
        <HealthScore score={repo.healthScore} />
      </div>
      <div className="repo-card__summary-block">
        <ProvenanceBadge kind={summaryKind} />
        <p className="repo-card__summary">{repo.summary}</p>
      </div>
      {showFit ? (
        <div className="repo-card__fit">
          <ProvenanceBadge kind={provenanceKind(repo.fitSource)} />
          <div className="repo-card__fit-copy">
            {repo.fitScore !== null && repo.fitScore !== undefined ? (
              <strong>{Math.round(repo.fitScore * 100)}% fit</strong>
            ) : null}
            <span>{repo.fitReason}</span>
            {repo.showCompareAction ? (
              repo.analytics ? (
                <DecisionLink
                  className="text-link"
                  href={`/compare?repos=${encodeURIComponent(`${repo.owner}/${repo.name}`)}`}
                  eventType="repository_compare"
                  sourceSurface={repo.analytics.sourceSurface}
                  repositoryFullName={`${repo.owner}/${repo.name}`}
                  useCaseSlug={repo.analytics.useCaseSlug}
                >
                  Compare this repository →
                </DecisionLink>
              ) : (
                <Link className="text-link" href={`/compare?repos=${encodeURIComponent(`${repo.owner}/${repo.name}`)}`}>
                  Compare this repository →
                </Link>
              )
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="repo-card__meta" aria-label="Repository metadata">
        <span>★ {repo.stars}</span>
        {repo.language ? <span>{repo.language}</span> : null}
        {repo.licenseSpdx ? <span>{repo.licenseSpdx}</span> : null}
        {repo.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}
      </div>
      <div className="repo-card__footer">
        <span>{showFit ? "Reviewed fit signal" : "Source-backed profile"}</span>
        <ProfileLink repo={repo}>Open intelligence →</ProfileLink>
      </div>
    </article>
  );
}
