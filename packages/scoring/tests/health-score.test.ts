import assert from "node:assert/strict";
import test from "node:test";

import { calculateHealthScore, HEALTH_SCORE_VERSION, type HealthScoreInput } from "../src/index";

const now = new Date("2026-08-23T00:00:00Z");

function healthy(overrides: Partial<HealthScoreInput> = {}): HealthScoreInput {
  return {
    now,
    createdAt: new Date("2022-01-01T00:00:00Z"),
    pushedAt: new Date("2026-08-20T00:00:00Z"),
    stars: 20_000,
    forks: 2_500,
    subscribers: 250,
    contributors: 120,
    readmePresent: true,
    descriptionPresent: true,
    homepagePresent: true,
    primaryLanguagePresent: true,
    defaultBranchPresent: true,
    releaseCount: 15,
    latestReleaseAt: new Date("2026-08-15T00:00:00Z"),
    licenseSpdx: "MIT",
    archived: false,
    ...overrides,
  };
}

test("health score is deterministic and versioned", () => {
  const first = calculateHealthScore(healthy());
  const second = calculateHealthScore(healthy());
  assert.deepEqual(first, second);
  assert.equal(first.version, HEALTH_SCORE_VERSION);
  assert.ok(first.total > 80 && first.total <= 100);
});

test("archived and stale projects lose maintenance evidence", () => {
  const active = calculateHealthScore(healthy());
  const archived = calculateHealthScore(healthy({ archived: true }));
  const stale = calculateHealthScore(healthy({ pushedAt: new Date("2020-01-01T00:00:00Z") }));
  assert.equal(archived.maintenance, 0);
  assert.ok(stale.maintenance < active.maintenance);
  assert.ok(archived.total < active.total);
});

test("missing docs and license are not guessed", () => {
  const score = calculateHealthScore(healthy({
    readmePresent: false,
    descriptionPresent: false,
    homepagePresent: false,
    licenseSpdx: null,
  }));
  assert.equal(score.documentation, 0);
  assert.equal(score.licenseClarity, 0);
});

test("popularity cannot compensate for all missing operational signals", () => {
  const score = calculateHealthScore(healthy({
    stars: 1_000_000,
    forks: 100_000,
    pushedAt: new Date("2019-01-01T00:00:00Z"),
    readmePresent: false,
    descriptionPresent: false,
    homepagePresent: false,
    releaseCount: 0,
    latestReleaseAt: null,
    licenseSpdx: null,
  }));
  assert.ok(score.total < 65);
});
