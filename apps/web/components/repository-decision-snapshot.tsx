import { ProvenanceBadge } from "@/components/provenance-badge";
import type { RepositoryIntelligenceV3 } from "@/lib/intelligence";

const UNKNOWN = "Not established";

function DecisionList({ items, empty = UNKNOWN }: { items: string[]; empty?: string }) {
  if (!items.length) return <p className="decision-empty">{empty}</p>;
  return (
    <ul className="decision-list">
      {items.slice(0, 4).map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

export function RepositoryDecisionSnapshot({
  intelligence,
  healthScore,
  license,
}: {
  intelligence: RepositoryIntelligenceV3;
  healthScore: number | null;
  license: string | null;
}) {
  const tradeoff = intelligence.decision.tradeoffs[0]
    ?? intelligence.differentiation.tradeoffsCreatedByDesign[0]
    ?? null;
  const minimumDeployment = intelligence.deploymentOperations.minimumDeployment.value;

  return (
    <section className="decision-snapshot" id="decision-snapshot" aria-labelledby="decision-snapshot-title">
      <div className="decision-snapshot__heading">
        <div>
          <p className="eyebrow">Decision snapshot</p>
          <h2 id="decision-snapshot-title">Can this project fit your build?</h2>
        </div>
        <div className="decision-snapshot__meta">
          <ProvenanceBadge kind="editorial" />
          <span>{Math.round(intelligence.confidence * 100)}% profile confidence</span>
        </div>
      </div>

      <div className="decision-score-row">
        <article className="decision-score decision-score--health">
          <span>Project health</span>
          <strong>{healthScore === null ? "—" : Math.round(healthScore)}</strong>
          <small>Deterministic source signals</small>
        </article>
        <article className="decision-score">
          <span>License</span>
          <strong>{license ?? UNKNOWN}</strong>
          <small>Verify obligations before adoption</small>
        </article>
        <article className="decision-score">
          <span>Minimum deployment</span>
          <strong>{minimumDeployment ?? UNKNOWN}</strong>
          <small>{intelligence.deploymentOperations.minimumDeployment.state}</small>
        </article>
        <article className="decision-score">
          <span>Operational complexity</span>
          <strong>{intelligence.decision.operationalComplexity}</strong>
          <small>Evidence-backed decision signal</small>
        </article>
      </div>

      <div className="decision-cards">
        <article className="decision-card decision-card--positive">
          <div className="decision-card__label"><span aria-hidden="true">✓</span> Best for</div>
          <DecisionList items={intelligence.audience.bestFor.length ? intelligence.audience.bestFor : intelligence.decision.chooseWhen} />
        </article>
        <article className="decision-card decision-card--warning">
          <div className="decision-card__label"><span aria-hidden="true">!</span> Avoid when</div>
          <DecisionList items={intelligence.decision.avoidWhen.length ? intelligence.decision.avoidWhen : intelligence.audience.poorFit} />
        </article>
        <article className="decision-card decision-card--tradeoff">
          <div className="decision-card__label"><span aria-hidden="true">⇄</span> Key trade-off</div>
          <p>{tradeoff ?? "No explicit trade-off is established from the available evidence."}</p>
          <a href="#decision-guide">View decision guide ↓</a>
        </article>
      </div>
    </section>
  );
}
