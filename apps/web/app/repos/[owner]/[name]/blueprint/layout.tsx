import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { getRepository } from "@/lib/data";
import { getRepositoryIntelligence } from "@/lib/intelligence-data";
import { getRepositoryReadiness } from "@/lib/repository-readiness";

export default async function BlueprintReadinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ owner: string; name: string }>;
}) {
  const { owner, name } = await params;
  const [repo, intelligence] = await Promise.all([
    getRepository(owner, name),
    getRepositoryIntelligence(owner, name),
  ]);
  if (!repo || !intelligence) notFound();

  const readiness = getRepositoryReadiness(intelligence);
  if (readiness.stage === "blueprint-ready") return children;

  return (
    <main>
      <div className="page-shell page-shell--wide">
        <SiteHeader />
        <section className="content-page blueprint-page blueprint-page--v2">
          <div className="blueprint-hero blueprint-hero--v2">
            <div>
              <Link className="back-link" href={`/repos/${repo.owner}/${repo.name}`}>← Repository intelligence</Link>
              <p className="eyebrow">Build · readiness gate</p>
              <h1>More evidence is needed before a high-confidence blueprint.</h1>
              <p className="lede">
                This profile is approved and evidence-safe, but it has not reached Blueprint-ready. ThingsO will not turn missing setup, integration, production or security evidence into an implementation plan that looks more certain than the repository evidence supports.
              </p>
              <nav className="blueprint-actions" aria-label="Readiness actions">
                <Link href={`/repos/${repo.owner}/${repo.name}`}>Review repository intelligence</Link>
                <Link href={`/compare?repos=${encodeURIComponent(repo.fullName)}`}>Compare alternatives</Link>
                <a href={repo.githubUrl} rel="noreferrer">Inspect upstream GitHub ↗</a>
              </nav>
            </div>
            <div className="blueprint-meta blueprint-meta--panel">
              <div><span>Current readiness</span><strong>{readiness.label}</strong></div>
              <div><span>Readiness coverage</span><strong>{Math.round(readiness.coverage * 100)}%</strong></div>
              <div><span>Claim confidence</span><strong>{Math.round(intelligence.confidence * 100)}%</strong></div>
              <div><span>Rule</span><strong>Unknown ≠ assumed</strong></div>
            </div>
          </div>

          <section className="blueprint-readiness-gate" aria-labelledby="blueprint-readiness-heading">
            <span className="blueprint-readiness-badge">Blueprint locked by evidence coverage</span>
            <h2 id="blueprint-readiness-heading">Verification backlog</h2>
            <p>Resolve the following evidence gaps before treating this repository as Blueprint-ready:</p>
            <ul>
              {readiness.blockers.slice(0, 7).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        </section>
      </div>
    </main>
  );
}
