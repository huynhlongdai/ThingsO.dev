import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProvenanceBadge } from "@/components/provenance-badge";
import { SiteHeader } from "@/components/site-header";
import { getBuildIdea } from "@/lib/data";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const idea = await getBuildIdea(slug);
  if (!idea) return { title: "Build Idea not found" };
  return { title: idea.title, description: idea.problem };
}

function readableLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function stringifyArchitectureValue(value: unknown): string {
  if (value === null || value === undefined) return "Not established";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => stringifyArchitectureValue(item)).join(" · ");
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([key, item]) => `${readableLabel(key)}: ${stringifyArchitectureValue(item)}`)
      .join(" · ");
  }
  return String(value);
}

function architectureEntries(value: unknown): Array<[string, string]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).map(([key, item]) => [readableLabel(key), stringifyArchitectureValue(item)]);
}

export default async function BuildIdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getBuildIdea(slug);
  if (!idea) notFound();

  const architecture = architectureEntries(idea.architecture);
  const repositoryHref = idea.repositoryFullName ? `/repos/${idea.repositoryFullName}` : null;

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page build-idea-detail-page">
          <div className="surface-hero surface-hero--idea-detail">
            <div className="surface-hero__copy">
              <Link className="back-link" href="/ideas">← All Build Ideas</Link>
              <div className="build-idea-detail__provenance"><ProvenanceBadge kind="ai_inference" /><span>Reviewed concept</span></div>
              <p className="eyebrow">Build Idea</p>
              <h1>{idea.title}</h1>
              <p className="lede">{idea.problem}</p>
              <div className="surface-hero__actions">
                {repositoryHref ? <Link className="button button--primary" href={repositoryHref}>Open source repository</Link> : null}
                {idea.repositoryFullName ? (
                  <Link className="button" href={`/compare?repos=${encodeURIComponent(idea.repositoryFullName)}`}>Compare source project</Link>
                ) : null}
              </div>
            </div>
            <div className="surface-hero__stats" aria-label="Build idea status">
              <div><span>Status</span><strong>Concept</strong><small>Reviewed inference, not production specification</small></div>
              <div><span>Complexity</span><strong>{idea.complexity ?? "Unknown"}</strong><small>Validate against real implementation</small></div>
              <div><span>Primary repository</span><strong>{idea.repositoryFullName ?? "None"}</strong><small>Evidence context when linked</small></div>
            </div>
          </div>

          <section className="build-idea-callout" aria-label="Build idea disclaimer">
            <div className="build-idea-callout__icon">!</div>
            <div>
              <strong>This is a hypothesis to validate.</strong>
              <p>Confirm user demand, implementation cost, legal constraints and technical feasibility before investing meaningful time or money.</p>
            </div>
          </section>

          {idea.targetUser ? (
            <section className="surface-section build-idea-target" aria-labelledby="target-user-heading">
              <div className="surface-section__heading">
                <div><p className="eyebrow">Who it is for</p><h2 id="target-user-heading">Target user</h2></div>
                <p>Use this as the first interview segment, not as proof that demand already exists.</p>
              </div>
              <div className="build-idea-target__value">{idea.targetUser}</div>
            </section>
          ) : null}

          <section className="surface-section" aria-labelledby="architecture-hypothesis-heading">
            <div className="surface-section__heading">
              <div><p className="eyebrow">System hypothesis</p><h2 id="architecture-hypothesis-heading">Architecture</h2></div>
              <p>A readable interpretation of the reviewed concept architecture. Implementation details still need validation against the linked repository and your own product constraints.</p>
            </div>
            {architecture.length ? (
              <div className="build-architecture-grid">
                {architecture.map(([label, value]) => (
                  <article className="build-architecture-card" key={label}>
                    <span>{label}</span>
                    <p>{value}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><strong>No structured architecture hypothesis is established.</strong></div>
            )}
          </section>

          <section className="surface-section" aria-labelledby="validation-heading">
            <div className="surface-section__heading">
              <div><p className="eyebrow">Validation gates</p><h2 id="validation-heading">Assumptions & risks</h2></div>
              <p>These are the parts of the concept most likely to invalidate the idea or change the implementation plan.</p>
            </div>
            <div className="validation-split">
              <article className="validation-panel validation-panel--assumption">
                <div className="validation-panel__label">Assumptions to test</div>
                {idea.assumptions.length ? <ul>{idea.assumptions.map((item, index) => <li key={index}>{String(item)}</li>)}</ul> : <p>No assumptions listed.</p>}
              </article>
              <article className="validation-panel validation-panel--risk">
                <div className="validation-panel__label">Risks to resolve</div>
                {idea.risks.length ? <ul>{idea.risks.map((item, index) => <li key={index}>{String(item)}</li>)}</ul> : <p>No risks listed.</p>}
              </article>
            </div>
          </section>

          <section className="build-next-step">
            <div><p className="eyebrow">Next step</p><h2>Move from idea to evidence.</h2><p>Inspect the source repository, compare alternatives, then use a repository blueprint for implementation-specific evidence.</p></div>
            <div className="build-next-step__actions">
              {repositoryHref ? <Link className="button button--primary" href={repositoryHref}>Repository intelligence</Link> : <Link className="button button--primary" href="/discover">Find repositories</Link>}
              {idea.repositoryFullName ? <Link className="button" href={`/repos/${idea.repositoryFullName}/blueprint`}>Open blueprint</Link> : null}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
