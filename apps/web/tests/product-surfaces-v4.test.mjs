import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("use-case surfaces are job-to-be-done and decision-first", async () => {
  const index = await source("../app/use-cases/page.tsx");
  const detail = await source("../app/use-cases/[slug]/page.tsx");

  assert.match(index, /Start with the job\. Then choose the software\./);
  assert.match(index, /Job-to-be-done catalog/);
  assert.match(index, /Reviewed matches/);
  assert.match(index, /Fit first/);
  assert.match(index, /listReviewedUseCases/);

  assert.match(detail, /Compare top matches/);
  assert.match(detail, /Fit explains relevance/);
  assert.match(detail, /Health explains project condition/);
  assert.match(detail, /Unknown stays visible/);
  assert.match(detail, /showCompareAction: true/);
  assert.match(detail, /getReviewedUseCase/);
});

test("build ideas distinguish concept from implementation and avoid raw JSON UI", async () => {
  const index = await source("../app/ideas/page.tsx");
  const detail = await source("../app/ideas/[slug]/page.tsx");

  assert.match(index, /Reviewed concept/);
  assert.match(index, /Repository blueprint/);
  assert.match(index, /Your validation/);
  assert.match(index, /ProvenanceBadge kind="ai_inference"/);

  assert.match(detail, /This is a hypothesis to validate/);
  assert.match(detail, /architectureEntries/);
  assert.match(detail, /Architecture/);
  assert.match(detail, /Assumptions & risks/);
  assert.doesNotMatch(detail, /JSON\.stringify\(idea\.architecture, null, 2\)/);
  assert.doesNotMatch(detail, /json-panel/);
});

test("blueprint is an evidence-led execution workspace and remains current-v3 fail-closed", async () => {
  const blueprint = await source("../app/repos/[owner]/[name]/blueprint/page.tsx");
  const data = await source("../lib/intelligence-data.ts");

  assert.match(blueprint, /Evidence snapshot|Blueprint evidence summary|Established evidence fields/);
  assert.match(blueprint, /blueprint-phase-nav/);
  assert.match(blueprint, /blueprint-decision/);
  assert.match(blueprint, /blueprint-local/);
  assert.match(blueprint, /blueprint-architecture/);
  assert.match(blueprint, /blueprint-production/);
  assert.match(blueprint, /blueprint-security/);
  assert.match(blueprint, /Unknown fields are intentionally preserved/);
  assert.match(blueprint, /if \(!repo \|\| !intelligence\) notFound\(\)/);
  assert.match(data, /a\.source_snapshot_id = r\.current_snapshot_id/);
});

test("methodology explains provenance, fit versus health and visible unknowns", async () => {
  const page = await source("../app/about/methodology/page.tsx");

  assert.match(page, /Know what ThingsO knows—and what it does not/);
  assert.match(page, /Source facts/);
  assert.match(page, /Deterministic health/);
  assert.match(page, /Reviewed intelligence/);
  assert.match(page, /Missing evidence stays missing/);
  assert.match(page, /Fit is not health/);
  assert.match(page, /What ThingsO does not claim/);
});

test("navigation has active state and phase-3 styles are loaded", async () => {
  const header = await source("../components/site-header.tsx");
  const layout = await source("../app/layout.tsx");
  const styles = await source("../app/surface-v4.css");

  assert.match(header, /usePathname/);
  assert.match(header, /aria-current/);
  assert.match(header, /site-nav__link--active/);
  assert.match(layout, /surface-v4\.css/);
  assert.match(styles, /surface-hero/);
  assert.match(styles, /use-case-catalog-grid/);
  assert.match(styles, /build-idea-grid-v2/);
  assert.match(styles, /blueprint-phase-nav/);
  assert.match(styles, /trust-stack-grid/);
  assert.match(styles, /@media \(max-width: 480px\)/);
});
