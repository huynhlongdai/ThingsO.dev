import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL("../migrations/0002_trust_and_search.sql", import.meta.url);

test("relation provenance becomes part of relation identity", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(
    sql,
    /PRIMARY KEY \(from_repository_id, to_repository_id, relation_type, source_type\)/
  );
});

test("V1 lexical search indexes are declared", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /repositories_search_fts_idx/);
  assert.match(sql, /source_documents_search_fts_idx/);
  assert.match(sql, /taxonomy_terms_slug_trgm_idx/);
});
