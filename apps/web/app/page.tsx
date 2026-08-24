import Link from "next/link";
import { IntentSearch } from "@/components/intent-search";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { listRepositories } from "@/lib/data";
import { listReviewedUseCases } from "@/lib/use-case-data";
import { toRepositoryCard } from "@/lib/view-models";

const fallbackSearches = [
  "AI browser agent",
  "Automate content workflows",
  "Extract structured web data",
  "Self-host an AI stack",
  "Generate short-form video",
  "Build an internal developer tool",
];

export const revalidate = 300;

export default async function HomePage() {
  const [repositories, useCases] = await Promise.all([listRepositories(6), listReviewedUseCases()]);
  const searches = useCases.length ? useCases.slice(0, 6).map((item) => item.title) : fallbackSearches;

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="hero">
          <p className="eyebrow">Open-source decision intelligence</p>
          <h1>Find the right software to build anything.</h1>
          <p className="lede">
            Describe what you want to build. ThingsO helps you discover relevant projects, understand their health and trade-offs, compare alternatives, and move toward an implementation plan.
          </p>
          <IntentSearch />
          <div className="intent-chips" aria-label="Example searches">
            {searches.map((item) => (
              <Link key={item} href={`/search?q=${encodeURIComponent(item)}`}>{item}</Link>
            ))}
          </div>
        </section>

        <section className="section-block" aria-labelledby="why-heading">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Decision first</p>
              <h2 id="why-heading">Not another repository directory.</h2>
            </div>
            <p>ThingsO separates source facts from interpretation and optimizes for fit-by-use-case rather than raw popularity.</p>
          </div>
          <div className="principle-grid">
            <article><strong>Discover</strong><span>Search by what you want to accomplish.</span></article>
            <article><strong>Analyze</strong><span>See factual health signals and evidence-backed interpretation.</span></article>
            <article><strong>Compare</strong><span>Evaluate alternatives against the same decision criteria.</span></article>
            <article><strong>Build</strong><span>Turn a selected stack into reviewed Build Ideas and blueprints.</span></article>
          </div>
        </section>

        <section className="section-block" aria-labelledby="repos-heading">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">Source-backed dataset</p>
              <h2 id="repos-heading">Repository intelligence</h2>
            </div>
            <Link className="text-link" href="/discover">Explore discovery →</Link>
          </div>
          {repositories.length ? (
            <div className="repo-grid">
              {repositories.map((repo) => <RepositoryCard key={repo.id} repo={toRepositoryCard(repo)} />)}
            </div>
          ) : (
            <div className="empty-state">
              <strong>Dataset is ready for ingestion.</strong>
              <p>The UI does not substitute demo facts when the database has not been populated.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}