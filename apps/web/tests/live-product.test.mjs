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

test("repository detail is decision-first, layered and preserves provenance", async () => {
  const page = await source("../app/repos/[owner]/[name]/page.tsx");
  const intelligence = await source("../components/repository-intelligence-v3.tsx");
  const snapshot = await source("../components/repository-decision-snapshot.tsx");
  const sectionNav = await source("../components/repository-section-nav.tsx");

  assert.match(page, /getRepositoryIntelligence/);
  assert.match(page, /RepositoryDecisionSnapshot/);
  assert.match(page, /RepositorySectionNav/);
  assert.match(page, /RepositoryIntelligenceV3View/);
  assert.match(page, /Health, GitHub facts & evidence/);
  assert.match(page, /id="evidence"/);

  assert.match(snapshot, /Decision snapshot/);
  assert.match(snapshot, /Best for/);
  assert.match(snapshot, /Avoid when/);
  assert.match(snapshot, /Key trade-off/);
  assert.match(snapshot, /Minimum deployment/);
  assert.match(snapshot, /Operational complexity/);

  assert.match(intelligence, /Problem → solution/);
  assert.match(intelligence, /Capabilities & limitations/);
  assert.match(intelligence, /Fit & decision guide/);
  assert.match(intelligence, /TechnicalSection/);
  assert.match(intelligence, /Architecture/);
  assert.match(intelligence, /Developer workflow/);
  assert.match(intelligence, /Deployment & operations/);
  assert.match(intelligence, /ProvenanceBadge kind="editorial"/);

  const problemIndex = intelligence.indexOf("Problem → solution");
  const capabilityIndex = intelligence.indexOf("Capabilities & limitations");
  const decisionIndex = intelligence.indexOf("Fit & decision guide");
  const architectureIndex = intelligence.indexOf('id="architecture"');
  assert.ok(problemIndex >= 0 && capabilityIndex > problemIndex);
  assert.ok(decisionIndex > capabilityIndex && architectureIndex > decisionIndex);

  assert.match(sectionNav, /On this page/);
  assert.match(sectionNav, /Problem & solution/);
  assert.match(sectionNav, /Decision guide/);
  assert.match(sectionNav, /Evidence/);
});

