import Link from "next/link";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { SiteHeader } from "@/components/site-header";
import { listBuildIdeas } from "@/lib/data";

export const metadata = { title: "Build Ideas" };
export const revalidate = 300;

function complexityLabel(value: string | null) {
  if (!value) return "Unknown";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default async function IdeasPage() {
  const ideas = await listBuildIdeas(48);
  const linkedIdeas = ideas.filter((idea) => idea.repositoryFullName).length;

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page build-ideas-page">
          <div className="surface-hero surface-hero--build">
            <div className="surface-hero__copy">
              <p className="eyebrow">Build · reviewed concepts</p>
              <h1>Turn repository intelligence into something worth building.</h1>
              <p className="lede">
                Build Ideas are reviewed concepts grounded in repository evidence. They are starting hypotheses—not demand validation, financial advice or production specifications.
              </p>
              <div className="surface-hero__actions">
                <Link className="button button--primary" href="/discover">Find source projects</Link>
                <Link className="button" href="/compare">Compare before building</Link>
              </div>
            </div>
            <div className="surface-hero__stats" aria-label="Build idea summary">
              <div><span>Reviewed concepts</span><strong>{ideas.length}</strong><small>Public Build Ideas</small></div>
              <div><span>Linked to repositories</span><strong>{linkedIdeas}</strong><small>Evidence context available</small></div>
              <div><span>Next step</span><strong>Validate</strong><small>Demand, cost, legality and implementation</small></div>
            </div>
          </div>

          <section className="build-trust-strip" aria-label="Build idea maturity">
            <div className="build-trust-strip__item build-trust-strip__item--current">
              <span>01</span><div><strong>Reviewed concept</strong><p>Problem, target user and rough architecture hypothesis.</p></div>
            </div>
            <div className="build-trust-strip__arrow">→</div>
            <div className="build-trust-strip__item">
              <span>02</span><div><strong>Repository blueprint</strong><p>Evidence-backed implementation path for a selected current repository.</p></div>
            </div>
            <div className="build-trust-strip__arrow">→</div>
            <div className="build-trust-strip__item">
              <span>03</span><div><strong>Your validation</strong><p>Real user demand, economics, legal constraints and production proof.</p></div>
            </div>
          </section>

          <section className="surface-section" aria-labelledby="build-ideas-heading">
            <div className="surface-section__heading">
              <div>
                <p className="eyebrow">Concept library</p>
                <h2 id="build-ideas-heading">Reviewed starting points.</h2>
              </div>
              <p>Open a concept to see its problem, target user, architecture hypothesis, assumptions and risks. Treat each one as a prompt for validation rather than a guaranteed opportunity.</p>
            </div>

            {ideas.length ? (
              <div className="build-idea-grid-v2">
                {ideas.map((idea) => (
                  <article className="build-idea-card-v2" key={idea.id}>
                    <div className="build-idea-card-v2__topline">
                      <ProvenanceBadge kind="ai_inference" />
                      <span className={`complexity-pill complexity-pill--${idea.complexity ?? "unknown"}`}>
                        {complexityLabel(idea.complexity)} complexity
                      </span>
                    </div>
                    <h3><Link href={`/ideas/${idea.slug}`}>{idea.title}</Link></h3>
                    <p className="build-idea-card-v2__problem">{idea.problem}</p>
                    <div className="build-idea-card-v2__context">
                      <span>Target user</span>
                      <strong>{idea.targetUser ?? "Not established"}</strong>
                    </div>
                    <div className="build-idea-card-v2__footer">
                      <span>{idea.repositoryFullName ?? "No primary repository linked"}</span>
                      <Link href={`/ideas/${idea.slug}`}>Review concept →</Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <strong>No reviewed Build Ideas have been published yet.</strong>
                <p>They appear only after repository enrichment passes the independent review gate.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
