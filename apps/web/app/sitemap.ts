import type { MetadataRoute } from "next";
import { listBuildIdeas, listRepositories, listTaxonomyTerms, listUseCases } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const staticRoutes = ["", "/discover", "/use-cases", "/compare", "/ideas", "/about/methodology"];
  const routes: MetadataRoute.Sitemap = staticRoutes.map((route) => ({ url: `${base}${route}` }));

  try {
    const [repositories, categories, useCases, ideas] = await Promise.all([
      listRepositories(100),
      listTaxonomyTerms("capability"),
      listUseCases(),
      listBuildIdeas(100),
    ]);
    routes.push(
      ...repositories.map((repo) => ({ url: `${base}/repos/${repo.owner}/${repo.name}` })),
      ...categories.map((category) => ({ url: `${base}/categories/${category.slug}` })),
      ...useCases.map((useCase) => ({ url: `${base}/use-cases/${useCase.slug}` })),
      ...ideas.map((idea) => ({ url: `${base}/ideas/${idea.slug}` })),
    );
  } catch {
    // Static routes remain indexable while the database is unavailable during deployment.
  }
  return routes;
}
