import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { getUseCase } from "@/lib/data";
import { toRepositoryCard } from "@/lib/view-models";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const result = await getUseCase(slug);
  if (!result) return { title: "Use case not found" };
  return {
    title: result.useCase.title,
    description: result.useCase.description ?? `Compare repositories for ${result.useCase.title}.`,
  };
}

export default async function UseCasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getUseCase(slug);
  if (!result) notFound();
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Use case</p>
          <h1>{result.useCase.title}</h1>
          {result.useCase.description ? <p className="lede">{result.useCase.description}</p> : null}
          <p>{result.useCase.repositoryCount} reviewed matches.</p>
          <div className="repo-grid">
            {result.repositories.map((repo) => (
              <RepositoryCard key={repo.id} repo={toRepositoryCard(repo)} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
