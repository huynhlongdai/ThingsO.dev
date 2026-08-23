export type ProvenanceKind = "source_fact" | "ai_inference" | "editorial";

const labels: Record<ProvenanceKind, string> = {
  source_fact: "Source fact",
  ai_inference: "AI inference",
  editorial: "Editorial",
};

export function ProvenanceBadge({ kind }: { kind: ProvenanceKind }) {
  return <span className={`provenance provenance--${kind}`}>{labels[kind]}</span>;
}
