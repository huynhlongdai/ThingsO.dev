import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listBuildIdeas } from "@/lib/data";

export const metadata = { title: "Build Ideas" };
export const revalidate = 300;

export default async function IdeasPage() {
  const ideas = await listBuildIdeas(48);
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Build Ideas</p>
          <h1>Move from interesting software to something useful you can build.</h1>
          <p className="lede">
            These are reviewed AI inferences grounded in captured repository evidence—not guaranteed businesses.
          </p>
          <div className="idea-grid">
            {ideas.length ? ideas.map((idea) => (
              <article className="idea-card" key={idea.id}>
                <div className="repo-card__meta">
                  <span>{idea.complexity ?? "unknown"} complexity</span>
                  {idea.repositoryFullName ? <span>{idea.repositoryFullName}</span> : null}
                </div>
                <h2><Link href={`/ideas/${idea.slug}`}>{idea.title}</Link></h2>
                <p>{idea.problem}</p>
                {idea.targetUser ? <p><strong>For:</strong> {idea.targetUser}</p> : null}
              </article>
            )) : (
              <div className="empty-state">
                <strong>No reviewed Build Ideas have been published yet.</strong>
                <p>They appear only after repository enrichment passes the independent review gate.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
