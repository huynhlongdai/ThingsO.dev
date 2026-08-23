BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION thingso_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE repositories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  github_node_id text NOT NULL UNIQUE,
  owner text NOT NULL,
  name text NOT NULL,
  full_name text NOT NULL UNIQUE,
  github_url text NOT NULL,
  homepage_url text,
  description text,
  is_archived boolean NOT NULL DEFAULT false,
  is_fork boolean NOT NULL DEFAULT false,
  created_at_source timestamptz,
  updated_at_source timestamptz,
  pushed_at_source timestamptz,
  default_branch text,
  current_snapshot_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX repositories_owner_name_idx ON repositories (owner, name);
CREATE INDEX repositories_full_name_trgm_idx ON repositories USING gin (full_name gin_trgm_ops);

CREATE TRIGGER repositories_set_updated_at
BEFORE UPDATE ON repositories
FOR EACH ROW EXECUTE FUNCTION thingso_set_updated_at();

CREATE TABLE repository_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  captured_at timestamptz NOT NULL DEFAULT now(),
  source_api_version text NOT NULL,
  stars integer NOT NULL DEFAULT 0 CHECK (stars >= 0),
  forks integer NOT NULL DEFAULT 0 CHECK (forks >= 0),
  open_issues integer NOT NULL DEFAULT 0 CHECK (open_issues >= 0),
  watchers integer NOT NULL DEFAULT 0 CHECK (watchers >= 0),
  subscribers integer CHECK (subscribers IS NULL OR subscribers >= 0),
  disk_size_kb bigint CHECK (disk_size_kb IS NULL OR disk_size_kb >= 0),
  primary_language text,
  license_spdx text,
  release_count integer CHECK (release_count IS NULL OR release_count >= 0),
  latest_release_at timestamptz,
  contributor_count integer CHECK (contributor_count IS NULL OR contributor_count >= 0),
  payload_hash text NOT NULL,
  raw_payload_json jsonb,
  UNIQUE (repository_id, payload_hash)
);

ALTER TABLE repositories
  ADD CONSTRAINT repositories_current_snapshot_fk
  FOREIGN KEY (current_snapshot_id) REFERENCES repository_snapshots(id) ON DELETE SET NULL;

CREATE INDEX repository_snapshots_repo_captured_idx
  ON repository_snapshots (repository_id, captured_at DESC);

CREATE TABLE repository_languages (
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES repository_snapshots(id) ON DELETE CASCADE,
  language text NOT NULL,
  bytes bigint NOT NULL CHECK (bytes >= 0),
  percentage numeric(7,4) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  PRIMARY KEY (snapshot_id, language)
);

CREATE INDEX repository_languages_repo_idx ON repository_languages (repository_id);

CREATE TABLE source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('readme','documentation','package','other')),
  source_url text NOT NULL,
  ref text,
  content_hash text NOT NULL,
  text_content text NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (repository_id, document_type, source_url, content_hash)
);

CREATE INDEX source_documents_repo_type_idx ON source_documents (repository_id, document_type);

