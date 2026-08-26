import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Methodology" };

const healthDimensions = [
  ["Maintenance", "Recent activity and repository upkeep"],
  ["Adoption", "Usage and ecosystem signals"],
  ["Community", "Contributor and collaboration signals"],
  ["Documentation", "Documentation presence and completeness"],
  ["Operations", "Operational/project hygiene signals"],
  ["Maturity", "Project age and stability context"],
  ["License clarity", "Whether licensing is detected clearly"],
  ["Metadata", "Repository metadata completeness"],
] as const;

const readinessStages = [
  ["Evidence-safe", "Reviewed and safe to display, with Unknowns preserved."],
  ["Analyzed", "Enough repository-specific evidence for meaningful technical analysis."],
  ["Decision-ready", "Enough fit, trade-off, architecture and operating evidence for an adoption discussion."],
  ["Blueprint-ready", "Enough implementation, integration, production and security evidence for a higher-confidence execution guide."],
] as const;

export default function MethodologyPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page methodology-page">
          <div className="surface-hero surface-hero--methodology">
            <div className="surface-hero__copy">
              <p className="eyebrow">Methodology · trust model</p>
              <h1>Know what ThingsO knows—and what it does not.</h1>
              <p className="lede">
                ThingsO separates verified source facts, deterministic project health, reviewed interpretation, readiness and explicit unknowns so a polished interface never hides uncertainty.
              </p>
              <div className="surface-hero__actions">
                <Link className="button button--primary" href="/discover">Explore repositories</Link>
                <Link className="button" href="/compare">See decision comparison</Link>
              </div>
            </div>
            <div className="surface-hero__stats" aria-label="Methodology principles">
              <div><span>Source facts</span><strong>Observed</strong><small>GitHub/API or deterministic evidence</small></div>
              <div><span>Fit</span><strong>Contextual</strong><small>Depends on the job-to-be-done</small></div>
              <div><span>Readiness</span><strong>Completeness</strong><small>Separate from claim confidence</small></div>
            </div>
          </div>

          <section className="surface-section" aria-labelledby="trust-stack-heading">
            <div className="surface-section__heading">
              <div><p className="eyebrow">Trust stack</p><h2 id="trust-stack-heading">Four layers, four different meanings.</h2></div>
              <p>A number or sentence only becomes useful when you know where it came from, how it was produced and how much uncertainty remains.</p>
            </div>
            <div className="trust-stack-grid">
              <article className="trust-layer trust-layer--source">
                <div className="trust-layer__number">01</div>
                <span>Source facts</span>
                <h3>Observed repository evidence</h3>
                <p>Identity, activity, stars, forks, language, license, repository tree, manifests, CI and other captured source material.</p>
                <small>Displayed as source facts</small>
              </article>
              <article className="trust-layer trust-layer--health">
                <div className="trust-layer__number">02</div>
                <span>Deterministic health</span>
                <h3>Versioned project condition</h3>
                <p>A reproducible score built from source signals. It describes project condition—not universal software quality and not use-case fit.</p>
                <small>Same evidence → same score version</small>
              </article>
              <article className="trust-layer trust-layer--reviewed">
                <div className="trust-layer__number">03</div>
                <span>Reviewed intelligence</span>
                <h3>Evidence-backed interpretation</h3>
                <p>Problem, architecture, fit, limitations, decision criteria and other interpretation can be published only after review and provenance checks.</p>
                <small>Clearly labelled interpretation</small>
              </article>
              <article className="trust-layer trust-layer--unknown">
                <div className="trust-layer__number">04</div>
                <span>Unknown</span>
                <h3>Missing evidence stays missing</h3>
                <p>If the evidence pack cannot establish a claim, ThingsO shows the gap instead of fabricating completeness from a category template.</p>
                <small>A visible question is safer than a false answer</small>
              </article>
            </div>
          </section>

          <section className="readiness-methodology" aria-labelledby="readiness-heading">
            <div className="readiness-methodology__intro">
              <p className="eyebrow">Repository Readiness v1</p>
              <h2 id="readiness-heading">Approved does not mean complete.</h2>
              <p>An approved profile is evidence-safe to display. Readiness is a separate deterministic measure of whether that current profile is complete enough for analysis, adoption decisions or implementation planning.</p>
            </div>
            <div className="readiness-methodology__stages">
              {readinessStages.map(([name, description], index) => (
                <article key={name}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{name}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <div className="readiness-methodology__distinction">
              <p><strong>Claim confidence</strong><span>How strongly the published interpretation is supported.</span></p>
              <b>≠</b>
              <p><strong>Readiness coverage</strong><span>How many adoption/implementation evidence checks are actually established.</span></p>
            </div>
          </section>

          <section className="methodology-contrast" aria-labelledby="fit-health-heading">
            <div className="methodology-contrast__heading">
              <p className="eyebrow">Core distinction</p>
              <h2 id="fit-health-heading">Fit is not health.</h2>
            </div>
            <div className="methodology-contrast__grid">
              <article className="methodology-card methodology-card--fit">
                <span>Fit score</span>
                <h3>“Can this satisfy my job?”</h3>
                <p>Context-specific suitability for a use case or query. A project can fit one job well and another poorly.</p>
                <ul><li>Use-case scoped</li><li>Reason/provenance attached</li><li>Never a universal winner</li></ul>
              </article>
              <div className="methodology-vs">≠</div>
              <article className="methodology-card methodology-card--health">
                <span>Project Health Score</span>
                <h3>“What condition is the project in?”</h3>
                <p>Deterministic repository signals describing maintenance, adoption, community, documentation and related dimensions.</p>
                <ul><li>Versioned formula</li><li>Source-derived</li><li>Independent from user intent</li></ul>
              </article>
            </div>
          </section>

          <section className="surface-section" aria-labelledby="health-heading">
            <div className="surface-section__heading">
              <div><p className="eyebrow">Health model</p><h2 id="health-heading">What the score looks at.</h2></div>
              <p>The Project Health Score is a deterministic evidence summary. It is useful context for adoption, but it is deliberately not labelled a universal “repo quality” score.</p>
            </div>
            <div className="health-dimension-grid">
              {healthDimensions.map(([name, description]) => (
                <article key={name}><span>Source-derived dimension</span><h3>{name}</h3><p>{description}</p></article>
              ))}
            </div>
          </section>

          <section className="surface-section" aria-labelledby="publication-heading">
            <div className="surface-section__heading">
              <div><p className="eyebrow">Publication pipeline</p><h2 id="publication-heading">How interpretation reaches the product.</h2></div>
              <p>Public intelligence is versioned and bound to repository evidence. Publication gates are designed to reject invalid or duplicated semantic content before it becomes current analysis.</p>
            </div>
            <div className="methodology-pipeline">
              <div><span>01</span><strong>Capture</strong><p>Repository source facts and bounded evidence.</p></div>
              <b>→</b>
              <div><span>02</span><strong>Derive</strong><p>Deterministic health and technical facts.</p></div>
              <b>→</b>
              <div><span>03</span><strong>Interpret</strong><p>Repository-specific intelligence from available evidence.</p></div>
              <b>→</b>
              <div><span>04</span><strong>Review</strong><p>Schema, provenance, semantic and current-snapshot gates.</p></div>
              <b>→</b>
              <div><span>05</span><strong>Publish</strong><p>Evidence-safe public-current profile with Unknowns intact.</p></div>
            </div>
          </section>

          <section className="methodology-boundaries" aria-labelledby="boundaries-heading">
            <div><p className="eyebrow">Boundaries</p><h2 id="boundaries-heading">What ThingsO does not claim.</h2></div>
            <div className="methodology-boundaries__grid">
              <p><strong>Not a security audit.</strong><span>Security claims appear only when evidence supports them; missing security evidence remains explicit.</span></p>
              <p><strong>Not legal advice.</strong><span>Detected license information is context, not a guarantee of commercial-use obligations.</span></p>
              <p><strong>Not a universal “best repo” list.</strong><span>Recommendations must be scoped to a use case and supported by evidence.</span></p>
              <p><strong>Not demand validation.</strong><span>Build Ideas are reviewed hypotheses. Real users and economics still need validation.</span></p>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
