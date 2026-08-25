import Link from "next/link";
import { ComparePicker } from "@/components/compare-picker";
import { HealthScore } from "@/components/health-score";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { SiteHeader } from "@/components/site-header";
import { getCompareRepositories, listRepositories } from "@/lib/data";
import { getRepositoryIntelligence } from "@/lib/intelligence-data";
import type { RepositoryIntelligenceV3 } from "@/lib/intelligence";
import { formatCompactNumber } from "@/lib/view-models";

export const metadata = {
  title: "Compare",
  robots: { index: false, follow: true },
};
export const dynamic = "force-dynamic";

function readRepositoryNames(value: string | undefined): string[] {
  return [...new Set((value ?? "").split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 4);
}

function ListCell({ items }: { items: string[] }) {
  if (!items.length) return <>—</>;
  return (
    <ul className="compare-cell-list">
      {items.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function complexity(value: string | undefined) {
  if (!value || value === "unknown") return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function majorUnknownCount(profile: RepositoryIntelligenceV3 | null) {
  if (!profile) return 6;
  const claims = [
    profile.architecture.style,
    profile.architecture.executionModel,
    profile.deploymentOperations.minimumDeployment,
    profile.deploymentOperations.productionTopology,
    profile.integration.extensionModel,
    profile.securityPrivacy.authentication,
  ];
  return claims.filter((claim) => !claim.value || claim.state === "unknown").length;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ repos?: string }>;
}) {
  const params = await searchParams;
  const names = readRepositoryNames(params.repos);
  const [repositories, options] = await Promise.all([
    getCompareRepositories(names),
    listRepositories(100),
  ]);
  const intelligence = await Promise.all(
    repositories.map((repo) => getRepositoryIntelligence(repo.owner, repo.name)),
  );
  const columns = repositories.map((repository, index) => ({
    repository,
    intelligence: intelligence[index],
  }));

  return (
    <main>
      <div className="page-shell page-shell--wide">
        <SiteHeader />

        <section className="surface-hero surface-hero--compare">
          <div>
            <p className="eyebrow">Decision comparison</p>
            <h1>Compare fit before you compare features.</h1>
            <p className="lede">
              Select up to four repositories. ThingsO keeps fit, operating reality, evidence gaps and source facts separate so the decision is not reduced to star counts.
            </p>
          </div>
          <div className="compare-hero-note">
            <span>Comparison rule</span>
            <strong>No universal winner.</strong>
            <p>The stronger choice depends on your use case, constraints and the evidence available for each project.</p>
          </div>
        </section>

        <section className="compare-picker-shell" aria-label="Select repositories to compare">
          <div className="compare-picker-shell__heading">
            <div><span>01</span><strong>Select candidates</strong></div>
            <p>Choose two to four repositories from the current curated dataset.</p>
          </div>
          <ComparePicker
            options={options.map((repo) => ({ fullName: repo.fullName }))}
            selected={names}
          />
        </section>

        {columns.length ? (
          <>
            <section className="compare-summary" aria-labelledby="compare-summary-heading">
              <div className="compare-summary__heading">
                <div><span>02</span><h2 id="compare-summary-heading">Decision snapshot</h2></div>
                <p>Understand the strongest fit signal, trade-off and evidence gaps before opening the full matrix.</p>
              </div>
              <div className="compare-summary-grid">
                {columns.map(({ repository, intelligence: profile }) => {
                  const bestFor = profile?.audience.bestFor[0] ?? profile?.decision.chooseWhen[0] ?? "Best-fit context not established";
                  const tradeoff = profile?.decision.tradeoffs[0]
                    ?? profile?.differentiation.tradeoffsCreatedByDesign[0]
                    ?? "Explicit trade-off not established";
                  const unknowns = majorUnknownCount(profile);
                  return (
                    <article className="compare-summary-card" key={repository.id}>
                      <div className="compare-summary-card__topline">
                        <div>
                          <span>{repository.owner}</span>
                          <h3><Link href={`/repos/${repository.owner}/${repository.name}`}>{repository.name}</Link></h3>
                        </div>
                        <HealthScore score={repository.healthScore} />
                      </div>
                      <div className="compare-summary-card__meta">
                        {profile ? <ProvenanceBadge kind="editorial" /> : null}
                        <span>{profile ? `${Math.round(profile.confidence * 100)}% profile confidence` : "No current V3 profile"}</span>
                      </div>
                      <div className="compare-summary-card__signal compare-summary-card__signal--fit">
                        <span>Strongest fit signal</span>
                        <p>{bestFor}</p>
                      </div>
                      <div className="compare-summary-card__signal compare-summary-card__signal--tradeoff">
                        <span>Key trade-off</span>
                        <p>{tradeoff}</p>
                      </div>
                      <div className="compare-summary-card__footer">
                        <span>{unknowns} major evidence gap{unknowns === 1 ? "" : "s"}</span>
                        <Link href={`/repos/${repository.owner}/${repository.name}`}>Open profile →</Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="compare-matrix" aria-labelledby="compare-matrix-heading">
              <div className="compare-matrix__heading">
                <div><span>03</span><h2 id="compare-matrix-heading">Full decision matrix</h2></div>
                <p>Use the detailed matrix when the summary reveals a plausible fit. Unknown values remain explicit.</p>
              </div>
              <div className="compare-table-wrap">
                <table className="compare-table compare-table--decision">
                  <thead>
                    <tr>
                      <th>Decision signal</th>
                      {columns.map(({ repository, intelligence: profile }) => (
                        <th key={repository.id}>
                          <Link href={`/repos/${repository.owner}/${repository.name}`}>{repository.fullName}</Link>
                          <div className="compare-column-meta">
                            {profile ? <ProvenanceBadge kind="editorial" /> : null}
                            <span>{profile ? `V3 · ${Math.round(profile.confidence * 100)}% confidence` : "No current V3 profile"}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="compare-group-row"><th colSpan={columns.length + 1}>Fit & decision</th></tr>
                    <tr>
                      <th>Best for</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.audience.bestFor ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Poor fit</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.audience.poorFit ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Choose when</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.decision.chooseWhen ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Avoid when</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.decision.avoidWhen ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Evaluate first</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.decision.evaluateFirst ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Trade-offs</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.decision.tradeoffs ?? []} /></td>)}
                    </tr>

                    <tr className="compare-group-row"><th colSpan={columns.length + 1}>Operating reality</th></tr>
                    <tr>
                      <th>Architecture style</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{profile?.architecture.style.value ?? "—"}</td>)}
                    </tr>
                    <tr>
                      <th>Execution model</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{profile?.architecture.executionModel.value ?? "—"}</td>)}
                    </tr>
                    <tr>
                      <th>Minimum deployment</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{profile?.deploymentOperations.minimumDeployment.value ?? "—"}</td>)}
                    </tr>
                    <tr>
                      <th>Required services</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.deploymentOperations.requiredServices ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Learning curve</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{complexity(profile?.decision.learningCurve)}</td>)}
                    </tr>
                    <tr>
                      <th>Operational complexity</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{complexity(profile?.decision.operationalComplexity)}</td>)}
                    </tr>
                    <tr>
                      <th>Migration cost</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{complexity(profile?.decision.migrationCost)}</td>)}
                    </tr>
                    <tr>
                      <th>Lock-in</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{complexity(profile?.decision.lockIn)}</td>)}
                    </tr>

                    <tr className="compare-group-row"><th colSpan={columns.length + 1}>Product & implementation</th></tr>
                    <tr>
                      <th>What it is</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{profile?.identity.definition ?? repository.summary}</td>)}
                    </tr>
                    <tr>
                      <th>Primary category</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{profile?.identity.primaryCategory ?? "—"}</td>)}
                    </tr>
                    <tr>
                      <th>Capabilities</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.capabilities ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Limitations</th>
                      {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}><ListCell items={profile?.limitations ?? []} /></td>)}
                    </tr>
                    <tr>
                      <th>Technology</th>
                      {columns.map(({ repository, intelligence: profile }) => (
                        <td key={repository.id}>
                          <ListCell items={(profile?.technology.items ?? []).slice(0, 8).map((item) => `${item.name} — ${item.role}`)} />
                        </td>
                      ))}
                    </tr>

                    <tr className="compare-group-row"><th colSpan={columns.length + 1}>Source facts</th></tr>
                    <tr>
                      <th>Health <ProvenanceBadge kind="source_fact" /></th>
                      {columns.map(({ repository }) => <td key={repository.id}><HealthScore score={repository.healthScore} /></td>)}
                    </tr>
                    <tr>
                      <th>Stars <ProvenanceBadge kind="source_fact" /></th>
                      {columns.map(({ repository }) => <td key={repository.id}>{formatCompactNumber(repository.stars)}</td>)}
                    </tr>
                    <tr>
                      <th>Language <ProvenanceBadge kind="source_fact" /></th>
                      {columns.map(({ repository }) => <td key={repository.id}>{repository.language ?? "—"}</td>)}
                    </tr>
                    <tr>
                      <th>License <ProvenanceBadge kind="source_fact" /></th>
                      {columns.map(({ repository }) => <td key={repository.id}>{repository.licenseSpdx ?? "—"}</td>)}
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <div className="empty-state empty-state--compare">
            <strong>Select two or more repositories to start a decision comparison.</strong>
            <p>The selector above uses the current curated production dataset; no URL editing is required.</p>
          </div>
        )}
      </div>
    </main>
  );
}
