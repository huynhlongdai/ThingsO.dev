import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HealthScore } from "@/components/health-score";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { RepositoryIntelligenceV3View } from "@/components/repository-intelligence-v3";
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
    <div className="metric-card">
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
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page repo-detail">
          <div className="repo-detail__hero">
            <div>
              <p className="eyebrow">Repository intelligence</p>
              <h1>{repo.fullName}</h1>
              <div className="repo-detail__summary">
                <ProvenanceBadge
                  kind={intelligence ? "editorial" : repo.summarySource === "ai_inference" ? "ai_inference" : "source_fact"}
                />
                <p className="lede">{heroSummary}</p>
              </div>
              <div className="repo-actions">
                <a href={repo.githubUrl} rel="noreferrer">GitHub ↗</a>
                {repo.homepageUrl ? <a href={repo.homepageUrl} rel="noreferrer">Homepage ↗</a> : null}
                <Link href={`/compare?repos=${encodeURIComponent(repo.fullName)}`}>Compare</Link>
                {intelligence ? <Link href={`/repos/${repo.owner}/${repo.name}/blueprint`}>Build Blueprint →</Link> : null}
              </div>
            </div>
            <HealthScore score={repo.healthScore} />
          </div>

          {intelligence ? (
            <RepositoryIntelligenceV3View intelligence={intelligence} />
          ) : repo.analysis ? (
            <section className="detail-section">
              <div className="section-heading"><ProvenanceBadge kind="ai_inference" /><h2>Reviewed analysis</h2></div>
              <p>{repo.analysis.summary}</p>
              <p className="muted">{repo.analysis.provider} / {repo.analysis.model} · confidence {Math.round((repo.analysis.confidence ?? 0) * 100)}%</p>
              <div className="detail-columns">
                <div><h3>Capabilities</h3><ul>{repo.analysis.capabilities.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h3>Limitations</h3><ul>{repo.analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h3>Deployment</h3><ul>{repo.analysis.deploymentModes.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h3>Interfaces</h3><ul>{repo.analysis.interfaces.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
            </section>
          ) : null}

          {repo.taxonomy.length ? (
            <section className="detail-section">
              <h2>Classification</h2>
              <div className="taxonomy-list">{repo.taxonomy.map((item) => (
                <span className="taxonomy-item" key={`${item.axis}-${item.slug}-${item.sourceType}`}>
                  {item.label} <small>{item.axis}</small> <ProvenanceBadge kind={item.sourceType === "source" ? "source_fact" : item.sourceType} />
                </span>
              ))}</div>
            </section>
          ) : null}

          {repo.useCases.length ? (
            <section className="detail-section">
              <h2>Use-case fit</h2>
              <div className="idea-grid">{repo.useCases.map((item) => (
                <article className="idea-card" key={`${item.slug}-${item.sourceType}`}>
                  <h3><Link href={`/use-cases/${item.slug}`}>{item.title}</Link></h3>
                  <strong>{Math.round(item.fitScore * 100)}% fit</strong>
                  {item.reason ? <p>{item.reason}</p> : null}
                  <ProvenanceBadge kind={item.sourceType === "source" ? "source_fact" : item.sourceType} />
                </article>
              ))}</div>
            </section>
          ) : null}

          {repo.relations.length ? (
            <section className="detail-section">
              <h2>Related repositories</h2>
              <div className="relation-list">{repo.relations.map((item) => {
                const [relatedOwner, relatedName] = item.fullName.split("/");
                return <div key={`${item.fullName}-${item.relationType}-${item.sourceType}`}>
                  <span>{item.relationType}</span> <Link href={`/repos/${relatedOwner}/${relatedName}`}>{item.fullName}</Link> <ProvenanceBadge kind={item.sourceType === "source" ? "source_fact" : item.sourceType} />
                </div>;
              })}</div>
            </section>
          ) : null}

          {repo.buildIdeas.length ? (
            <section className="detail-section">
              <div className="section-heading">
                <ProvenanceBadge kind={intelligence ? "editorial" : "ai_inference"} />
                <h2>Build Ideas</h2>
              </div>
              <div className="idea-grid">{repo.buildIdeas.map((idea) => (
                <article className="idea-card" key={idea.id}>
                  <h3><Link href={`/ideas/${idea.slug}`}>{idea.title}</Link></h3>
                  <p>{idea.problem}</p>
                </article>
              ))}</div>
            </section>
          ) : null}

          {repo.health ? (
            <section className="detail-section">
              <div className="section-heading"><span className="tag">Deterministic · {repo.health.version}</span><h2>Project Health</h2></div>
              <div className="metrics-grid">
                <Metric label="Maintenance" value={Math.round(repo.health.maintenance)} />
                <Metric label="Adoption" value={Math.round(repo.health.adoption)} />
                <Metric label="Community" value={Math.round(repo.health.community)} />
                <Metric label="Documentation" value={Math.round(repo.health.documentation)} />
                <Metric label="Operations" value={Math.round(repo.health.operations)} />
                <Metric label="License clarity" value={Math.round(repo.health.licenseClarity)} />
                <Metric label="Maturity" value={Math.round(repo.health.maturity)} />
                <Metric label="Metadata" value={Math.round(repo.health.metadata)} />
              </div>
            </section>
          ) : null}

          <section className="detail-section">
            <div className="section-heading"><ProvenanceBadge kind="source_fact" /><h2>GitHub source facts</h2></div>
            <div className="metrics-grid">
              <Metric label="Stars" value={formatCompactNumber(repo.stars)} />
              <Metric label="Forks" value={formatCompactNumber(repo.forks)} />
              <Metric label="Open issues" value={formatCompactNumber(repo.openIssues)} />
              <Metric label="Watchers" value={formatCompactNumber(repo.watchers)} />
              <Metric label="Language" value={repo.language} />
              <Metric label="License" value={repo.licenseSpdx} />
              <Metric label="Default branch" value={repo.defaultBranch} />
              <Metric label="Snapshot" value={new Date(repo.capturedAt).toLocaleDateString("en-CA")} />
            </div>
          </section>

          <section className="detail-section">
            <div className="section-heading"><ProvenanceBadge kind="source_fact" /><h2>Evidence & provenance</h2></div>
            {repo.sources.length ? <div className="source-list">{repo.sources.map((source) => (
              <a href={source.sourceUrl} rel="noreferrer" key={`${source.documentType}-${source.sourceUrl}`}>
                {source.documentType} · {source.ref ?? "default ref"} · {source.contentHash.slice(0, 10)}…
              </a>
            ))}</div> : <p>No source documents captured yet.</p>}
          </section>
        </section>
      </div>
    </main>
  );
}
