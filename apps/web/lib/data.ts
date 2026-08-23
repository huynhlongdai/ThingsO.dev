import { isDatabaseConfigured, query } from "@/lib/db";

export type ProvenanceKind = "source" | "ai_inference" | "editorial";

export type RepositoryListItem = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  githubUrl: string;
  summary: string;
  summarySource: "source" | "ai_inference";
  healthScore: number | null;
  stars: number;
  language: string | null;
  licenseSpdx: string | null;
  pushedAt: string | null;
  fitReason: string | null;
  tags: string[];
};

export type HealthBreakdown = {
  version: string;
  total: number;
  maintenance: number;
  adoption: number;
  community: number;
  documentation: number;
  operations: number;
  licenseClarity: number;
  maturity: number;
  metadata: number;
};

export type TaxonomyLink = {
  axis: string;
  slug: string;
  label: string;
  sourceType: ProvenanceKind;
  confidence: number | null;
};

export type UseCaseLink = {
  slug: string;
  title: string;
  fitScore: number;
  reason: string | null;
  sourceType: ProvenanceKind;
};

export type RelationLink = {
  fullName: string;
  relationType: string;
  sourceType: ProvenanceKind;
  confidence: number | null;
};

export type BuildIdea = {
  id: string;
  slug: string;
  title: string;
  problem: string;
  targetUser: string | null;
  complexity: string | null;
  architecture: Record<string, unknown>;
  assumptions: unknown[];
  risks: unknown[];
  repositoryFullName: string | null;
  createdAt: string;
};

export type RepositoryAnalysis = {
  summary: string;
  capabilities: string[];
  limitations: string[];
  deploymentModes: string[];
  interfaces: string[];
  confidence: number | null;
  provider: string;
  model: string;
  createdAt: string;
};

export type SourceProvenance = {
  documentType: string;
  sourceUrl: string;
  ref: string | null;
  contentHash: string;
  fetchedAt: string;
};

export type RepositoryDetail = RepositoryListItem & {
  homepageUrl: string | null;
  description: string | null;
  archived: boolean;
  fork: boolean;
  defaultBranch: string | null;
  capturedAt: string;
  forks: number;
  openIssues: number;
  watchers: number;
  subscribers: number | null;
  health: HealthBreakdown | null;
  analysis: RepositoryAnalysis | null;
  taxonomy: TaxonomyLink[];
  useCases: UseCaseLink[];
  relations: RelationLink[];
  buildIdeas: BuildIdea[];
  sources: SourceProvenance[];
};

export type TaxonomyTermSummary = {
  axis: string;
  slug: string;
  label: string;
  repositoryCount: number;
};

export type UseCaseSummary = {
  slug: string;
  title: string;
  description: string | null;
  repositoryCount: number;
};

type RepositoryRow = {
  id: string;
  owner: string;
  name: string;
  full_name: string;
  github_url: string;
  description: string | null;
  stars: number;
  primary_language: string | null;
  license_spdx: string | null;
  pushed_at_source: string | null;
  health_score: string | number | null;
  ai_summary: string | null;
  fit_reason: string | null;
  tags: string[] | null;
};

function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapRepositoryRow(row: RepositoryRow): RepositoryListItem {
  return {
    id: row.id,
    owner: row.owner,
    name: row.name,
    fullName: row.full_name,
    githubUrl: row.github_url,
    summary: row.ai_summary ?? row.description ?? "No reviewed summary is available yet.",
    summarySource: row.ai_summary ? "ai_inference" : "source",
    healthScore: toNumber(row.health_score),
    stars: row.stars,
    language: row.primary_language,
    licenseSpdx: row.license_spdx,
    pushedAt: row.pushed_at_source,
    fitReason: row.fit_reason,
    tags: row.tags ?? [],
  };
}

const repositorySelect = `
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
  ai.output_json->>'summary' AS ai_summary,
  fit.reason AS fit_reason,
  COALESCE(tags.slugs, ARRAY[]::text[]) AS tags
`;

const repositoryJoins = `
  JOIN repository_snapshots s ON s.id = r.current_snapshot_id
  LEFT JOIN repository_scores score
    ON score.repository_id = r.id
   AND score.snapshot_id = s.id
   AND score.score_version = 'health-v1'
  LEFT JOIN LATERAL (
    SELECT output_json
    FROM ai_analyses
    WHERE repository_id = r.id
      AND analysis_type = 'repository_enrichment'
      AND review_status = 'approved'
    ORDER BY created_at DESC
    LIMIT 1
  ) ai ON true
  LEFT JOIN LATERAL (
    SELECT ru.reason
    FROM repository_use_cases ru
    JOIN use_cases u ON u.id = ru.use_case_id AND u.status = 'active'
    WHERE ru.repository_id = r.id
      AND (ru.source_type <> 'ai' OR ru.reviewed = true)
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
`;

