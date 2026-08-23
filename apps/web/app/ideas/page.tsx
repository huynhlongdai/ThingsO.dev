import { SiteHeader } from "@/components/site-header";

export const metadata = { title: "Build Ideas" };

export default function IdeasPage() {
  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Build Ideas</p>
          <h1>Move from interesting software to something useful you can build.</h1>
          <p className="lede">Reviewed Build Ideas will combine a problem, target user, architecture, candidate repositories, assumptions, complexity and risks. They are suggestions—not guaranteed businesses.</p>
          <div className="idea-placeholder">
            <strong>Example</strong>
            <h2>Affiliate product → short-form video workflow</h2>
            <p>Product data → script generation → voice/media → rendering → publishing workflow.</p>
            <span>Structured Build Ideas arrive after the AI evidence pipeline is review-gated.</span>
          </div>
        </section>
      </div>
    </main>
  );
}
