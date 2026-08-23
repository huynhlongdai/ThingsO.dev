import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Methodology" };

export default function MethodologyPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page prose-page">
          <p className="eyebrow">Methodology</p>
          <h1>Health is evidence. Fit depends on the job.</h1>
          <p>ThingsO keeps source facts, AI inference and editorial review separate. The Project Health Score is deterministic and versioned; it is not a universal judgement of software quality.</p>
          <h2>Source facts</h2>
          <p>Repository identity, activity, stars, forks, language, license and other factual metadata come from verified source APIs or deterministic processing.</p>
          <h2>AI inference</h2>
          <p>Use cases, limitations, fit reasons and relationship candidates are generated from bounded evidence, labelled as inference, and must pass an independent review gate before becoming public-current analysis.</p>
          <h2>Fit vs health</h2>
          <p>A healthy project can still be a poor fit for a specific build. Search and comparison therefore treat relevance/fit separately from project health.</p>
        </section>
      </div>
    </main>
  );
}