export async function listRepositories(limit = 24): Promise<RepositoryListItem[]> {
  if (!isDatabaseConfigured()) return [];
  const safeLimit = Math.min(100, Math.max(1, limit));
  const rows = await query<RepositoryRow>(
    `SELECT ${repositorySelect}
     FROM repositories r
     ${repositoryJoins}
     WHERE r.current_snapshot_id IS NOT NULL
     ORDER BY s.stars DESC, r.full_name ASC
     LIMIT $1`,
    [safeLimit],
  );
  return rows.map(mapRepositoryRow);
}

export async function searchRepositories(
  queryText: string,
  limit = 30,
): Promise<RepositoryListItem[]> {
  const normalized = queryText.trim().slice(0, 200);
  if (!normalized) return listRepositories(limit);
  if (!isDatabaseConfigured()) return [];
  const safeLimit = Math.min(100, Math.max(1, limit));
  const rows = await query<RepositoryRow & { fts_rank: number; trigram_rank: number }>(
    `SELECT ${repositorySelect},
       ts_rank(
         to_tsvector('simple', coalesce(r.full_name, '') || ' ' || coalesce(r.description, '')),
         websearch_to_tsquery('simple', $1)
       ) AS fts_rank,
       GREATEST(similarity(r.full_name, $1), similarity(coalesce(r.description, ''), $1)) AS trigram_rank
     FROM repositories r
     ${repositoryJoins}
     WHERE r.current_snapshot_id IS NOT NULL
       AND (
         to_tsvector('simple', coalesce(r.full_name, '') || ' ' || coalesce(r.description, ''))
           @@ websearch_to_tsquery('simple', $1)
         OR similarity(r.full_name, $1) > 0.12
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
             AND (u2.slug ILIKE '%' || $1 || '%' OR u2.title ILIKE '%' || $1 || '%')
         )
       )
     ORDER BY fts_rank DESC, trigram_rank DESC, score.total_score DESC NULLS LAST, s.stars DESC
     LIMIT $2`,
    [normalized, safeLimit],
  );
  return rows.map(mapRepositoryRow);
}

