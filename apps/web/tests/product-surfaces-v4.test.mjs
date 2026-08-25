import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("use-case index is a reviewed decision library rather than a flat idea grid", async () => {
  const page = await source("../app/use-cases/page.tsx");
  const css = await source("../app/usecase-v4.css");

  assert.match(page, /Start with the job, then choose the software/);
  assert.match(page, /Decision contexts/);
  assert.match(page, /Reviewed matches/);
  assert.match(page, /Fit first/);
  assert.match(page, /usecase-library-grid/);
  assert.match(css, /usecase-library-card/);
  assert.doesNotMatch(page, /className="idea-grid"/);
});

test("use-case detail explains ranking before showing ranked repositories", async () => {
  const page = await source("../app/use-cases/[slug]/page.tsx");

  assert.match(page, /Reviewed matches/);
  assert.match(page, /Top fit/);
  assert.match(page, /Fit \+ health/);
  assert.match(page, /How ranking should be interpreted|usecase-ranking-explainer/);
  assert.match(page, /Ranked candidates/);
  assert.match(page, /use-case-rank--v3/);
});

test("build ideas visibly remain reviewed hypotheses", async () => {
  const index = await source("../app/ideas/page.tsx");
  const detail = await source("../app/ideas/[slug]/page.tsx");

  assert.match(index, /reviewed inference/i);
  assert.match(index, /starting hypotheses/i);
  assert.match(index, /Validate/);
  assert.match(index, /build-idea-grid/);
  assert.match(detail, /Reviewed Build Idea/);
  assert.match(detail, /Interpretation boundary/);
  assert.match(detail, /Hypothesis/);
  assert.match(detail, /Assumptions & risks/);
  assert.match(detail, /Before building/);
});

test("blueprint stays evidence-first while using the product workspace", async () => {
  const page = await source("../app/repos/[owner]/[name]/blueprint/page.tsx");
  const css = await source("../app/build-v4.css");
  const layout = await source("../app/layout.tsx");

  assert.match(page, /page-shell page-shell--wide/);
  assert.match(page, /Build · evidence-backed blueprint/);
  assert.match(page, /unknowns remain explicit/i);
  assert.match(page, /Compare before committing/);
  assert.match(page, /Unknown fields are intentionally preserved/);
  assert.match(css, /blueprint-phase/);
  assert.match(layout, /usecase-v4\.css/);
  assert.match(layout, /build-v4\.css/);
});
