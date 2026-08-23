import { isDatabaseConfigured, query } from "@/lib/db";

export type AdminOverview = {
  repositories: number;
  snapshots: number;
  scoredRepositories: number;
  approvedAnalyses: number;
  pendingAnalyses: number;
  rejectedAnalyses: number;
  pendingJobs: number;
  runningJobs: number;
  failedJobs: number;
  completedJobs: number;
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
      (SELECT count(*) FROM ai_analyses WHERE analysis_type = 'repository_enrichment' AND review_status = 'pending') AS pending_analyses,
      (SELECT count(*) FROM ai_analyses WHERE analysis_type = 'repository_enrichment' AND review_status = 'rejected') AS rejected_analyses,
      (SELECT count(*) FROM ingestion_jobs WHERE status = 'pending') AS pending_jobs,
      (SELECT count(*) FROM ingestion_jobs WHERE status = 'running') AS running_jobs,
      (SELECT count(*) FROM ingestion_jobs WHERE status = 'failed') AS failed_jobs,
      (SELECT count(*) FROM ingestion_jobs WHERE status = 'completed') AS completed_jobs,
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
    pendingJobs: numberValue(row.pending_jobs),
    runningJobs: numberValue(row.running_jobs),
    failedJobs: numberValue(row.failed_jobs),
    completedJobs: numberValue(row.completed_jobs),
    feedbackItems: numberValue(row.feedback_items),
  };
}

export async function listRecentFailedJobs(limit = 20) {
  if (!isDatabaseConfigured()) return [];
  return query<{
    id: string;
    job_type: string;
    error: string | null;
    attempt_count: number;
    updated_at: string;
  }>(
    `SELECT id, job_type, error, attempt_count, updated_at
     FROM ingestion_jobs
     WHERE status = 'failed'
     ORDER BY updated_at DESC
     LIMIT $1`,
    [Math.max(1, Math.min(limit, 100))],
  );
}
