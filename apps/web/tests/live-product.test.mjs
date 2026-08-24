import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("public discovery surfaces no longer import demo repositories", async () => {
  for (const path of ["../app/page.tsx", "../app/search/page.tsx", "../app/discover/page.tsx"]) {
    const text = await source(path);
    assert.doesNotMatch(text, /demoRepositories/);
  }
});

test("repository detail route is intelligence-first and preserves provenance", async () => {
  const page = await source("../app/repos/[owner]/[name]/page.tsx");
  const intelligence = await source("../components/repository-intelligence-v3.tsx");

  assert.match(page, /getRepositoryIntelligence/);
  assert.match(page, /RepositoryIntelligenceV3View/);
  assert.match(page, /Evidence & provenance/);
  assert.match(page, /Project Health/);
  assert.match(page, /GitHub source facts/);

  assert.match(intelligence, /Problem → solution/);
  assert.match(intelligence, /Architecture/);
  assert.match(intelligence, /Codebase map/);
  assert.match(intelligence, /Developer workflow/);
  assert.match(intelligence, /Deployment & operations/);
  assert.match(intelligence, /Decision guide/);
  assert.match(intelligence, /ProvenanceBadge kind="editorial"/);
});

test("public API and SEO routes exist", async () => {
  const searchApi = await source("../app/api/search/route.ts");
  const healthApi = await source("../app/api/health/route.ts");
  const sitemap = await source("../app/sitemap.ts");
  assert.match(searchApi, /searchRepositories/);
  assert.match(healthApi, /databaseHealthcheck/);
  assert.match(sitemap, /listRepositories/);
});
