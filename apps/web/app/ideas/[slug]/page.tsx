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

export default async function BuildIdeaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const idea = await getBuildIdea(slug);
  if (!idea) notFound();

  return (
    <main>
      <div className="page-shell page-shell--marketing">
        <SiteHeader />

        <section className="build-idea-hero">
          <div>
            <Link className="back-link" href="/ideas">← Build Ideas</Link>
            <div className="build-idea-hero__provenance"><ProvenanceBadge kind="ai_inference" /><span>Reviewed Build Idea</span></div>
            <h1>{idea.title}</h1>
            <p className="lede">{idea.problem}</p>
          </div>
          <aside className="build-idea-hero__meta" aria-label="Build idea metadata">
            <article><span>Complexity</span><strong>{idea.complexity ?? "unknown"}</strong></article>
            <article><span>Repository</span>{idea.repositoryFullName ? <Link href={`/repos/${idea.repositoryFullName}`}>{idea.repositoryFullName}</Link> : <strong>Not linked</strong>}</article>
            <article><span>Status</span><strong>Hypothesis</strong><small>validate before investment</small></article>
          </aside>
        </section>

        <section className="build-idea-warning" aria-label="Build Idea interpretation notice">
          <span>Interpretation boundary</span>
          <p>This page is reviewed inference, not a claim that market demand, economics, legal fit or implementation feasibility have been proven.</p>
        </section>

        <section className="build-workspace">
          <div className="build-workspace__primary">
            {idea.targetUser ? (
              <section className="build-workspace-panel build-workspace-panel--user">
                <div className="build-workspace-panel__heading"><span>01</span><div><p className="eyebrow">Who</p><h2>Target user</h2></div></div>
                <p className="build-workspace-panel__lead">{idea.targetUser}</p>
              </section>
            ) : null}

            <section className="build-workspace-panel build-workspace-panel--architecture">
              <div className="build-workspace-panel__heading"><span>02</span><div><p className="eyebrow">How</p><h2>Architecture hypothesis</h2></div></div>
              <p className="muted">This structure is part of the reviewed idea record. Treat it as a hypothesis until implementation evidence confirms it.</p>
              <details className="build-architecture-drawer" open>
                <summary>View structured architecture</summary>
                <pre className="json-panel">{JSON.stringify(idea.architecture, null, 2)}</pre>
              </details>
            </section>

            <section className="build-workspace-panel build-workspace-panel--validation">
              <div className="build-workspace-panel__heading"><span>03</span><div><p className="eyebrow">Validate</p><h2>Assumptions & risks</h2></div></div>
              <div className="build-validation-grid">
                <article className="build-validation-card build-validation-card--assumptions">
                  <span>Assumptions</span>
                  {idea.assumptions.length ? <ul>{idea.assumptions.map((item, index) => <li key={index}>{String(item)}</li>)}</ul> : <p>No assumptions were published.</p>}
                </article>
                <article className="build-validation-card build-validation-card--risks">
                  <span>Risks</span>
                  {idea.risks.length ? <ul>{idea.risks.map((item, index) => <li key={index}>{String(item)}</li>)}</ul> : <p>No risks were published.</p>}
                </article>
              </div>
            </section>
          </div>

          <aside className="build-workspace__rail">
            <div className="build-next-card">
              <span>Before building</span>
              <strong>Turn the idea into evidence.</strong>
              <ol>
                <li>Validate the user problem.</li>
                <li>Verify repository fit and constraints.</li>
                <li>Test the smallest implementation path.</li>
                <li>Review cost, legal and operational risks.</li>
              </ol>
              {idea.repositoryFullName ? <Link href={`/repos/${idea.repositoryFullName}`}>Open repository intelligence →</Link> : null}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
