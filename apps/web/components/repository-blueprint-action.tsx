import Link from "next/link";
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

  if (readiness.stage === "blueprint-ready") {
    return <Link className="button button--accent" href={href}>Build Blueprint →</Link>;
  }

  return (
    <Link
      className="button button--accent"
      href={href}
      title={`${readiness.label}: ${readiness.blockers.slice(0, 2).join("; ")}`}
    >
      Check blueprint readiness →
    </Link>
  );
}
