import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("evidence-depth publication reconciles current snapshots without racing legacy V3", async () => {
  const refresh = await source("../../../.github/workflows/refresh-intelligence-evidence.yml");
  const depthPublish = await source("../../../.github/workflows/publish-intelligence-quality-v2.yml");
  const legacyPublish = await source("../../../.github/workflows/publish-intelligence-v3.yml");
  const verify = await source("../../../.github/workflows/verify-intelligence-production.yml");

  assert.match(refresh, /workflows: \["Deploy production"\]/);
  assert.match(refresh, /change-gate:/);
  assert.match(refresh, /const watched = \[/);
  assert.match(refresh, /semantic_depth\.py/);
  assert.match(refresh, /files\.some\(file => watched\.includes\(file\)\)/);
  assert.match(refresh, /ingest "\$full_name"/);
  assert.match(refresh, /--repository "\$full_name"/);
  assert.match(refresh, /import_quality_intelligence\.py "\$output"/);
  assert.match(refresh, /test "\$DEPTH" -eq "\$REPOS"/);

  assert.match(depthPublish, /^name: Publish intelligence evidence-depth v1/m);
  assert.match(depthPublish, /workflows: \["Refresh intelligence evidence"\]/);
  assert.doesNotMatch(depthPublish, /workflows: \["Deploy production"/);
  assert.match(depthPublish, /evidence-depth-editorial-v1/);
  assert.match(depthPublish, /manual-intelligence-v3-evidence-depth-v1/);
  assert.match(depthPublish, /source_snapshot_id = r\.current_snapshot_id/);
  assert.match(depthPublish, /test "\$APPROVED" -eq "\$TOTAL"/);
  assert.match(depthPublish, /test "\$REVIEW" -eq 0/);

  assert.match(legacyPublish, /^name: Legacy publish repository intelligence v3/m);
  assert.match(legacyPublish, /workflow_dispatch:/);
  assert.doesNotMatch(legacyPublish, /workflow_run:/);
  assert.doesNotMatch(legacyPublish, /push:/);
  assert.match(legacyPublish, /Legacy publication warning/);

  assert.match(verify, /workflows: \["Publish intelligence evidence-depth v1"\]/);
  assert.match(verify, /qa_published_intelligence\.py/);
  assert.match(verify, /Analyst Team/);
  assert.match(verify, /Trader Agent/);
});
