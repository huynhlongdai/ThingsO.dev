import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("public discovery surfaces no longer import demo repositories", async () => {
  for (const path of ["../app/page.tsx", "../app/search/page.tsx", "../app/discover/page.tsx"]) {
    const text = await source(path);
    assert.doesNotMatch(text, /demoRepositories/);
  }
});

test("repository detail route exposes provenance primitives", async () => {
  const text = await source("../app/repos/[owner]/[name]/page.tsx");
  assert.match(text, /Source provenance/);
  assert.match(text, /Reviewed AI analysis/);
  assert.match(text, /Project Health/);
});

test("public API and SEO routes exist", async () => {
  const searchApi = await source("../app/api/search/route.ts");
  const healthApi = await source("../app/api/health/route.ts");
  const sitemap = await source("../app/sitemap.ts");
  assert.match(searchApi, /searchRepositories/);
  assert.match(healthApi, /databaseHealthcheck/);
  assert.match(sitemap, /listRepositories/);
});