test("responsive navigation keeps every primary product surface reachable", async () => {
  const header = await source("../components/site-header.tsx");
  const globals = await source("../app/globals.css");
  const theme = await source("../app/theme-v2.css");
  const layout = await source("../app/layout.tsx");

  for (const route of ["/discover", "/use-cases", "/compare", "/ideas", "/about/methodology"]) {
    assert.match(header, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.doesNotMatch(globals, /site-nav a:nth-child\(2\).*display:\s*none/);
  assert.match(theme, /site-nav--product/);
  assert.match(theme, /overflow-x:\s*auto/);
  assert.match(layout, /skip-link/);
  assert.match(layout, /id="app-content"/);
});

test("comparison is current-v3 and decision-first", async () => {
  const page = await source("../app/compare/page.tsx");
  const picker = await source("../components/compare-picker.tsx");
  const intelligenceData = await source("../lib/intelligence-data.ts");

  assert.match(page, /ComparePicker/);
  assert.match(page, /getRepositoryIntelligence/);
  assert.match(page, /Choose when/);
  assert.match(page, /Avoid when/);
  assert.match(page, /Evaluate first/);
  assert.match(page, /Minimum deployment/);
  assert.match(page, /Operational complexity/);
  assert.doesNotMatch(page, /Reviewed AI summary/);

  assert.match(picker, /Compare selected/);
  assert.match(picker, /Select repository/);
  assert.match(intelligenceData, /a\.source_snapshot_id = r\.current_snapshot_id/);
});

test("search ranks current Repository Intelligence v3 and preserves reviewed fit provenance", async () => {
  const page = await source("../app/search/page.tsx");
  const search = await source("../lib/search-v3.ts");
  const card = await source("../components/repository-card.tsx");
  const searchApi = await source("../app/api/search/route.ts");

  assert.match(page, /searchRepositoriesV3/);
  assert.match(page, /Decision filters/);
  assert.match(page, /Minimum health/);
  assert.match(page, /Capability/);
  assert.match(page, /Repository Intelligence v3/);

  assert.match(search, /analysis_type = 'repository_intelligence'/);
  assert.match(search, /schema_version = 'repo-intelligence-v3'/);
  assert.match(search, /source_snapshot_id = r\.current_snapshot_id/);
  assert.match(search, /choose_when/);
  assert.match(search, /evaluate_first/);
  assert.match(search, /score\.total_score >= \$4/);
  assert.match(search, /ru\.source_type IN \('ai', 'editorial'\) AND ru\.reviewed = true/);
  assert.match(search, /fit\.source_type AS fit_source/);
  assert.match(search, /fitSource: fitSource\(row\.fit_source\)/);

  assert.match(card, /provenanceKind\(repo\.fitSource\)/);
  assert.match(card, /repo\.fitReason && repo\.fitSource/);
  assert.doesNotMatch(card, /ProvenanceBadge kind="ai_inference" \/>/);
  assert.match(searchApi, /searchRepositoriesV3/);
  assert.match(searchApi, /category/);
  assert.match(searchApi, /minHealth/);
});

test("use-case pages rank the selected reviewed fit rather than an unrelated top fit", async () => {
  const page = await source("../app/use-cases/[slug]/page.tsx");
  const index = await source("../app/use-cases/page.tsx");
  const data = await source("../lib/use-case-data.ts");
  const card = await source("../components/repository-card.tsx");

  assert.match(index, /listReviewedUseCases/);
  assert.match(index, /reviewed matches/i);
  assert.match(page, /getReviewedUseCase/);
  assert.match(page, /fitScore: repo\.fitScore/);
  assert.match(page, /fitSource: repo\.fitSource/);
  assert.match(page, /showCompareAction: true/);
  assert.match(page, /Rank \$\{index \+ 1\}/);

  assert.match(data, /selected_ru\.fit_score/);
  assert.match(data, /selected_ru\.reason AS fit_reason/);
  assert.match(data, /selected_ru\.source_type AS fit_source/);
  assert.match(data, /selected_u\.slug = \$1/);
  assert.match(data, /selected_ru\.source_type IN \('ai', 'editorial'\) AND selected_ru\.reviewed = true/);
  assert.match(data, /a\.model_provider = 'editorial'/);
  assert.match(data, /a\.source_snapshot_id = r\.current_snapshot_id/);

  assert.match(card, /Math\.round\(repo\.fitScore \* 100\)/);
  assert.match(card, /Compare this repository/);
});

test("home, discover and sitemap publish only reviewed use cases", async () => {
  const home = await source("../app/page.tsx");
  const discover = await source("../app/discover/page.tsx");
  const sitemap = await source("../app/sitemap.ts");
  const data = await source("../lib/use-case-data.ts");

  for (const text of [home, discover, sitemap]) {
    assert.match(text, /listReviewedUseCases/);
    assert.doesNotMatch(text, /listUseCases/);
  }
  assert.match(home, /fallbackSearches/);
  assert.match(discover, /reviewed/);
  assert.match(data, /ru\.source_type IN \('ai', 'editorial'\) AND ru\.reviewed = true/);
});

test("implementation blueprint is current-v3, evidence-backed and fail-closed", async () => {
  const blueprint = await source("../app/repos/[owner]/[name]/blueprint/page.tsx");
  const repoPage = await source("../app/repos/[owner]/[name]/page.tsx");
  const intelligenceData = await source("../lib/intelligence-data.ts");

  assert.match(blueprint, /getRepositoryIntelligence/);
  assert.match(blueprint, /if \(!repo \|\| !intelligence\) notFound\(\)/);
  assert.match(blueprint, /Build · evidence-backed blueprint/);
  assert.match(blueprint, /Decision gate/);
  assert.match(blueprint, /Local proof/);
  assert.match(blueprint, /Architecture/);
  assert.match(blueprint, /Integration/);
  assert.match(blueprint, /Production/);
  assert.match(blueprint, /Security & privacy/);
  assert.match(blueprint, /Evidence selectors/);
  assert.match(blueprint, /Unknown fields are intentionally preserved/);
  assert.match(blueprint, /ProvenanceBadge kind="editorial"/);
  assert.doesNotMatch(blueprint, /build_ideas|listBuildIdeas|getBuildIdea/);

  assert.match(repoPage, /Build Blueprint →/);
  assert.match(repoPage, /\/blueprint`/);
  assert.match(intelligenceData, /a\.review_status = 'approved'/);
  assert.match(intelligenceData, /a\.source_snapshot_id = r\.current_snapshot_id/);
});

test("public API and SEO routes exist", async () => {
  const searchApi = await source("../app/api/search/route.ts");
  const healthApi = await source("../app/api/health/route.ts");
  const sitemap = await source("../app/sitemap.ts");
  assert.match(searchApi, /searchRepositoriesV3/);
  assert.match(healthApi, /databaseHealthcheck/);
  assert.match(sitemap, /listRepositories/);
});
