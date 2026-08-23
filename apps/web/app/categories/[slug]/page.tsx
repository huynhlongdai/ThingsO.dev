import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { getCategory } from "@/lib/data";
import { toRepositoryCard } from "@/lib/view-models";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategory(slug);
  if (!result) return { title: "Category not found" };
  return {
    title: result.term.label,
    description: `Explore ${result.term.repositoryCount} open-source repositories classified under ${result.term.label}.`,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = await getCategory(slug);
  if (!result) notFound();
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Capability</p>
          <h1>{result.term.label}</h1>
          <p className="lede">{result.term.repositoryCount} classified repositories.</p>
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
