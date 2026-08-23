import { getAdminOverview, listRecentFailedJobs } from "@/lib/admin-data";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [overview, failedJobs] = await Promise.all([
    getAdminOverview(),
    listRecentFailedJobs(),
  ]);

  if (!overview) {
    return (
      <main className="page-shell content-page">
        <p className="eyebrow">Operations</p>
        <h1>Admin database is not configured.</h1>
      </main>
    );
  }

  const metrics = [
    ["Repositories", overview.repositories],
    ["Snapshots", overview.snapshots],
    ["Scored", overview.scoredRepositories],
    ["AI approved", overview.approvedAnalyses],
    ["AI pending", overview.pendingAnalyses],
    ["AI rejected", overview.rejectedAnalyses],
    ["Jobs pending", overview.pendingJobs],
    ["Jobs running", overview.runningJobs],
    ["Jobs failed", overview.failedJobs],
    ["Jobs completed", overview.completedJobs],
    ["Feedback", overview.feedbackItems],
  ] as const;

  return (
    <main>
      <div className="page-shell content-page">
        <p className="eyebrow">ThingsO Operations</p>
        <h1>Admin control plane</h1>
        <div className="admin-metrics">
          {metrics.map(([label, value]) => (
            <article key={label} className="admin-metric">
              <span>{label}</span>
              <strong>{value.toLocaleString()}</strong>
            </article>
          ))}
        </div>

        <section className="section-block">
          <h2>Recent failed jobs</h2>
          {failedJobs.length === 0 ? (
            <p className="lede">No failed jobs.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr><th>Type</th><th>Attempts</th><th>Error</th><th>Updated</th></tr>
                </thead>
                <tbody>
                  {failedJobs.map((job) => (
                    <tr key={job.id}>
                      <td>{job.job_type}</td>
                      <td>{job.attempt_count}</td>
                      <td>{job.error ?? "Unknown"}</td>
                      <td>{new Date(job.updated_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
