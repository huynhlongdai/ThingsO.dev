import { DecisionLink } from "@/components/decision-event";
import type { RepositoryIntelligenceV3 } from "@/lib/intelligence";
import { getRepositoryReadiness } from "@/lib/repository-readiness";

export function RepositoryBlueprintAction({
  intelligence,
  owner,
  name,
}: {
  intelligence: RepositoryIntelligenceV3;
  owner: string;
  name: string;
}) {
  const readiness = getRepositoryReadiness(intelligence);
  const href = `/repos/${owner}/${name}/blueprint`;
  const common = {
    href,
    className: "button button--accent",
    eventType: "repository_blueprint" as const,
    sourceSurface: "repository" as const,
    repositoryFullName: `${owner}/${name}`,
    readinessStage: readiness.stage,
  };

  if (readiness.stage === "blueprint-ready") {
    return <DecisionLink {...common}>Build Blueprint →</DecisionLink>;
  }

  return (
    <DecisionLink
      {...common}
      title={`${readiness.label}: ${readiness.blockers.slice(0, 2).join("; ")}`}
    >
      Check blueprint readiness →
    </DecisionLink>
  );
}
