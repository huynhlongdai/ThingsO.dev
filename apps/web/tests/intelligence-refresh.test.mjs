import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("repository detail may show last approved intelligence with explicit freshness disclosure", async () => {
  const page = await source("../app/repos/[owner]/[name]/page.tsx");
  const data = await source("../lib/intelligence-data.ts");
  const model = await source("../lib/intelligence.ts");

  assert.match(page, /allowStale: true/);
  assert.match(page, /Evidence refresh pending/);
  assert.match(page, /Last approved intelligence/);
  assert.match(page, /!intelligence\.isCurrentSnapshot/);

  assert.match(data, /options: \{ allowStale\?: boolean \} = \{\}/);
  assert.match(data, /\$2::boolean OR a\.source_snapshot_id = r\.current_snapshot_id/);
  assert.match(data, /ORDER BY \(a\.source_snapshot_id = r\.current_snapshot_id\) DESC/);
  assert.match(model, /isCurrentSnapshot: boolean/);
});

test("stale fallback is opt-in so comparison and blueprint remain current-snapshot fail-closed", async () => {
  const compare = await source("../app/compare/page.tsx");
  const blueprint = await source("../app/repos/[owner]/[name]/blueprint/page.tsx");

  assert.match(compare, /getRepositoryIntelligence/);
  assert.doesNotMatch(compare, /allowStale/);
  assert.match(blueprint, /getRepositoryIntelligence/);
  assert.doesNotMatch(blueprint, /allowStale/);
});