export async function getRepository(
  owner: string,
  name: string,
): Promise<RepositoryDetail | null> {
  if (!isDatabaseConfigured()) return null;
  const fullName = `${owner}/${name}`.slice(0, 180);
  const rows = await query<RepositoryRow & {
    homepage_url: string | null;
    is_archived: boolean;
    is_fork: boolean;
    default_branch: string | null;
    captured_at: string;
    forks: number;
    open_issues: number;
    watchers: number;
    subscribers: number | null;
    score_version: string | null;
    maintenance_score: string | number | null;
    adoption_score: string | number | null;
    community_score: string | number | null;
    documentation_score: string | number | null;
    operations_score: string | number | null;
    license_clarity_score: string | number | null;
    maturity_score: string | number | null;
    metadata_score: string | number | null;
    analysis_json: Record<string, unknown> | null;
    analysis_confidence: string | number | null;
    model_provider: string | null;
    model_name: string | null;
    analysis_created_at: string | null;
  }>(
    `SELECT ${repositorySelect},
       r.homepage_url,
       r.is_archived,
       r.is_fork,
       r.default_branch,
       s.captured_at,
       s.forks,
       s.open_issues,
       s.watchers,
       s.subscribers,
       score.score_version,
       score.maintenance_score,
       score.adoption_score,
       score.community_score,
       score.documentation_score,
       score.operations_score,
       score.license_clarity_score,
       score.maturity_score,
       score.metadata_score,
       analysis.output_json AS analysis_json,
       analysis.confidence AS analysis_confidence,
       analysis.model_provider,
       analysis.model_name,
       analysis.created_at AS analysis_created_at
     FROM repositories r
     ${repositoryJoins}
     LEFT JOIN LATERAL (
       SELECT output_json, confidence, model_provider, model_name, created_at
       FROM ai_analyses
       WHERE repository_id = r.id
         AND analysis_type = 'repository_enrichment'
         AND review_status = 'approved'
       ORDER BY created_at DESC
       LIMIT 1
     ) analysis ON true
     WHERE lower(r.full_name) = lower($1)
     LIMIT 1`,
    [fullName],
  );
  const row = rows[0];
  if (!row) return null;

  const [taxonomyRows, useCaseRows, relationRows, ideaRows, sourceRows] = await Promise.all([
    query<{
      axis: string;
      slug: string;
      label: string;
      source_type: ProvenanceKind;
      confidence: string | number | null;
    }>(
      `SELECT tt.axis, tt.slug, tt.label, rt.source_type, rt.confidence
       FROM repository_taxonomy rt
       JOIN taxonomy_terms tt ON tt.id = rt.term_id
       WHERE rt.repository_id = $1 AND tt.status = 'active'
       ORDER BY tt.axis, tt.label, rt.source_type`,
      [row.id],
    ),
    query<{
      slug: string;
      title: string;
      fit_score: string | number;
      reason: string | null;
      source_type: ProvenanceKind;
    }>(
      `SELECT u.slug, u.title, ru.fit_score, ru.reason, ru.source_type
       FROM repository_use_cases ru
       JOIN use_cases u ON u.id = ru.use_case_id
       WHERE ru.repository_id = $1
         AND u.status = 'active'
         AND (ru.source_type <> 'ai' OR ru.reviewed = true)
       ORDER BY ru.fit_score DESC, u.title`,
      [row.id],
    ),
    query<{
      full_name: string;
      relation_type: string;
      source_type: ProvenanceKind;
      confidence: string | number | null;
    }>(
      `SELECT target.full_name, rr.relation_type, rr.source_type, rr.confidence
       FROM repository_relations rr
       JOIN repositories target ON target.id = rr.to_repository_id
       WHERE rr.from_repository_id = $1
         AND (rr.source_type <> 'ai' OR rr.reviewed = true)
       ORDER BY rr.relation_type, target.full_name`,
      [row.id],
    ),
    query<{
      id: string;
      slug: string;
      title: string;
      problem: string;
      target_user: string | null;
      complexity: string | null;
      architecture_json: Record<string, unknown>;
      assumptions_json: unknown[];
      risks_json: unknown[];
      created_at: string;
    }>(
      `SELECT id, slug, title, problem, target_user, complexity,
              architecture_json, assumptions_json, risks_json, created_at
       FROM build_ideas
       WHERE repository_id = $1 AND review_status = 'approved'
       ORDER BY created_at DESC
       LIMIT 12`,
      [row.id],
    ),
    query<{
      document_type: string;
      source_url: string;
      ref: string | null;
      content_hash: string;
      fetched_at: string;
    }>(
      `SELECT DISTINCT ON (document_type, source_url)
              document_type, source_url, ref, content_hash, fetched_at
       FROM source_documents
       WHERE repository_id = $1
       ORDER BY document_type, source_url, fetched_at DESC`,
      [row.id],
    ),
  ]);

  const base = mapRepositoryRow(row);
  const analysisJson = row.analysis_json ?? null;
  const analysis: RepositoryAnalysis | null = analysisJson
    ? {
        summary: String(analysisJson.summary ?? base.summary),
        capabilities: toStringArray(analysisJson.capabilities),
        limitations: toStringArray(analysisJson.limitations),
        deploymentModes: toStringArray(analysisJson.deployment_modes),
        interfaces: toStringArray(analysisJson.interfaces),
        confidence: toNumber(row.analysis_confidence),
        provider: row.model_provider ?? "unknown",
        model: row.model_name ?? "unknown",
        createdAt: row.analysis_created_at ?? row.captured_at,
      }
    : null;

  const totalScore = toNumber(row.health_score);
  const health: HealthBreakdown | null = totalScore !== null && row.score_version
    ? {
        version: row.score_version,
        total: totalScore,
        maintenance: toNumber(row.maintenance_score) ?? 0,
        adoption: toNumber(row.adoption_score) ?? 0,
        community: toNumber(row.community_score) ?? 0,
        documentation: toNumber(row.documentation_score) ?? 0,
        operations: toNumber(row.operations_score) ?? 0,
        licenseClarity: toNumber(row.license_clarity_score) ?? 0,
        maturity: toNumber(row.maturity_score) ?? 0,
        metadata: toNumber(row.metadata_score) ?? 0,
      }
    : null;

  return {
    ...base,
    homepageUrl: row.homepage_url,
    description: row.description,
    archived: row.is_archived,
    fork: row.is_fork,
    defaultBranch: row.default_branch,
    capturedAt: row.captured_at,
    forks: row.forks,
    openIssues: row.open_issues,
    watchers: row.watchers,
    subscribers: row.subscribers,
    health,
    analysis,
    taxonomy: taxonomyRows.map((item) => ({
      axis: item.axis,
      slug: item.slug,
      label: item.label,
      sourceType: item.source_type,
      confidence: toNumber(item.confidence),
    })),
    useCases: useCaseRows.map((item) => ({
      slug: item.slug,
      title: item.title,
      fitScore: toNumber(item.fit_score) ?? 0,
      reason: item.reason,
      sourceType: item.source_type,
    })),
    relations: relationRows.map((item) => ({
      fullName: item.full_name,
      relationType: item.relation_type,
      sourceType: item.source_type,
      confidence: toNumber(item.confidence),
    })),
    buildIdeas: ideaRows.map((item) => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      problem: item.problem,
      targetUser: item.target_user,
      complexity: item.complexity,
      architecture: item.architecture_json,
      assumptions: item.assumptions_json,
      risks: item.risks_json,
      repositoryFullName: base.fullName,
      createdAt: item.created_at,
    })),
    sources: sourceRows.map((item) => ({
      documentType: item.document_type,
      sourceUrl: item.source_url,
      ref: item.ref,
      contentHash: item.content_hash,
      fetchedAt: item.fetched_at,
    })),
  };
}

