import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("V3 publication reconciles stale curated data after successful deploys", async () => {
  const workflow = await source("../../../.github/workflows/publish-intelligence-v3.yml");

  assert.match(workflow, /workflows: \["Refresh intelligence evidence", "Deploy production"\]/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /id: reconcile/);
  assert.match(workflow, /prompt_version = 'manual-intelligence-v3-usecases-v1'/);
  assert.match(workflow, /ru\.source_type = 'editorial' AND ru\.reviewed = true/);
  assert.match(workflow, /ACTIVE_USE_CASES/);
  assert.match(workflow, /NEEDED=false/);
  assert.match(workflow, /needed=\$NEEDED/);
  assert.match(workflow, /if: steps\.reconcile\.outputs\.needed == 'true'/);
  assert.match(workflow, /test "\$VERSIONED" -ge 100/);
  assert.match(workflow, /test "\$USE_CASE_REPOS" -ge 100/);
  assert.match(workflow, /test "\$ACTIVE_USE_CASES" -eq 36/);
});
