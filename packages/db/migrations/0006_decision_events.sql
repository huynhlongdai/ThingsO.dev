BEGIN;

CREATE TABLE decision_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_session_id text NOT NULL CHECK (char_length(anonymous_session_id) BETWEEN 8 AND 80),
  event_type text NOT NULL CHECK (event_type IN (
    'search_result_open',
    'use_case_repository_open',
    'repository_compare',
    'compare_repository_open',
    'repository_blueprint',
    'compare_blueprint',
    'evidence_expand',
    'build_idea_open',
    'feedback_submit'
  )),
  source_surface text NOT NULL CHECK (source_surface IN (
    'home',
    'discover',
    'search',
    'use-case',
    'repository',
    'compare',
    'blueprint',
    'build',
    'methodology'
  )),
  repository_full_name text CHECK (repository_full_name IS NULL OR char_length(repository_full_name) <= 180),
  use_case_slug text CHECK (use_case_slug IS NULL OR char_length(use_case_slug) <= 120),
  readiness_stage text CHECK (readiness_stage IS NULL OR readiness_stage IN (
    'evidence-safe',
    'analyzed',
    'decision-ready',
    'blueprint-ready'
  )),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX decision_events_created_idx ON decision_events (created_at DESC);
CREATE INDEX decision_events_session_created_idx ON decision_events (anonymous_session_id, created_at DESC);
CREATE INDEX decision_events_type_created_idx ON decision_events (event_type, created_at DESC);

COMMENT ON TABLE decision_events IS
  'Anonymous product decision events. No IP, user-agent, account identifier, arbitrary payload, or fingerprint data is stored.';

COMMIT;