export async function getCompareRepositories(fullNames: string[]): Promise<RepositoryDetail[]> {
  const unique = [...new Set(fullNames.map((value) => value.trim()).filter(Boolean))].slice(0, 4);
  const results = await Promise.all(
    unique.map(async (fullName) => {
      const [owner, name] = fullName.split("/", 2);
      if (!owner || !name) return null;
      return getRepository(owner, name);
    }),
  );
  return results.filter((item): item is RepositoryDetail => item !== null);
}

export async function listTaxonomyTerms(axis = "capability"): Promise<TaxonomyTermSummary[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await query<{
    axis: string;
    slug: string;
    label: string;
    repository_count: string | number;
  }>(
    `SELECT tt.axis, tt.slug, tt.label, count(DISTINCT rt.repository_id) AS repository_count
     FROM taxonomy_terms tt
     LEFT JOIN repository_taxonomy rt ON rt.term_id = tt.id
     WHERE tt.axis = $1 AND tt.status = 'active'
     GROUP BY tt.id
     ORDER BY repository_count DESC, tt.label ASC`,
    [axis],
  );
  return rows.map((row) => ({
    axis: row.axis,
    slug: row.slug,
    label: row.label,
    repositoryCount: toNumber(row.repository_count) ?? 0,
  }));
}

export async function getCategory(slug: string): Promise<{
  term: TaxonomyTermSummary;
  repositories: RepositoryListItem[];
} | null> {
  if (!isDatabaseConfigured()) return null;
  const terms = await query<{
    axis: string;
    slug: string;
    label: string;
    repository_count: string | number;
  }>(
    `SELECT tt.axis, tt.slug, tt.label, count(DISTINCT rt.repository_id) AS repository_count
     FROM taxonomy_terms tt
     LEFT JOIN repository_taxonomy rt ON rt.term_id = tt.id
     WHERE tt.axis = 'capability' AND tt.slug = $1 AND tt.status = 'active'
     GROUP BY tt.id`,
    [slug],
  );
  const termRow = terms[0];
  if (!termRow) return null;
  const rows = await query<RepositoryRow>(
    `SELECT ${repositorySelect}
     FROM repositories r
     ${repositoryJoins}
     JOIN repository_taxonomy category_rt ON category_rt.repository_id = r.id
     JOIN taxonomy_terms category_tt ON category_tt.id = category_rt.term_id
     WHERE category_tt.axis = 'capability'
       AND category_tt.slug = $1
       AND category_tt.status = 'active'
       AND r.current_snapshot_id IS NOT NULL
     ORDER BY score.total_score DESC NULLS LAST, s.stars DESC
     LIMIT 100`,
    [slug],
  );
  return {
    term: {
      axis: termRow.axis,
      slug: termRow.slug,
      label: termRow.label,
      repositoryCount: toNumber(termRow.repository_count) ?? 0,
    },
    repositories: rows.map(mapRepositoryRow),
  };
}

export async function listUseCases(): Promise<UseCaseSummary[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await query<{
    slug: string;
    title: string;
    description: string | null;
    repository_count: string | number;
  }>(
    `SELECT u.slug, u.title, u.description, count(DISTINCT ru.repository_id) AS repository_count
     FROM use_cases u
     LEFT JOIN repository_use_cases ru
       ON ru.use_case_id = u.id AND (ru.source_type <> 'ai' OR ru.reviewed = true)
     WHERE u.status = 'active'
     GROUP BY u.id
     ORDER BY repository_count DESC, u.title`,
  );
  return rows.map((row) => ({
    slug: row.slug,
    title: row.title,
    description: row.description,
    repositoryCount: toNumber(row.repository_count) ?? 0,
  }));
}

