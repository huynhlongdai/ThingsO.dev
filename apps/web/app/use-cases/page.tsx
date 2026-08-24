import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listReviewedUseCases } from "@/lib/use-case-data";

export const metadata = { title: "Use Cases" };
export const revalidate = 300;

export default async function UseCasesPage() {
  const useCases = await listReviewedUseCases();
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Use cases · reviewed fit</p>
          <h1>Find software by the job you need done.</h1>
          <p className="lede">
            Matches are ranked from reviewed source or editorial fit evidence. Proposed or unreviewed inference is not counted.
          </p>
          <div className="idea-grid">
            {useCases.length ? useCases.map((useCase) => (
              <article className="idea-card" key={useCase.slug}>
                <h2><Link href={`/use-cases/${useCase.slug}`}>{useCase.title}</Link></h2>
                {useCase.description ? <p>{useCase.description}</p> : null}
                <span>{useCase.repositoryCount} reviewed matches</span>
              </article>
            )) : (
              <div className="empty-state"><strong>No reviewed active use cases yet.</strong></div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
