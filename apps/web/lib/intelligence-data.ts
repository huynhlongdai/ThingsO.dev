import { isDatabaseConfigured, query } from "@/lib/db";
import {
  parseRepositoryIntelligence,
  type RepositoryIntelligenceV3,
} from "@/lib/intelligence";

export async function getRepositoryIntelligence(
  owner: string,
  name: string,
  options: { allowStale?: boolean } = {},
): Promise<RepositoryIntelligenceV3 | null> {
  if (!isDatabaseConfigured()) return null;
  const fullName = `${owner}/${name}`.slice(0, 180);
  const allowStale = options.allowStale === true;
  const rows = await query<{
    output_json: Record<string, unknown>;
    confidence: string | number | null;
    model_provider: string;
    model_name: string;
    created_at: string;
    is_current_snapshot: boolean;
  }>(
    `SELECT
       a.output_json,
       a.confidence,
       a.model_provider,
       a.model_name,
       a.created_at,
       (a.source_snapshot_id = r.current_snapshot_id) AS is_current_snapshot
     FROM ai_analyses a
     JOIN repositories r ON r.id = a.repository_id
     WHERE lower(r.full_name) = lower($1)
       AND a.analysis_type = 'repository_intelligence'
       AND a.schema_version = 'repo-intelligence-v3'
       AND a.review_status = 'approved'
       AND ($2::boolean OR a.source_snapshot_id = r.current_snapshot_id)
     ORDER BY (a.source_snapshot_id = r.current_snapshot_id) DESC, a.created_at DESC
     LIMIT 1`,
    [fullName, allowStale],
  );
  const row = rows[0];
  if (!row) return null;

  const parsed = Number(row.confidence);
  return parseRepositoryIntelligence(row.output_json, {
    provider: row.model_provider,
    model: row.model_name,
    createdAt: row.created_at,
    confidence: Number.isFinite(parsed) ? parsed : null,
    isCurrentSnapshot: row.is_current_snapshot,
  });
}
