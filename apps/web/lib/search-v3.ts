import { isDatabaseConfigured, query } from "@/lib/db";

export type SearchRepositoryItem = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  githubUrl: string;
  summary: string;
  summarySource: "source" | "editorial";
  healthScore: number | null;
  stars: number;
  language: string | null;
  licenseSpdx: string | null;
  pushedAt: string | null;
  fitReason: string | null;
  fitScore: number | null;
  fitSource: "source" | "ai_inference" | "editorial" | null;
  tags: string[];
};

export type RepositorySearchFilters = {
  category?: string | null;
  minHealth?: number | null;
};

type SearchRow = {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  github_url: string;
  description: string | null;
  pushed_at_source: string | null;
  stars: number;
  primary_language: string | null;
  license_spdx: string | null;
  health_score: string | number | null;
  intelligence_definition: string | null;
  fit_reason: string | null;
  fit_score: string | number | null;
  fit_source: string | null;
  tags: string[] | null;
  fts_rank: string | number | null;
  trigram_rank: string | number | null;
};

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeCategory(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized || normalized.length > 80 || !/^[a-z0-9-]+$/.test(normalized)) return null;
  return normalized;
}

function safeMinHealth(value: number | null | undefined): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.min(100, Math.max(0, value));
}

function fitSource(value: string | null): SearchRepositoryItem["fitSource"] {
  if (value === "editorial") return "editorial";
  if (value === "ai") return "ai_inference";
  if (value === "source") return "source";
  return null;
}

const intelligenceSearchText = `
  concat_ws(' ',
    coalesce(r.full_name, ''),
    coalesce(r.description, ''),
    coalesce(intelligence.output_json->'identity'->>'definition', ''),
    coalesce(intelligence.output_json->'identity'->>'primary_role', ''),
    coalesce(intelligence.output_json->'identity'->>'primary_category', ''),
    coalesce(intelligence.output_json->'problem'->>'problem_statement', ''),
    coalesce(intelligence.output_json->'problem'->>'solution_approach', ''),
    coalesce(intelligence.output_json->'capabilities', '[]'::jsonb)::text,
    coalesce(intelligence.output_json->'limitations', '[]'::jsonb)::text,
    coalesce(intelligence.output_json->'audience'->'best_for', '[]'::jsonb)::text,
    coalesce(intelligence.output_json->'audience'->'poor_fit', '[]'::jsonb)::text,
    coalesce(intelligence.output_json->'decision'->'choose_when', '[]'::jsonb)::text,
    coalesce(intelligence.output_json->'decision'->'evaluate_first', '[]'::jsonb)::text,
    coalesce(intelligence.output_json->'decision'->'tradeoffs', '[]'::jsonb)::text
  )
`;

