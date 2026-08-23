import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../migrations/0001_initial.sql", import.meta.url);

const requiredTables = [
  "repositories",
  "repository_snapshots",
  "repository_languages",
  "source_documents",
  "taxonomy_terms",
  "ai_analyses",
  "repository_taxonomy",
  "use_cases",
  "repository_use_cases",
  "repository_scores",
  "repository_relations",
  "build_ideas",
  "tools",
  "contextual_offers",
  "search_queries",
  "feedback",
  "ingestion_jobs"
];

test("initial migration declares all V1 canonical tables", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const table of requiredTables) {
    assert.match(sql, new RegExp(`CREATE TABLE ${table}\\s*\\(`));
  }
});

test("facts and AI analysis are stored separately", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /CREATE TABLE repository_snapshots/);
  assert.match(sql, /CREATE TABLE ai_analyses/);
  assert.match(sql, /review_status/);
});
