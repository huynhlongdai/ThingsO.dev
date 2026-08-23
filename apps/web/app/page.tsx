import Link from "next/link";
import { IntentSearch } from "@/components/intent-search";
import { RepositoryCard } from "@/components/repository-card";
import { SiteHeader } from "@/components/site-header";
import { demoRepositories } from "@/lib/demo-repositories";

const useCases = [
  "AI browser agent",
  "Automate content workflows",
  "Extract structured web data",
  "Self-host an AI stack",
  "Generate short-form video",
  "Build an internal developer tool",
];

export default function HomePage() {
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
            {useCases.map((item) => (
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
              <p className="eyebrow">Preview dataset</p>
              <h2 id="repos-heading">Example repository intelligence</h2>
            </div>
            <Link className="text-link" href="/discover">Explore discovery →</Link>
          </div>
          <div className="repo-grid">
            {demoRepositories.map((repo) => <RepositoryCard key={`${repo.owner}/${repo.name}`} repo={repo} />)}
          </div>
          <p className="demo-note">Preview values are UI fixtures only. Public repository pages will use source-derived facts and reviewed analysis from the data pipeline.</p>
        </section>
      </div>
    </main>
  );
}
