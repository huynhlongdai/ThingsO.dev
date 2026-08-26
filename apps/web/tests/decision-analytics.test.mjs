import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("decision events store bounded anonymous product context only", async () => {
  const migration = await source("../../../packages/db/migrations/0006_decision_events.sql");
  assert.match(migration, /CREATE TABLE decision_events/);
  assert.match(migration, /anonymous_session_id/);
  assert.match(migration, /search_result_open/);
  assert.match(migration, /compare_repository_open/);
  assert.match(migration, /repository_blueprint/);
  assert.match(migration, /evidence_expand/);
  assert.match(migration, /feedback_submit/);
  assert.doesNotMatch(migration, /ip_address|user_agent|email|account_id|fingerprint/i);
  assert.doesNotMatch(migration, /payload_json|metadata_json/);
});

test("anonymous session is ephemeral and analytics never blocks navigation", async () => {
  const client = await source("../components/decision-event.tsx");
  assert.match(client, /sessionStorage/);
  assert.match(client, /crypto\.randomUUID/);
  assert.match(client, /keepalive:\s*true/);
  assert.match(client, /\.catch\(\(\) =>/);
  assert.match(client, /data-decision-tracked="true"/);
  assert.doesNotMatch(client, /localStorage|document\.cookie|navigator\.userAgent/);
});

test("event API is allowlisted and does not derive identity from request metadata", async () => {
  const route = await source("../app/api/analytics/event/route.ts");
  assert.match(route, /decisionEventTypes/);
  assert.match(route, /decisionSurfaces/);
  assert.match(route, /uuidPattern/);
  assert.match(route, /recordDecisionEvent/);
  assert.doesNotMatch(route, /request\.ip|user-agent|cookies\.get|headers\.get/);
});

test("UDS requires two distinct decision actions instead of page views", async () => {
  const analytics = await source("../lib/decision-analytics.ts");
  assert.match(analytics, /count\(DISTINCT event_type\)/);
  assert.match(analytics, /distinct_decision_actions >= 2/);
  assert.match(analytics, /zero_result_rate/);
  assert.doesNotMatch(analytics, /page_view|pageview/);
});

test("primary decision funnel actions are instrumented", async () => {
  const search = await source("../app/search/page.tsx");
  const useCase = await source("../app/use-cases/[slug]/page.tsx");
  const repository = await source("../app/repos/[owner]/[name]/page.tsx");
  const blueprint = await source("../components/repository-blueprint-action.tsx");
  const observer = await source("../components/decision-analytics-observer.tsx");
  const feedbackRoute = await source("../app/api/feedback/route.ts");

  assert.match(search, /search_result_open/);
  assert.match(useCase, /use_case_repository_open/);
  assert.match(repository, /repository_compare/);
  assert.match(repository, /RepositoryEvidenceDrawer/);
  assert.match(blueprint, /repository_blueprint/);
  assert.match(blueprint, /readinessStage:\s*readiness\.stage/);
  assert.match(observer, /compare_repository_open/);
  assert.match(feedbackRoute, /feedback_submit/);
});
