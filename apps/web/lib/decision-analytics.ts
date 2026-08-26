import { isDatabaseConfigured, query } from "@/lib/db";

export const decisionEventTypes = [
  "search_result_open",
  "use_case_repository_open",
  "repository_compare",
  "compare_repository_open",
  "repository_blueprint",
  "compare_blueprint",
  "evidence_expand",
  "build_idea_open",
  "feedback_submit",
] as const;

export const decisionSurfaces = [
  "home",
  "discover",
  "search",
  "use-case",
  "repository",
  "compare",
  "blueprint",
  "build",
  "methodology",
] as const;

export const readinessStages = [
  "evidence-safe",
  "analyzed",
  "decision-ready",
  "blueprint-ready",
] as const;

export type DecisionEventType = (typeof decisionEventTypes)[number];
export type DecisionSurface = (typeof decisionSurfaces)[number];
export type DecisionReadinessStage = (typeof readinessStages)[number];

export type DecisionEventInput = {
  anonymousSessionId: string;
  eventType: DecisionEventType;
  sourceSurface: DecisionSurface;
  repositoryFullName?: string | null;
  useCaseSlug?: string | null;
  readinessStage?: DecisionReadinessStage | null;
};

export async function recordDecisionEvent(input: DecisionEventInput): Promise<void> {
  if (!isDatabaseConfigured()) return;
  await query(
    `INSERT INTO decision_events (
       anonymous_session_id,
       event_type,
       source_surface,
       repository_full_name,
       use_case_slug,
       readiness_stage
     ) VALUES ($1, $2, $3, $4, $5, $6)`,
    [
      input.anonymousSessionId.slice(0, 80),
      input.eventType,
      input.sourceSurface,
      input.repositoryFullName?.slice(0, 180) ?? null,
      input.useCaseSlug?.slice(0, 120) ?? null,
      input.readinessStage ?? null,
    ],
  );
}

export type DecisionFunnelMetrics = {
  days: number;
  anonymousSessions: number;
  usefulDecisionSessions: number;
  udsRate: number;
  searchResultOpens: number;
  compareInitiations: number;
  compareRepositoryOpens: number;
  blueprintAttempts: number;
  evidenceExpansions: number;
  feedbackSubmissions: number;
  zeroResultRate: number | null;
};

export async function getDecisionFunnelMetrics(days = 7): Promise<DecisionFunnelMetrics | null> {
  if (!isDatabaseConfigured()) return null;
  const safeDays = Math.min(90, Math.max(1, Math.floor(days)));
  const rows = await query<{
    anonymous_sessions: string | number;
    uds_sessions: string | number;
    search_result_opens: string | number;
    compare_initiations: string | number;
    compare_repository_opens: string | number;
    blueprint_attempts: string | number;
    evidence_expansions: string | number;
    feedback_submissions: string | number;
    zero_result_rate: string | number | null;
  }>(
    `WITH recent_events AS (
       SELECT *
       FROM decision_events
       WHERE created_at >= now() - make_interval(days => $1)
     ),
     per_session AS (
       SELECT anonymous_session_id,
              count(DISTINCT event_type) FILTER (
                WHERE event_type <> 'feedback_submit'
              ) AS distinct_decision_actions
       FROM recent_events
       GROUP BY anonymous_session_id
     ),
     search_metrics AS (
       SELECT CASE WHEN count(*) = 0 THEN NULL
                   ELSE count(*) FILTER (WHERE result_count = 0)::numeric / count(*)::numeric
              END AS zero_result_rate
       FROM search_queries
       WHERE created_at >= now() - make_interval(days => $1)
     )
     SELECT
       (SELECT count(*) FROM per_session) AS anonymous_sessions,
       (SELECT count(*) FROM per_session WHERE distinct_decision_actions >= 2) AS uds_sessions,
       count(*) FILTER (WHERE event_type IN ('search_result_open','use_case_repository_open')) AS search_result_opens,
       count(*) FILTER (WHERE event_type = 'repository_compare') AS compare_initiations,
       count(*) FILTER (WHERE event_type = 'compare_repository_open') AS compare_repository_opens,
       count(*) FILTER (WHERE event_type IN ('repository_blueprint','compare_blueprint')) AS blueprint_attempts,
       count(*) FILTER (WHERE event_type = 'evidence_expand') AS evidence_expansions,
       count(*) FILTER (WHERE event_type = 'feedback_submit') AS feedback_submissions,
       (SELECT zero_result_rate FROM search_metrics) AS zero_result_rate
     FROM recent_events`,
    [safeDays],
  );
  const row = rows[0];
  if (!row) return null;
  const number = (value: string | number | null): number => Number(value ?? 0);
  const anonymousSessions = number(row.anonymous_sessions);
  const usefulDecisionSessions = number(row.uds_sessions);
  return {
    days: safeDays,
    anonymousSessions,
    usefulDecisionSessions,
    udsRate: anonymousSessions ? usefulDecisionSessions / anonymousSessions : 0,
    searchResultOpens: number(row.search_result_opens),
    compareInitiations: number(row.compare_initiations),
    compareRepositoryOpens: number(row.compare_repository_opens),
    blueprintAttempts: number(row.blueprint_attempts),
    evidenceExpansions: number(row.evidence_expansions),
    feedbackSubmissions: number(row.feedback_submissions),
    zeroResultRate: row.zero_result_rate === null ? null : number(row.zero_result_rate),
  };
}
