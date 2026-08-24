import { isDatabaseConfigured, query } from "@/lib/db";

export type FitProvenance = "source" | "ai_inference" | "editorial";

export type UseCaseSummaryV2 = {
  slug: string;
  title: string;
  description: string | null;
  repositoryCount: number;
};

export type UseCaseRepositoryItem = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  summary: string;
  summarySource: "source" | "editorial";
  healthScore: number | null;
  stars: number;
  language: string | null;
  licenseSpdx: string | null;
  fitScore: number;
  fitReason: string | null;
  fitSource: FitProvenance;
  tags: string[];
};

type UseCaseRow = {
  slug: string;
  title: string;
  description: string | null;
  repository_count: string | number;
};

type RepositoryRow = {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  primary_language: string | null;
  license_spdx: string | null;
  health_score: string | number | null;
  intelligence_definition: string | null;
  fit_score: string | number;
  fit_reason: string | null;
  fit_source: string;
  tags: string[] | null;
};

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapFitSource(source: string): FitProvenance {
  if (source === "editorial") return "editorial";
  if (source === "ai") return "ai_inference";
  return "source";
}

const reviewedFitPredicate = `
  ru.source_type = 'source'
  OR (ru.source_type IN ('ai', 'editorial') AND ru.reviewed = true)
`;

export async function listReviewedUseCases(): Promise<UseCaseSummaryV2[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await query<UseCaseRow>(
    `SELECT u.slug, u.title, u.description, count(DISTINCT ru.repository_id) AS repository_count
     FROM use_cases u
     LEFT JOIN repository_use_cases ru
       ON ru.use_case_id = u.id
      AND (${reviewedFitPredicate})
     WHERE u.status = 'active'
     GROUP BY u.id
     ORDER BY repository_count DESC, u.title ASC`,
  );
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    repositoryCount: toNumber(row.repository_count) ?? 0,
  }));
}

export async function getReviewedUseCase(slug: string): Promise<{
  useCase: UseCaseSummaryV2;
  repositories: UseCaseRepositoryItem[];
} | null> {
  if (!isDatabaseConfigured()) return null;
  const normalized = slug.trim().toLowerCase().slice(0, 100);
  if (!normalized || !/^[a-z0-9-]+$/.test(normalized)) return null;

  const summaries = await query<UseCaseRow>(
    `SELECT u.slug, u.title, u.description, count(DISTINCT ru.repository_id) AS repository_count
     FROM use_cases u
     LEFT JOIN repository_use_cases ru
       ON ru.use_case_id = u.id
      AND (${reviewedFitPredicate})
     WHERE u.slug = $1 AND u.status = 'active'
     GROUP BY u.id`,
    [normalized],
  );
  const summary = summaries[0];
  if (!summary) return null;

  const rows = await query<RepositoryRow>(
    `SELECT
       r.id,
       r.owner,
       r.name,
       r.full_name,
       r.description,
       s.stars,
       s.primary_language,
       s.license_spdx,
       score.total_score AS health_score,
       intelligence.output_json->'identity'->>'definition' AS intelligence_definition,
       selected_ru.fit_score,
       selected_ru.reason AS fit_reason,
       selected_ru.source_type AS fit_source,
       COALESCE(tags.slugs, ARRAY[]::text[]) AS tags
     FROM repositories r
     JOIN repository_snapshots s ON s.id = r.current_snapshot_id
     LEFT JOIN repository_scores score
       ON score.repository_id = r.id
      AND score.snapshot_id = s.id
      AND score.score_version = 'health-v1'
     JOIN repository_use_cases selected_ru ON selected_ru.repository_id = r.id
     JOIN use_cases selected_u ON selected_u.id = selected_ru.use_case_id
     LEFT JOIN LATERAL (
       SELECT a.output_json
       FROM ai_analyses a
       WHERE a.repository_id = r.id
         AND a.analysis_type = 'repository_intelligence'
         AND a.schema_version = 'repo-intelligence-v3'
         AND a.model_provider = 'editorial'
         AND a.review_status = 'approved'
         AND a.source_snapshot_id = r.current_snapshot_id
       ORDER BY a.created_at DESC
       LIMIT 1
     ) intelligence ON true
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
     WHERE selected_u.slug = $1
       AND selected_u.status = 'active'
       AND (
         selected_ru.source_type = 'source'
         OR (selected_ru.source_type IN ('ai', 'editorial') AND selected_ru.reviewed = true)
       )
     ORDER BY selected_ru.fit_score DESC, score.total_score DESC NULLS LAST, s.stars DESC
     LIMIT 100`,
    [normalized],
  );

  return {
    useCase: {
      slug: summary.slug,
      title: summary.title,
      description: summary.description,
      repositoryCount: toNumber(summary.repository_count) ?? 0,
    },
    repositories: rows.map((row) => ({
      id: row.id,
      owner: row.owner,
      name: row.name,
      fullName: row.full_name,
      summary: row.intelligence_definition ?? row.description ?? "No source-backed summary is available yet.",
      summarySource: row.intelligence_definition ? "editorial" : "source",
      healthScore: toNumber(row.health_score),
      stars: row.stars,
      language: row.primary_language,
      licenseSpdx: row.license_spdx,
      fitScore: toNumber(row.fit_score) ?? 0,
      fitReason: row.fit_reason,
      fitSource: mapFitSource(row.fit_source),
      tags: row.tags ?? [],
    })),
  };
}