CREATE TABLE taxonomy_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  axis text NOT NULL,
  slug text NOT NULL,
  label text NOT NULL,
  parent_id uuid REFERENCES taxonomy_terms(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('proposed','active','deprecated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (axis, slug)
);

CREATE TABLE taxonomy_aliases (
  term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
  alias text NOT NULL,
  PRIMARY KEY (term_id, alias)
);

CREATE TABLE ai_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  analysis_type text NOT NULL,
  schema_version text NOT NULL,
  prompt_version text NOT NULL,
  model_provider text NOT NULL,
  model_name text NOT NULL,
  source_snapshot_id uuid REFERENCES repository_snapshots(id) ON DELETE SET NULL,
  source_document_ids uuid[] NOT NULL DEFAULT '{}',
  output_json jsonb NOT NULL,
  confidence numeric(5,4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected','human_review')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_analyses_repo_type_created_idx ON ai_analyses (repository_id, analysis_type, created_at DESC);
CREATE INDEX ai_analyses_review_status_idx ON ai_analyses (review_status);

CREATE TABLE repository_taxonomy (
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  term_id uuid NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('source','ai','editorial')),
  confidence numeric(5,4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  analysis_id uuid REFERENCES ai_analyses(id) ON DELETE SET NULL,
  PRIMARY KEY (repository_id, term_id, source_type)
);

CREATE INDEX repository_taxonomy_term_repo_idx ON repository_taxonomy (term_id, repository_id);

CREATE TABLE use_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('proposed','active','deprecated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER use_cases_set_updated_at
BEFORE UPDATE ON use_cases
FOR EACH ROW EXECUTE FUNCTION thingso_set_updated_at();

CREATE TABLE repository_use_cases (
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  use_case_id uuid NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
  fit_score numeric(5,4) NOT NULL CHECK (fit_score >= 0 AND fit_score <= 1),
  reason text,
  source_type text NOT NULL CHECK (source_type IN ('source','ai','editorial')),
  analysis_id uuid REFERENCES ai_analyses(id) ON DELETE SET NULL,
  reviewed boolean NOT NULL DEFAULT false,
  PRIMARY KEY (repository_id, use_case_id, source_type)
);

CREATE INDEX repository_use_cases_use_case_fit_idx ON repository_use_cases (use_case_id, fit_score DESC);

CREATE TABLE repository_scores (
  repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES repository_snapshots(id) ON DELETE CASCADE,
  score_version text NOT NULL,
  total_score numeric(6,3) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  maintenance_score numeric(6,3) NOT NULL CHECK (maintenance_score >= 0 AND maintenance_score <= 100),
  adoption_score numeric(6,3) NOT NULL CHECK (adoption_score >= 0 AND adoption_score <= 100),
  community_score numeric(6,3) NOT NULL CHECK (community_score >= 0 AND community_score <= 100),
  documentation_score numeric(6,3) NOT NULL CHECK (documentation_score >= 0 AND documentation_score <= 100),
  operations_score numeric(6,3) NOT NULL CHECK (operations_score >= 0 AND operations_score <= 100),
  license_clarity_score numeric(6,3) NOT NULL CHECK (license_clarity_score >= 0 AND license_clarity_score <= 100),
  maturity_score numeric(6,3) NOT NULL CHECK (maturity_score >= 0 AND maturity_score <= 100),
  metadata_score numeric(6,3) NOT NULL CHECK (metadata_score >= 0 AND metadata_score <= 100),
  explanation_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (repository_id, snapshot_id, score_version)
);

CREATE TABLE repository_relations (
  from_repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  to_repository_id uuid NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  relation_type text NOT NULL CHECK (relation_type IN ('alternative','similar','integrates_with','depends_on','complements')),
  source_type text NOT NULL CHECK (source_type IN ('source','ai','editorial')),
  confidence numeric(5,4) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  analysis_id uuid REFERENCES ai_analyses(id) ON DELETE SET NULL,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (from_repository_id, to_repository_id, relation_type),
  CHECK (from_repository_id <> to_repository_id)
);

CREATE INDEX repository_relations_from_type_idx ON repository_relations (from_repository_id, relation_type);
CREATE INDEX repository_relations_to_type_idx ON repository_relations (to_repository_id, relation_type);

CREATE TABLE build_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id uuid REFERENCES repositories(id) ON DELETE SET NULL,
  use_case_id uuid REFERENCES use_cases(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  problem text NOT NULL,
  target_user text,
  complexity text CHECK (complexity IS NULL OR complexity IN ('low','medium','high','unknown')),
  architecture_json jsonb NOT NULL DEFAULT '{}',
  assumptions_json jsonb NOT NULL DEFAULT '[]',
  risks_json jsonb NOT NULL DEFAULT '[]',
  analysis_id uuid REFERENCES ai_analyses(id) ON DELETE SET NULL,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected','human_review')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER build_ideas_set_updated_at
BEFORE UPDATE ON build_ideas
FOR EACH ROW EXECUTE FUNCTION thingso_set_updated_at();

CREATE TABLE tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  canonical_url text NOT NULL,
  tool_type text NOT NULL,
  verified_at timestamptz,
  metadata_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER tools_set_updated_at
BEFORE UPDATE ON tools
FOR EACH ROW EXECUTE FUNCTION thingso_set_updated_at();

CREATE TABLE contextual_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  placement_context text NOT NULL,
  disclosure_type text NOT NULL CHECK (disclosure_type IN ('affiliate','sponsored','referral','none')),
  affiliate_url text,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  verified_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','expired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);

CREATE TABLE search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text_normalized text NOT NULL,
  query_embedding jsonb,
  anonymous_session_id text,
  result_count integer NOT NULL DEFAULT 0 CHECK (result_count >= 0),
  clicked_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX search_queries_created_idx ON search_queries (created_at DESC);

CREATE TABLE feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  feedback_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX feedback_entity_idx ON feedback (entity_type, entity_id, created_at DESC);

CREATE TABLE ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  entity_id uuid,
  payload_json jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','retry','succeeded','failed','dead')),
  priority integer NOT NULL DEFAULT 100,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  locked_by text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER ingestion_jobs_set_updated_at
BEFORE UPDATE ON ingestion_jobs
FOR EACH ROW EXECUTE FUNCTION thingso_set_updated_at();

CREATE INDEX ingestion_jobs_claim_idx ON ingestion_jobs (status, priority, available_at);
CREATE INDEX ingestion_jobs_entity_idx ON ingestion_jobs (entity_id, job_type);

COMMIT;
