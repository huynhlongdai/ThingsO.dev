BEGIN;

-- Preserve source provenance for relations. V1 initially allowed only one source row per
-- repository pair/relation type, which could force AI and editorial evidence to overwrite
-- each other. Source type is part of identity from this migration forward.
ALTER TABLE repository_relations
  DROP CONSTRAINT repository_relations_pkey;

ALTER TABLE repository_relations
  ADD PRIMARY KEY (from_repository_id, to_repository_id, relation_type, source_type);

-- Lexical search indexes used by the V1 web/API search path.
CREATE INDEX IF NOT EXISTS repositories_search_fts_idx
  ON repositories USING gin (
    to_tsvector('simple', coalesce(full_name, '') || ' ' || coalesce(description, ''))
  );

CREATE INDEX IF NOT EXISTS source_documents_search_fts_idx
  ON source_documents USING gin (to_tsvector('simple', text_content));

CREATE INDEX IF NOT EXISTS taxonomy_terms_slug_trgm_idx
  ON taxonomy_terms USING gin (slug gin_trgm_ops);

CREATE INDEX IF NOT EXISTS ai_analyses_publishable_idx
  ON ai_analyses (repository_id, analysis_type, created_at DESC)
  WHERE review_status = 'approved';

COMMIT;
