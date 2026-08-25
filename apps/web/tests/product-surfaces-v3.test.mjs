import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("home uses layered decision-first product surfaces", async () => {
  const home = await source("../app/page.tsx");
  const css = await source("../app/surface-v3.css");
  const layout = await source("../app/layout.tsx");

  assert.match(home, /Choose software with evidence, not guesswork/);
  assert.match(home, /Decision workflow/);
  assert.match(home, /Discover → Analyze → Compare → Build/);
  assert.match(home, /Browse by what you need to accomplish/);
  assert.match(home, /Repository intelligence/);
  assert.match(css, /home-decision-preview/);
  assert.match(css, /home-usecase-grid/);
  assert.match(layout, /surface-v3\.css/);
});

test("discover separates capability and reviewed use-case regions", async () => {
  const discover = await source("../app/discover/page.tsx");

  assert.match(discover, /Explore software by capability, use case and evidence/);
  assert.match(discover, /discovery-panel--capabilities/);
  assert.match(discover, /discovery-panel--usecases/);
  assert.match(discover, /Reviewed use cases/);
  assert.match(discover, /Repository layer/);
});

test("search exposes a command center and collapsible decision filters", async () => {
  const search = await source("../app/search/page.tsx");

  assert.match(search, /surface-hero--search/);
  assert.match(search, /search-command__status/);
  assert.match(search, /search-filter-drawer/);
  assert.match(search, /What ranking reads/);
  assert.match(search, /Fit first/);
});

test("compare provides a decision summary before the full matrix", async () => {
  const compare = await source("../app/compare/page.tsx");

  assert.match(compare, /No universal winner/);
  assert.match(compare, /Decision snapshot/);
  assert.match(compare, /Strongest fit signal/);
  assert.match(compare, /Key trade-off/);
  assert.match(compare, /major evidence gap/);
  assert.match(compare, /Full decision matrix/);
  assert.match(compare, /Fit & decision/);
  assert.match(compare, /Operating reality/);
  assert.match(compare, /Product & implementation/);
  assert.match(compare, /Source facts/);
});

test("repository cards distinguish content layers and expose an explicit profile action", async () => {
  const card = await source("../components/repository-card.tsx");
  const css = await source("../app/surface-v3.css");

  assert.match(card, /repo-card__accent/);
  assert.match(card, /repo-card__footer/);
  assert.match(card, /Open intelligence →/);
  assert.match(css, /repo-card--v3/);
  assert.match(css, /repo-card__footer/);
});
