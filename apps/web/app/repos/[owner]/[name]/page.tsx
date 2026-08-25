import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { RepositoryDecisionSnapshot } from "@/components/repository-decision-snapshot";
import { RepositoryIntelligenceV3View } from "@/components/repository-intelligence-v3";
import { RepositorySectionNav } from "@/components/repository-section-nav";
import { SiteHeader } from "@/components/site-header";
import { getRepository } from "@/lib/data";
import { getRepositoryIntelligence } from "@/lib/intelligence-data";
import { formatCompactNumber } from "@/lib/view-models";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}): Promise<Metadata> {
  const { owner, name } = await params;
  const [repo, intelligence] = await Promise.all([
    getRepository(owner, name),
    getRepositoryIntelligence(owner, name),
  ]);
  if (!repo) return { title: "Repository not found" };
  return {
    title: repo.fullName,
    description: intelligence?.identity.definition ?? repo.summary,
    alternates: { canonical: `/repos/${repo.owner}/${repo.name}` },
  };
}

function Metric({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="source-metric">
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
    </div>
  );
}

export default async function RepositoryPage({
  params,
}: {
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = await params;
  const [repo, intelligence] = await Promise.all([
    getRepository(owner, name),
    getRepositoryIntelligence(owner, name),
  ]);
  if (!repo) notFound();

  const heroSummary = intelligence?.identity.definition ?? repo.summary;

  return (
    <main id="main-content">
      <div className="page-shell page-shell--wide">
        <SiteHeader />
        <div className="repo-workspace">
          <div className="repo-workspace__main">
            <section className="repo-hero" aria-labelledby="repository-title">
              <div className="repo-hero__topline">
                <Link href="/search" className="back-link">← Back to search</Link>
                <div className="repo-hero__provenance">
                  <ProvenanceBadge kind={intelligence ? "editorial" : repo.summarySource === "ai_inference" ? "ai_inference" : "source_fact"} />
                  <span>Repository intelligence</span>
                </div>
              </div>

              <div className="repo-hero__content">
                <div>
                  <div className="repo-hero__identity">
                    <div className="repo-hero__mark" aria-hidden="true">↗</div>
                    <div>
                      <p className="repo-hero__owner">{repo.owner}</p>
                      <h1 id="repository-title">{repo.name}</h1>
                    </div>
                  </div>
                  <p className="repo-hero__summary">{heroSummary}</p>
                  <div className="repo-hero__tags">
                    {repo.language ? <span>{repo.language}</span> : null}
                    {intelligence?.identity.primaryCategory ? <span>{intelligence.identity.primaryCategory}</span> : null}
                    {repo.taxonomy.slice(0, 3).map((item) => <span key={`${item.axis}-${item.slug}`}>{item.label}</span>)}
                  </div>
                  <div className="repo-hero__facts">
                    <span>{repo.licenseSpdx ?? "License unknown"}</span>
                    <span>★ {formatCompactNumber(repo.stars)}</span>
                    <span>Forks {formatCompactNumber(repo.forks)}</span>
                    <span>{repo.language ?? "Language unknown"}</span>
                  </div>
                </div>

                <div className="repo-hero__actions">
                  <a className="button button--primary" href={repo.githubUrl} rel="noreferrer">View on GitHub ↗</a>
                  {repo.homepageUrl ? <a className="button" href={repo.homepageUrl} rel="noreferrer">Homepage ↗</a> : null}
                  <Link className="button" href={`/compare?repos=${encodeURIComponent(repo.fullName)}`}>Compare</Link>
                  {intelligence ? <Link className="button button--accent" href={`/repos/${repo.owner}/${repo.name}/blueprint`}>Build Blueprint →</Link> : null}
                </div>
              </div>
            </section>

            {intelligence ? (
              <>
                <RepositoryDecisionSnapshot intelligence={intelligence} healthScore={repo.healthScore} license={repo.licenseSpdx} />
                <RepositoryIntelligenceV3View intelligence={intelligence} />
              </>
            ) : repo.analysis ? (
              <section className="intelligence-section">
                <div className="intelligence-heading">
                  <div><ProvenanceBadge kind="ai_inference" /><h2>Reviewed analysis</h2></div>
                </div>
                <p>{repo.analysis.summary}</p>
                <div className="intelligence-split">
                  <article className="content-panel"><span className="content-panel__label">Capabilities</span><ul>{repo.analysis.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></article>
                  <article className="content-panel"><span className="content-panel__label">Limitations</span><ul>{repo.analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></article>
                </div>
              </section>
            ) : null}

            {repo.useCases.length || repo.relations.length || repo.buildIdeas.length ? (
              <section className="intelligence-section intelligence-section--ecosystem" id="ecosystem">
                <div className="intelligence-heading">
                  <div>
                    <div className="intelligence-heading__meta"><span>Next steps</span></div>
                    <h2>Use cases, related projects & build paths</h2>
                  </div>
                </div>
                {repo.useCases.length ? (
                  <div className="use-case-strip">
                    {repo.useCases.map((item) => (
                      <article className="use-case-card" key={`${item.slug}-${item.sourceType}`}>
                        <span>{Math.round(item.fitScore * 100)}% fit</span>
                        <h3><Link href={`/use-cases/${item.slug}`}>{item.title}</Link></h3>
                        {item.reason ? <p>{item.reason}</p> : null}
                        <ProvenanceBadge kind={item.sourceType === "source" ? "source_fact" : item.sourceType} />
                      </article>
                    ))}
                  </div>
                ) : null}
                {repo.relations.length ? (
                  <div className="relation-list">
                    {repo.relations.map((item) => {
                      const [relatedOwner, relatedName] = item.fullName.split("/");
                      return <div key={`${item.fullName}-${item.relationType}-${item.sourceType}`}>
                        <span>{item.relationType}</span><Link href={`/repos/${relatedOwner}/${relatedName}`}>{item.fullName}</Link><ProvenanceBadge kind={item.sourceType === "source" ? "source_fact" : item.sourceType} />
                      </div>;
                    })}
                  </div>
                ) : null}
                {repo.buildIdeas.length ? (
                  <div className="use-case-strip build-path-strip">
                    {repo.buildIdeas.map((idea) => (
                      <article className="use-case-card" key={idea.id}>
                        <span>Build idea</span>
                        <h3><Link href={`/ideas/${idea.slug}`}>{idea.title}</Link></h3>
                        <p>{idea.problem}</p>
                        <ProvenanceBadge kind={intelligence ? "editorial" : "ai_inference"} />
                      </article>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="source-section" id="evidence">
              <div className="source-section__heading">
                <div>
                  <p className="eyebrow">Source layer</p>
                  <h2>Health, GitHub facts & evidence</h2>
                </div>
                <ProvenanceBadge kind="source_fact" />
              </div>

              {repo.health ? (
                <div className="source-metrics-grid">
                  <Metric label="Maintenance" value={Math.round(repo.health.maintenance)} />
                  <Metric label="Adoption" value={Math.round(repo.health.adoption)} />
                  <Metric label="Community" value={Math.round(repo.health.community)} />
                  <Metric label="Documentation" value={Math.round(repo.health.documentation)} />
                  <Metric label="Operations" value={Math.round(repo.health.operations)} />
                  <Metric label="License clarity" value={Math.round(repo.health.licenseClarity)} />
                  <Metric label="Maturity" value={Math.round(repo.health.maturity)} />
                  <Metric label="Metadata" value={Math.round(repo.health.metadata)} />
                </div>
              ) : null}

              <div className="source-metrics-grid source-metrics-grid--facts">
                <Metric label="Stars" value={formatCompactNumber(repo.stars)} />
                <Metric label="Forks" value={formatCompactNumber(repo.forks)} />
                <Metric label="Open issues" value={formatCompactNumber(repo.openIssues)} />
                <Metric label="Watchers" value={formatCompactNumber(repo.watchers)} />
                <Metric label="Language" value={repo.language} />
                <Metric label="License" value={repo.licenseSpdx} />
                <Metric label="Default branch" value={repo.defaultBranch} />
                <Metric label="Snapshot" value={new Date(repo.capturedAt).toLocaleDateString("en-CA")} />
              </div>

              {repo.sources.length ? (
                <details className="evidence-drawer">
                  <summary>View {repo.sources.length} captured evidence documents</summary>
                  <div className="source-list">
                    {repo.sources.map((source) => (
                      <a href={source.sourceUrl} rel="noreferrer" key={`${source.documentType}-${source.sourceUrl}`}>
                        <strong>{source.documentType}</strong><span>{source.ref ?? "default ref"}</span><code>{source.contentHash.slice(0, 10)}…</code>
                      </a>
                    ))}
                  </div>
                </details>
              ) : <p className="empty-evidence">No source documents captured yet.</p>}
            </section>
          </div>

          <aside className="repo-workspace__rail">
            <RepositorySectionNav />
            <section className="rail-card rail-card--decision">
              <span>Decision tools</span>
              <strong>Need a side-by-side view?</strong>
              <p>Compare this repository against alternatives using the same evidence-backed criteria.</p>
              <Link href={`/compare?repos=${encodeURIComponent(repo.fullName)}`}>Compare now →</Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
