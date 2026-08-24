import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { URL } from "node:url";

async function source(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("repository intelligence shows explicit sparse evidence states", async () => {
  const view = await source("../components/repository-intelligence-v3.tsx");
  assert.ok(view.includes("Not established from available evidence."));
  assert.ok(view.includes("evidence incomplete"));
  assert.ok(view.includes("intelligence.architecture.components.length"));
  assert.ok(view.includes("intelligence.architecture.dataFlow.length"));
  assert.ok(view.includes("intelligence.technology.items.length"));
  assert.ok(view.includes("intelligence.codebase.importantPaths.length"));
  assert.ok(view.includes("intelligence.developerWorkflow.commands.length"));
  assert.ok(view.includes('section="audience"'));
  assert.ok(view.includes('section="differentiation"'));
  assert.ok(view.includes('section="security_privacy"'));
  assert.ok(view.includes("claim.state"));
});
