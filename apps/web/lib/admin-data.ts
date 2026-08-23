import { isDatabaseConfigured, query } from "@/lib/db";

export type AdminOverview = {
  repositories: number;
  snapshots: number;
  scoredRepositories: number;
  approvedAnalyses: number;
  pendingAnalyses: number;
  rejectedAnalyses: number;
  queuedJobs: number;
  runningJobs: number;
  failedJobs: number;
  succeededJobs: number;
  feedbackItems: number;
};

function numberValue(value: string | number | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  if (!isDatabaseConfigured()) return null;
  const rows = await query<Record<string, string | number>>(
    `SELECT
      (SELECT count(*) FROM repositories) AS repositories,
      (SELECT count(*) FROM repository_snapshots) AS snapshots,
      (SELECT count(DISTINCT repository_id) FROM repository_scores WHERE score_version = 'health-v1') AS scored_repositories,
      (SELECT count(*) FROM ai_analyses WHERE analysis_type = 'repository_enrichment' AND review_status = 'approved') AS approved_analyses,
      (SELECT count(*) FROM ai_analyses WHERE analysis_type = 'repository_enrichment' AND review_status IN ('pending','human_review')) AS pending_analyses,
      (SELECT count(*) FROM ai_analyses WHERE analysis_type = 'repository_enrichment' AND review_status = 'rejected') AS rejected_analyses,
      (SELECT count(*) FROM ingestion_jobs WHERE status IN ('queued','retry')) AS queued_jobs,
      (SELECT count(*) FROM ingestion_jobs WHERE status = 'running') AS running_jobs,
      (SELECT count(*) FROM ingestion_jobs WHERE status IN ('failed','dead')) AS failed_jobs,
      (SELECT count(*) FROM ingestion_jobs WHERE status = 'succeeded') AS succeeded_jobs,
      (SELECT count(*) FROM feedback) AS feedback_items`,
  );
  const row = rows[0];
  if (!row) return null;
  return {
    repositories: numberValue(row.repositories),
    snapshots: numberValue(row.snapshots),
    scoredRepositories: numberValue(row.scored_repositories),
    approvedAnalyses: numberValue(row.approved_analyses),
    pendingAnalyses: numberValue(row.pending_analyses),
    rejectedAnalyses: numberValue(row.rejected_analyses),
    queuedJobs: numberValue(row.queued_jobs),
    runningJobs: numberValue(row.running_jobs),
    failedJobs: numberValue(row.failed_jobs),
    succeededJobs: numberValue(row.succeeded_jobs),
    feedbackItems: numberValue(row.feedback_items),
  };
}

export async function listRecentFailedJobs(limit = 20) {
  if (!isDatabaseConfigured()) return [];
  return query<{
    id: string;
    job_type: string;
    status: string;
    error: string | null;
    attempt_count: number;
    updated_at: string;
  }>(
    `SELECT id, job_type, status, error, attempt_count, updated_at
     FROM ingestion_jobs
     WHERE status IN ('failed','dead')
     ORDER BY updated_at DESC
     LIMIT $1`,
    [Math.max(1, Math.min(limit, 100))],
  );
}
