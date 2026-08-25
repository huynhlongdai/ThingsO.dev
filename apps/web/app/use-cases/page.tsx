import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listReviewedUseCases } from "@/lib/use-case-data";

export const metadata = { title: "Use Cases" };
export const revalidate = 300;

export default async function UseCasesPage() {
  const useCases = await listReviewedUseCases();
  const reviewedMatches = useCases.reduce((total, item) => total + item.repositoryCount, 0);

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page use-cases-page">
          <div className="surface-hero surface-hero--use-cases">
            <div className="surface-hero__copy">
              <p className="eyebrow">Use cases · reviewed fit</p>
              <h1>Start with the job. Then choose the software.</h1>
              <p className="lede">
                Browse concrete jobs-to-be-done instead of guessing repository names. Every public match is backed by reviewed source or editorial fit evidence.
              </p>
              <div className="surface-hero__actions">
                <Link className="button button--primary" href="/search">Search by intent</Link>
                <Link className="button" href="/compare">Compare repositories</Link>
              </div>
            </div>
            <div className="surface-hero__stats" aria-label="Use case dataset summary">
              <div><span>Active use cases</span><strong>{useCases.length}</strong><small>Reviewed public jobs</small></div>
              <div><span>Reviewed matches</span><strong>{reviewedMatches}</strong><small>Repository-to-job links</small></div>
              <div><span>Ranking rule</span><strong>Fit first</strong><small>Health remains a separate signal</small></div>
            </div>
          </div>

          <section className="surface-section" aria-labelledby="use-case-catalog-heading">
            <div className="surface-section__heading">
              <div>
                <p className="eyebrow">Job-to-be-done catalog</p>
                <h2 id="use-case-catalog-heading">Choose the outcome you need.</h2>
              </div>
              <p>Open a use case to see ranked repositories, reviewed fit reasons, source-backed health and a direct path into comparison.</p>
            </div>

            {useCases.length ? (
              <div className="use-case-catalog-grid">
                {useCases.map((useCase, index) => (
                  <article className="use-case-catalog-card" key={useCase.slug}>
                    <div className="use-case-catalog-card__topline">
                      <span>Use case {String(index + 1).padStart(2, "0")}</span>
                      <strong>{useCase.repositoryCount} reviewed</strong>
                    </div>
                    <h3><Link href={`/use-cases/${useCase.slug}`}>{useCase.title}</Link></h3>
                    <p>{useCase.description ?? "Reviewed repository fit for this job-to-be-done."}</p>
                    <div className="use-case-catalog-card__footer">
                      <span>Reviewed fit evidence</span>
                      <Link href={`/use-cases/${useCase.slug}`}>View ranked fit →</Link>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><strong>No reviewed active use cases yet.</strong></div>
            )}
          </section>

          <section className="decision-explainer" aria-label="How use case ranking works">
            <div><span>01</span><strong>Describe the outcome</strong><p>Start from the work you need done rather than popularity.</p></div>
            <div><span>02</span><strong>Review fit evidence</strong><p>ThingsO shows why a repository matches and how confident that match is.</p></div>
            <div><span>03</span><strong>Compare operating reality</strong><p>Use health, deployment, limitations and trade-offs before committing.</p></div>
          </section>
        </section>
      </div>
    </main>
  );
}
