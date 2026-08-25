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

const journey = [
  ["01", "Discover", "Search by the outcome you want, not by repository popularity."],
  ["02", "Analyze", "Separate source facts, project health and reviewed interpretation."],
  ["03", "Compare", "Put alternatives against the same fit, trade-off and operating criteria."],
  ["04", "Build", "Carry the selected repository into an evidence-backed implementation blueprint."],
] as const;

export const revalidate = 300;

export default async function HomePage() {
  const [repositories, useCases] = await Promise.all([listRepositories(6), listReviewedUseCases()]);
  const searches = useCases.length ? useCases.slice(0, 6).map((item) => item.title) : fallbackSearches;

  return (
    <main>
      <div className="page-shell page-shell--marketing">
        <SiteHeader />

        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero__primary">
            <div className="home-hero__copy">
              <p className="eyebrow">Open-source decision intelligence</p>
              <h1 id="home-title">Choose software with evidence, not guesswork.</h1>
              <p className="lede">
                Describe what you want to build. ThingsO finds relevant open-source projects, explains what is known and unknown, compares operating trade-offs, and helps you move toward implementation.
              </p>
            </div>
            <IntentSearch />
            <div className="intent-chips intent-chips--home" aria-label="Example searches">
              {searches.map((item) => (
                <Link key={item} href={`/search?q=${encodeURIComponent(item)}`}>{item}</Link>
              ))}
            </div>
            <div className="home-proof-strip" aria-label="ThingsO product principles">
              <span><strong>Source-backed</strong> repository facts</span>
              <span><strong>Fit ≠ health</strong> separate decision signals</span>
              <span><strong>Unknown stays visible</strong> no filler</span>
            </div>
          </div>

          <aside className="home-decision-preview" aria-label="ThingsO decision workflow">
            <div className="home-decision-preview__heading">
              <span>Decision workflow</span>
              <strong>Discover → Analyze → Compare → Build</strong>
            </div>
            <div className="journey-stack">
              {journey.map(([number, title, description]) => (
                <article className={`journey-card journey-card--${title.toLowerCase()}`} key={title}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="surface-section surface-section--use-cases" aria-labelledby="usecase-heading">
          <div className="surface-section__heading">
            <div>
              <p className="eyebrow">Start with the job</p>
              <h2 id="usecase-heading">Browse by what you need to accomplish.</h2>
            </div>
            <p>Use cases are reviewed decision contexts. They organize repositories around outcomes rather than stars or trending lists.</p>
          </div>
          {useCases.length ? (
            <div className="home-usecase-grid">
              {useCases.slice(0, 6).map((useCase, index) => (
                <Link className={`home-usecase-card home-usecase-card--${(index % 3) + 1}`} key={useCase.slug} href={`/use-cases/${useCase.slug}`}>
                  <span className="home-usecase-card__count">{useCase.repositoryCount} reviewed repos</span>
                  <strong>{useCase.title}</strong>
                  <span className="home-usecase-card__action">Explore fit →</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="home-usecase-grid">
              {fallbackSearches.map((item, index) => (
                <Link className={`home-usecase-card home-usecase-card--${(index % 3) + 1}`} key={item} href={`/search?q=${encodeURIComponent(item)}`}>
                  <span className="home-usecase-card__count">Intent search</span>
                  <strong>{item}</strong>
                  <span className="home-usecase-card__action">Search repositories →</span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="surface-section surface-section--repositories" aria-labelledby="repos-heading">
          <div className="surface-section__heading">
            <div>
              <p className="eyebrow">Source-backed dataset</p>
              <h2 id="repos-heading">Repository intelligence</h2>
            </div>
            <div className="surface-section__heading-action">
              <p>Scan health, provenance and repository context, then open the profile for decision and technical depth.</p>
              <Link className="button button--accent" href="/discover">Explore discovery →</Link>
            </div>
          </div>
          {repositories.length ? (
            <div className="repo-grid repo-grid--featured">
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
