import { isDatabaseConfigured, query } from "@/lib/db";
import {
  parseRepositoryIntelligence,
  type RepositoryIntelligenceV3,
} from "@/lib/intelligence";

export async function getRepositoryIntelligence(
  owner: string,
  name: string,
): Promise<RepositoryIntelligenceV3 | null> {
  if (!isDatabaseConfigured()) return null;
  const fullName = `${owner}/${name}`.slice(0, 180);
  const rows = await query<{
    output_json: Record<string, unknown>;
    confidence: string | number | null;
    model_provider: string;
    model_name: string;
    created_at: string;
  }>(
    `SELECT a.output_json, a.confidence, a.model_provider, a.model_name, a.created_at
     FROM ai_analyses a
     JOIN repositories r ON r.id = a.repository_id
     WHERE lower(r.full_name) = lower($1)
       AND a.analysis_type = 'repository_intelligence'
       AND a.schema_version = 'repo-intelligence-v3'
       AND a.review_status = 'approved'
     ORDER BY a.created_at DESC
     LIMIT 1`,
    [fullName],
  );
  const row = rows[0];
  if (!row) return null;

  const parsed = Number(row.confidence);
  return parseRepositoryIntelligence(row.output_json, {
    provider: row.model_provider,
    model: row.model_name,
    createdAt: row.created_at,
    confidence: Number.isFinite(parsed) ? parsed : null,
  });
}
