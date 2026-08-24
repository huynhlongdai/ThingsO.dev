import Link from "next/link";
import { ComparePicker } from "@/components/compare-picker";
import { HealthScore } from "@/components/health-score";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { SiteHeader } from "@/components/site-header";
import { getCompareRepositories, listRepositories } from "@/lib/data";
import { getRepositoryIntelligence } from "@/lib/intelligence-data";
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
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Decision comparison</p>
          <h1>Compare fit, trade-offs and operating reality.</h1>
          <p className="lede">
            Select up to four repositories. ThingsO compares current approved Repository Intelligence v3 with deterministic source facts so the decision is not reduced to star counts.
          </p>

          <ComparePicker
            options={options.map((repo) => ({ fullName: repo.fullName }))}
            selected={names}
          />

          {columns.length ? (
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
                  <tr>
                    <th>Health <ProvenanceBadge kind="source_fact" /></th>
                    {columns.map(({ repository }) => <td key={repository.id}><HealthScore score={repository.healthScore} /></td>)}
                  </tr>
                  <tr>
                    <th>What it is</th>
                    {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{profile?.identity.definition ?? repository.summary}</td>)}
                  </tr>
                  <tr>
                    <th>Primary category</th>
                    {columns.map(({ repository, intelligence: profile }) => <td key={repository.id}>{profile?.identity.primaryCategory ?? "—"}</td>)}
                  </tr>
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
          ) : (
            <div className="empty-state">
              <strong>Select two or more repositories to start a decision comparison.</strong>
              <p>The selector above uses the current curated production dataset; no URL editing is required.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
