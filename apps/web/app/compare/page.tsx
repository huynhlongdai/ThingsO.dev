import Link from "next/link";
import { HealthScore } from "@/components/health-score";
import { SiteHeader } from "@/components/site-header";
import { getCompareRepositories } from "@/lib/data";
import { formatCompactNumber } from "@/lib/view-models";

export const metadata = { title: "Compare" };
export const dynamic = "force-dynamic";

function readRepositoryNames(value: string | undefined): string[] {
  return (value ?? "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 4);
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ repos?: string }>;
}) {
  const params = await searchParams;
  const names = readRepositoryNames(params.repos);
  const repositories = await getCompareRepositories(names);

  return (
    <main>
      <div className="page-shell">
        <SiteHeader />
        <section className="content-page">
          <p className="eyebrow">Compare</p>
          <h1>Compare evidence, not star counts alone.</h1>
          <p className="lede">Add up to four repositories with <code>?repos=owner/name,owner/name</code>.</p>
          {repositories.length ? (
            <div className="compare-table-wrap">
              <table className="compare-table">
                <thead><tr><th>Signal</th>{repositories.map((repo) => <th key={repo.id}><Link href={`/repos/${repo.owner}/${repo.name}`}>{repo.fullName}</Link></th>)}</tr></thead>
                <tbody>
                  <tr><th>Health</th>{repositories.map((repo) => <td key={repo.id}><HealthScore score={repo.healthScore} /></td>)}</tr>
                  <tr><th>Stars</th>{repositories.map((repo) => <td key={repo.id}>{formatCompactNumber(repo.stars)}</td>)}</tr>
                  <tr><th>Language</th>{repositories.map((repo) => <td key={repo.id}>{repo.language ?? "—"}</td>)}</tr>
                  <tr><th>License</th>{repositories.map((repo) => <td key={repo.id}>{repo.licenseSpdx ?? "—"}</td>)}</tr>
                  <tr><th>Open issues</th>{repositories.map((repo) => <td key={repo.id}>{formatCompactNumber(repo.openIssues)}</td>)}</tr>
                  <tr><th>Reviewed AI summary</th>{repositories.map((repo) => <td key={repo.id}>{repo.analysis?.summary ?? "Not reviewed yet"}</td>)}</tr>
                  <tr><th>Capabilities</th>{repositories.map((repo) => <td key={repo.id}>{repo.taxonomy.filter((item) => item.axis === "capability").map((item) => item.label).join(", ") || "—"}</td>)}</tr>
                  <tr><th>Top use-case fit</th>{repositories.map((repo) => <td key={repo.id}>{repo.useCases[0] ? `${repo.useCases[0].title} · ${Math.round(repo.useCases[0].fitScore * 100)}%` : "—"}</td>)}</tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <strong>Select repositories to compare.</strong>
              <p>Open any repository detail page and use Compare, then add another repository to the URL.</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
