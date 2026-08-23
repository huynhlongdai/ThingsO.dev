import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { listUseCases } from "@/lib/data";

export const metadata = { title: "Use Cases" };
export const revalidate = 300;

export default async function UseCasesPage() {
  const useCases = await listUseCases();
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Use cases</p>
          <h1>Find software by the job you need done.</h1>
          <div className="idea-grid">
            {useCases.length ? useCases.map((useCase) => (
              <article className="idea-card" key={useCase.slug}>
                <h2><Link href={`/use-cases/${useCase.slug}`}>{useCase.title}</Link></h2>
                {useCase.description ? <p>{useCase.description}</p> : null}
                <span>{useCase.repositoryCount} matched repositories</span>
              </article>
            )) : (
              <div className="empty-state"><strong>No active use cases yet.</strong></div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
