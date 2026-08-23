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
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page repo-detail">
          <p className="eyebrow">Build Idea</p>
          <div className="section-heading"><ProvenanceBadge kind="ai_inference" /><h1>{idea.title}</h1></div>
          <p className="lede">{idea.problem}</p>
          <div className="repo-card__meta">
            <span>{idea.complexity ?? "unknown"} complexity</span>
            {idea.repositoryFullName ? <Link href={`/repos/${idea.repositoryFullName}`}>{idea.repositoryFullName}</Link> : null}
          </div>
          {idea.targetUser ? <section className="detail-section"><h2>Target user</h2><p>{idea.targetUser}</p></section> : null}
          <section className="detail-section">
            <h2>Architecture</h2>
            <pre className="json-panel">{JSON.stringify(idea.architecture, null, 2)}</pre>
          </section>
          <div className="detail-columns">
            <section className="detail-section"><h2>Assumptions</h2><ul>{idea.assumptions.map((item, index) => <li key={index}>{String(item)}</li>)}</ul></section>
            <section className="detail-section"><h2>Risks</h2><ul>{idea.risks.map((item, index) => <li key={index}>{String(item)}</li>)}</ul></section>
          </div>
          <p className="muted">Reviewed AI inference. Validate demand, costs, legal constraints and implementation details before investing.</p>
        </section>
      </div>
    </main>
  );
}
