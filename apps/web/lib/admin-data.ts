import { isDatabaseConfigured, query } from "@/lib/db";

export type AdminOverview = {
  repositories: number; snapshots: number; scoredRepositories: number;
  approvedAnalyses: number; pendingAnalyses: number; rejectedAnalyses: number;
  queuedJobs: number; runningJobs: number; failedJobs: number; succeededJobs: number; feedbackItems: number;
};

function n(value: string | number | null | undefined) {
  const parsed = Number(value ?? 0); return Number.isFinite(parsed) ? parsed : 0;
}

export async function getAdminOverview(): Promise<AdminOverview | null> {
  if (!isDatabaseConfigured()) return null;
  const rows = await query<Record<string, string | number>>(`SELECT
    (SELECT count(*) FROM repositories) repositories,
    (SELECT count(*) FROM repository_snapshots) snapshots,
    (SELECT count(DISTINCT repository_id) FROM repository_scores WHERE score_version='health-v1') scored_repositories,
    (SELECT count(*) FROM ai_analyses WHERE analysis_type='repository_enrichment' AND review_status='approved') approved_analyses,
    (SELECT count(*) FROM ai_analyses WHERE analysis_type='repository_enrichment' AND review_status IN ('pending','human_review')) pending_analyses,
    (SELECT count(*) FROM ai_analyses WHERE analysis_type='repository_enrichment' AND review_status='rejected') rejected_analyses,
    (SELECT count(*) FROM ingestion_jobs WHERE status IN ('queued','retry')) queued_jobs,
    (SELECT count(*) FROM ingestion_jobs WHERE status='running') running_jobs,
    (SELECT count(*) FROM ingestion_jobs WHERE status IN ('failed','dead')) failed_jobs,
    (SELECT count(*) FROM ingestion_jobs WHERE status='succeeded') succeeded_jobs,
    (SELECT count(*) FROM feedback) feedback_items`);
  const r = rows[0]; if (!r) return null;
  return { repositories:n(r.repositories), snapshots:n(r.snapshots), scoredRepositories:n(r.scored_repositories),
    approvedAnalyses:n(r.approved_analyses), pendingAnalyses:n(r.pending_analyses), rejectedAnalyses:n(r.rejected_analyses),
    queuedJobs:n(r.queued_jobs), runningJobs:n(r.running_jobs), failedJobs:n(r.failed_jobs), succeededJobs:n(r.succeeded_jobs), feedbackItems:n(r.feedback_items) };
}

export async function listRecentFailedJobs(limit = 20) {
  if (!isDatabaseConfigured()) return [];
  return query<{id:string;job_type:string;status:string;error:string|null;attempt_count:number;updated_at:string}>(
    `SELECT id,job_type,status,error,attempt_count,updated_at FROM ingestion_jobs WHERE status IN ('failed','dead') ORDER BY updated_at DESC LIMIT $1`,
    [Math.max(1, Math.min(limit, 100))],
  );
}