export async function getUseCase(slug: string): Promise<{
  useCase: UseCaseSummary;
  repositories: RepositoryListItem[];
} | null> {
  if (!isDatabaseConfigured()) return null;
  const summaries = await query<{
    slug: string;
    title: string;
    description: string | null;
    repository_count: string | number;
  }>(
    `SELECT u.slug, u.title, u.description, count(DISTINCT ru.repository_id) AS repository_count
     FROM use_cases u
     LEFT JOIN repository_use_cases ru
       ON ru.use_case_id = u.id AND (ru.source_type <> 'ai' OR ru.reviewed = true)
     WHERE u.slug = $1 AND u.status = 'active'
     GROUP BY u.id`,
    [slug],
  );
  const summary = summaries[0];
  if (!summary) return null;
  const rows = await query<RepositoryRow>(
    `SELECT ${repositorySelect}
     FROM repositories r
     ${repositoryJoins}
     JOIN repository_use_cases selected_ru ON selected_ru.repository_id = r.id
     JOIN use_cases selected_u ON selected_u.id = selected_ru.use_case_id
     WHERE selected_u.slug = $1
       AND selected_u.status = 'active'
       AND (selected_ru.source_type <> 'ai' OR selected_ru.reviewed = true)
     ORDER BY selected_ru.fit_score DESC, score.total_score DESC NULLS LAST, s.stars DESC
     LIMIT 100`,
    [slug],
  );
  return {
    useCase: {
      slug: summary.slug,
      title: summary.title,
      description: summary.description,
      repositoryCount: toNumber(summary.repository_count) ?? 0,
    },
    repositories: rows.map(mapRepositoryRow),
  };
}

export async function listBuildIdeas(limit = 48): Promise<BuildIdea[]> {
  if (!isDatabaseConfigured()) return [];
  const safeLimit = Math.min(100, Math.max(1, limit));
  const rows = await query<{
    id: string;
    slug: string;
    title: string;
    problem: string;
    target_user: string | null;
    complexity: string | null;
    architecture_json: Record<string, unknown>;
    assumptions_json: unknown[];
    risks_json: unknown[];
    repository_full_name: string | null;
    created_at: string;
  }>(
    `SELECT bi.id, bi.slug, bi.title, bi.problem, bi.target_user, bi.complexity,
            bi.architecture_json, bi.assumptions_json, bi.risks_json,
            r.full_name AS repository_full_name, bi.created_at
     FROM build_ideas bi
     LEFT JOIN repositories r ON r.id = bi.repository_id
     WHERE bi.review_status = 'approved'
     ORDER BY bi.created_at DESC
     LIMIT $1`,
    [safeLimit],
  );
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    problem: row.problem,
    targetUser: row.target_user,
    complexity: row.complexity,
    architecture: row.architecture_json,
    assumptions: row.assumptions_json,
    risks: row.risks_json,
    repositoryFullName: row.repository_full_name,
    createdAt: row.created_at,
  }));
}

export async function getBuildIdea(slug: string): Promise<BuildIdea | null> {
  const ideas = await listBuildIdeas(100);
  return ideas.find((idea) => idea.slug === slug) ?? null;
}

export async function recordSearchQuery(
  queryText: string,
  resultCount: number,
  anonymousSessionId?: string,
): Promise<void> {
  if (!isDatabaseConfigured()) return;
  const normalized = queryText.trim().replace(/\s+/g, " ").slice(0, 500);
  if (!normalized) return;
  await query(
    `INSERT INTO search_queries (query_text_normalized, anonymous_session_id, result_count)
     VALUES ($1, $2, $3)`,
    [normalized, anonymousSessionId?.slice(0, 160) ?? null, Math.max(0, resultCount)],
  );
}

export async function recordFeedback(input: {
  entityType: string;
  entityId: string;
  feedbackType: string;
  payload?: Record<string, unknown>;
  sessionId?: string;
}): Promise<void> {
  if (!isDatabaseConfigured()) throw new Error("Database is not configured");
  await query(
    `INSERT INTO feedback (entity_type, entity_id, feedback_type, payload, session_id)
     VALUES ($1, $2::uuid, $3, $4::jsonb, $5)`,
    [
      input.entityType.slice(0, 80),
      input.entityId,
      input.feedbackType.slice(0, 80),
      JSON.stringify(input.payload ?? {}),
      input.sessionId?.slice(0, 160) ?? null,
    ],
  );
}
