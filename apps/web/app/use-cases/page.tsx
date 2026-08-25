import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listReviewedUseCases } from "@/lib/use-case-data";

export const metadata = { title: "Use Cases" };
export const revalidate = 300;

export default async function UseCasesPage() {
  const useCases = await listReviewedUseCases();
  const totalMatches = useCases.reduce((sum, useCase) => sum + useCase.repositoryCount, 0);

  return (
    <main>
      <div className="page-shell page-shell--marketing">
        <SiteHeader />

        <section className="surface-hero surface-hero--usecases">
          <div>
            <p className="eyebrow">Use cases · reviewed fit</p>
            <h1>Start with the job, then choose the software.</h1>
            <p className="lede">
              Each use case is a decision context. Repositories appear only through reviewed source or editorial fit evidence; unreviewed inference is not counted.
            </p>
          </div>
          <div className="usecase-hero-stats" aria-label="Use-case dataset summary">
            <article><span>Decision contexts</span><strong>{useCases.length}</strong><small>active reviewed use cases</small></article>
            <article><span>Reviewed matches</span><strong>{totalMatches}</strong><small>repository-to-use-case relationships</small></article>
            <article><span>Ranking principle</span><strong>Fit first</strong><small>health remains an independent signal</small></article>
          </div>
        </section>

        <section className="usecase-method-strip" aria-label="How use-case discovery works">
          <article><span>01</span><div><strong>Pick the outcome</strong><p>Choose the task or product outcome closest to what you need.</p></div></article>
          <article><span>02</span><div><strong>Inspect reviewed fit</strong><p>See why each repository matches and how strong the fit is.</p></div></article>
          <article><span>03</span><div><strong>Compare operating reality</strong><p>Use health, trade-offs and evidence gaps before committing.</p></div></article>
        </section>

        <section className="surface-section surface-section--usecase-library" aria-labelledby="usecase-library-heading">
          <div className="surface-section__heading">
            <div>
              <p className="eyebrow">Decision library</p>
              <h2 id="usecase-library-heading">Reviewed use-case contexts</h2>
            </div>
            <p>Open a context to see ranked repositories, fit reasoning and provenance. No context is ranked by stars alone.</p>
          </div>
          {useCases.length ? (
            <div className="usecase-library-grid">
              {useCases.map((useCase, index) => (
                <Link className={`usecase-library-card usecase-library-card--${(index % 4) + 1}`} key={useCase.slug} href={`/use-cases/${useCase.slug}`}>
                  <div className="usecase-library-card__topline">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <small>{useCase.repositoryCount} reviewed match{useCase.repositoryCount === 1 ? "" : "es"}</small>
                  </div>
                  <strong>{useCase.title}</strong>
                  <p>{useCase.description ?? "Open this decision context to inspect reviewed repository fit and supporting evidence."}</p>
                  <span className="usecase-library-card__action">View ranked fit →</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state"><strong>No reviewed active use cases yet.</strong></div>
          )}
        </section>
      </div>
    </main>
  );
}