export async function searchRepositoriesV3(
  queryText: string,
  limit = 30,
  filters: RepositorySearchFilters = {},
): Promise<SearchRepositoryItem[]> {
  if (!isDatabaseConfigured()) return [];

  const normalized = queryText.trim().slice(0, 200);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const category = safeCategory(filters.category);
  const minHealth = safeMinHealth(filters.minHealth);

  const rows = await query<SearchRow>(
    `SELECT
       r.id,
       r.owner,
       r.name,
       r.full_name,
       r.github_url,
       r.description,
       r.pushed_at_source,
       s.stars,
       s.primary_language,
       s.license_spdx,
       score.total_score AS health_score,
       intelligence.output_json->'identity'->>'definition' AS intelligence_definition,
       fit.reason AS fit_reason,
       fit.fit_score,
       fit.source_type AS fit_source,
       COALESCE(tags.slugs, ARRAY[]::text[]) AS tags,
       COALESCE(
         ts_rank(
           to_tsvector('simple', ${intelligenceSearchText}),
           websearch_to_tsquery('simple', NULLIF($1, ''))
         ),
         0
       ) AS fts_rank,
       CASE
         WHEN $1 = '' THEN 0
         ELSE GREATEST(
           similarity(r.full_name, $1),
           similarity(coalesce(r.description, ''), $1),
           similarity(coalesce(intelligence.output_json->'identity'->>'definition', ''), $1)
         )
       END AS trigram_rank
     FROM repositories r
     JOIN repository_snapshots s ON s.id = r.current_snapshot_id
     LEFT JOIN repository_scores score
       ON score.repository_id = r.id
      AND score.snapshot_id = s.id
      AND score.score_version = 'health-v1'
     LEFT JOIN LATERAL (
       SELECT a.output_json
       FROM ai_analyses a
       WHERE a.repository_id = r.id
         AND a.analysis_type = 'repository_intelligence'
         AND a.schema_version = 'repo-intelligence-v3'
         AND a.review_status = 'approved'
         AND a.source_snapshot_id = r.current_snapshot_id
       ORDER BY a.created_at DESC
       LIMIT 1
     ) intelligence ON true
     LEFT JOIN LATERAL (
       SELECT ru.reason, ru.fit_score, ru.source_type
       FROM repository_use_cases ru
       JOIN use_cases u ON u.id = ru.use_case_id AND u.status = 'active'
       WHERE ru.repository_id = r.id
         AND (
           ru.source_type = 'source'
           OR (ru.source_type IN ('ai', 'editorial') AND ru.reviewed = true)
         )
       ORDER BY ru.fit_score DESC
       LIMIT 1
     ) fit ON true
     LEFT JOIN LATERAL (
       SELECT array_agg(slug ORDER BY slug) AS slugs
       FROM (
         SELECT DISTINCT tt.slug
         FROM repository_taxonomy rt
         JOIN taxonomy_terms tt ON tt.id = rt.term_id AND tt.status = 'active'
         WHERE rt.repository_id = r.id
         LIMIT 6
       ) selected_tags
     ) tags ON true
     WHERE r.current_snapshot_id IS NOT NULL
       AND (
         $1 = ''
         OR to_tsvector('simple', ${intelligenceSearchText})
              @@ websearch_to_tsquery('simple', NULLIF($1, ''))
         OR similarity(r.full_name, $1) > 0.12
         OR similarity(coalesce(intelligence.output_json->'identity'->>'definition', ''), $1) > 0.10
         OR r.description ILIKE '%' || $1 || '%'
         OR EXISTS (
           SELECT 1
           FROM repository_taxonomy rt2
           JOIN taxonomy_terms tt2 ON tt2.id = rt2.term_id AND tt2.status = 'active'
           WHERE rt2.repository_id = r.id
             AND (tt2.slug ILIKE '%' || $1 || '%' OR tt2.label ILIKE '%' || $1 || '%')
         )
         OR EXISTS (
           SELECT 1
           FROM repository_use_cases ru2
           JOIN use_cases u2 ON u2.id = ru2.use_case_id AND u2.status = 'active'
           WHERE ru2.repository_id = r.id
             AND (
               ru2.source_type = 'source'
               OR (ru2.source_type IN ('ai', 'editorial') AND ru2.reviewed = true)
             )
             AND (u2.slug ILIKE '%' || $1 || '%' OR u2.title ILIKE '%' || $1 || '%')
         )
       )
       AND (
         $3::text IS NULL
         OR EXISTS (
           SELECT 1
           FROM repository_taxonomy filter_rt
           JOIN taxonomy_terms filter_tt ON filter_tt.id = filter_rt.term_id
           WHERE filter_rt.repository_id = r.id
             AND filter_tt.axis = 'capability'
             AND filter_tt.status = 'active'
             AND filter_tt.slug = $3
         )
       )
       AND ($4::numeric IS NULL OR score.total_score >= $4)
     ORDER BY fts_rank DESC, trigram_rank DESC, score.total_score DESC NULLS LAST, s.stars DESC
     LIMIT $2`,
    [normalized, safeLimit, category, minHealth],
  );

  return rows.map((row) => ({
    id: row.id,
    owner: row.owner,
    name: row.name,
    fullName: row.full_name,
    githubUrl: row.github_url,
    summary: row.intelligence_definition ?? row.description ?? "No source-backed summary is available yet.",
    summarySource: row.intelligence_definition ? "editorial" : "source",
    healthScore: toNumber(row.health_score),
    stars: row.stars,
    language: row.primary_language,
    licenseSpdx: row.license_spdx,
    pushedAt: row.pushed_at_source,
    fitReason: row.fit_reason,
    fitScore: toNumber(row.fit_score),
    fitSource: fitSource(row.fit_source),
    tags: row.tags ?? [],
  }));
}
