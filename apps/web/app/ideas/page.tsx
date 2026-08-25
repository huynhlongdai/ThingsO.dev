import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listBuildIdeas } from "@/lib/data";

export const metadata = { title: "Build Ideas" };
export const revalidate = 300;

export default async function IdeasPage() {
  const ideas = await listBuildIdeas(48);
  const linkedIdeas = ideas.filter((idea) => idea.repositoryFullName).length;

  return (
    <main>
      <div className="page-shell page-shell--marketing">
        <SiteHeader />

        <section className="surface-hero surface-hero--build">
          <div>
            <p className="eyebrow">Build · reviewed concepts</p>
            <h1>Turn repository intelligence into something worth testing.</h1>
            <p className="lede">
              Build Ideas are reviewed inference grounded in captured repository evidence. They are starting hypotheses—not guaranteed products, businesses or production specifications.
            </p>
          </div>
          <div className="build-hero-stats" aria-label="Build Ideas summary">
            <article><span>Published concepts</span><strong>{ideas.length}</strong><small>reviewed ideas visible in this view</small></article>
            <article><span>Repository-linked</span><strong>{linkedIdeas}</strong><small>ideas tied to a source repository</small></article>
            <article><span>Next step</span><strong>Validate</strong><small>demand, cost, constraints and evidence</small></article>
          </div>
        </section>

        <section className="build-principles" aria-label="Build Idea interpretation">
          <article className="build-principle build-principle--evidence"><span>Evidence</span><strong>Start from what the software can actually support.</strong></article>
          <article className="build-principle build-principle--assumption"><span>Assumptions</span><strong>Keep product hypotheses separate from repository facts.</strong></article>
          <article className="build-principle build-principle--risk"><span>Risk</span><strong>Validate demand and constraints before investing.</strong></article>
        </section>

        <section className="surface-section surface-section--build-library" aria-labelledby="build-library-heading">
          <div className="surface-section__heading">
            <div>
              <p className="eyebrow">Concept library</p>
              <h2 id="build-library-heading">Reviewed Build Ideas</h2>
            </div>
            <p>Use these as structured starting points. Open an idea to inspect the problem, target user, architecture hypothesis, assumptions and risks.</p>
          </div>
          {ideas.length ? (
            <div className="build-idea-grid">
              {ideas.map((idea, index) => (
                <article className={`build-idea-card build-idea-card--${(index % 3) + 1}`} key={idea.id}>
                  <div className="build-idea-card__topline">
                    <span>{idea.complexity ?? "unknown"} complexity</span>
                    <small>Reviewed inference</small>
                  </div>
                  <div className="build-idea-card__body">
                    <h2><Link href={`/ideas/${idea.slug}`}>{idea.title}</Link></h2>
                    <p>{idea.problem}</p>
                  </div>
                  {idea.targetUser ? <div className="build-idea-card__target"><span>Target user</span><strong>{idea.targetUser}</strong></div> : null}
                  <div className="build-idea-card__footer">
                    <span>{idea.repositoryFullName ?? "No repository link published"}</span>
                    <Link href={`/ideas/${idea.slug}`}>Inspect idea →</Link>
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
      </div>
    </main>
  );
}
