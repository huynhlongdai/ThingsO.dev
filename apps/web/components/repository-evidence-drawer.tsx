import { DecisionDetails } from "@/components/decision-event";
import type { SourceProvenance } from "@/lib/data";

export function RepositoryEvidenceDrawer({
  sources,
  repositoryFullName,
}: {
  sources: SourceProvenance[];
  repositoryFullName: string;
}) {
  if (!sources.length) return <p className="empty-evidence">No source documents captured yet.</p>;
  return (
    <DecisionDetails
      className="evidence-drawer"
      eventType="evidence_expand"
      sourceSurface="repository"
      repositoryFullName={repositoryFullName}
    >
      <summary>View {sources.length} captured evidence documents</summary>
      <div className="source-list">
        {sources.map((source) => (
          <a href={source.sourceUrl} rel="noreferrer" key={`${source.documentType}-${source.sourceUrl}`}>
            <strong>{source.documentType}</strong><span>{source.ref ?? "default ref"}</span><code>{source.contentHash.slice(0, 10)}…</code>
          </a>
        ))}
      </div>
    </DecisionDetails>
  );
}
