import assert from "node:assert/strict";
import test from "node:test";

import { getRepositoryReadiness } from "../lib/repository-readiness.ts";

const unknown = () => ({ value: null, state: "unknown", confidence: null, evidence: [] });
const known = (value, evidence = ["readme"]) => ({ value, state: "known", confidence: 0.9, evidence });

function fixture() {
  return {
    schemaVersion: "repo-intelligence-v3",
    identity: { definition: "A repository-specific project definition.", productType: "library", primaryRole: "runtime", primaryCategory: "developer-tool", secondaryCategories: [], interactionModel: null, intendedScope: null, evidence: ["readme"] },
    problem: { problemStatement: "", painPoints: [], solutionApproach: "", whyItMatters: null, evidence: ["readme"] },
    differentiation: { differentiators: [], designPhilosophy: [], uniqueCapabilities: [], commodityCapabilities: [], tradeoffsCreatedByDesign: [], evidence: [] },
    audience: { targetUsers: [], teamProfiles: [], skillLevel: null, jobsToBeDone: [], bestFor: [], poorFit: [], evidence: [] },
    capabilities: [],
    limitations: [],
    architecture: { overview: "", style: unknown(), executionModel: unknown(), stateModel: unknown(), components: [], dataFlow: [], controlFlow: unknown(), persistenceModel: unknown(), concurrencyModel: unknown(), isolationModel: unknown(), scalingModel: unknown(), evidence: [] },
    technology: { items: [], apiStyle: [], protocols: [], evidence: [] },
    codebase: { structureSummary: "", importantPaths: [], entryPoints: [], startReading: [], extensionPoints: [], evidence: [] },
    developerWorkflow: { localSetup: unknown(), commands: [], build: unknown(), tests: unknown(), lint: unknown(), typecheck: unknown(), debugging: unknown(), migrations: unknown(), ciCd: unknown(), contributionProcess: unknown(), releaseProcess: unknown(), evidence: [] },
    integration: { extensionModel: unknown(), pluginSystem: unknown(), apis: [], protocols: [], integrations: [], addingExtension: unknown(), evidence: [] },
    deploymentOperations: { minimumDeployment: unknown(), productionTopology: unknown(), requiredServices: [], persistence: unknown(), configuration: unknown(), scaling: unknown(), observability: unknown(), backupUpgrade: unknown(), failureRecovery: unknown(), resourceProfile: unknown(), operationalRisks: [], evidence: [] },
    securityPrivacy: { authentication: unknown(), authorization: unknown(), secrets: unknown(), networkExposure: unknown(), sandboxing: unknown(), multiTenancy: unknown(), dataPersisted: unknown(), dataLeavesSystem: unknown(), telemetry: unknown(), securityRisks: [], evidence: [] },
    projectSignals: { maturity: unknown(), governance: unknown(), licensing: unknown(), adoptionSignals: [], ecosystem: [], evolution: [], evidence: [] },
    decision: { chooseWhen: [], avoidWhen: [], evaluateFirst: [], tradeoffs: [], learningCurve: "unknown", operationalComplexity: "unknown", migrationCost: "unknown", lockIn: "unknown", comparisonDimensions: {}, evidence: [] },
    learning: { learnings: [], readingOrder: [], reusablePatterns: [], reusableComponents: [], evidence: [] },
    sectionConfidence: {}, confidence: 0.9, provider: "editorial", model: "fixture", createdAt: new Date(0).toISOString(),
  };
}

function decisionFixture() {
  const profile = fixture();
  profile.problem.problemStatement = "Teams need a repeatable repository-specific workflow for this job.";
  profile.problem.solutionApproach = "The project exposes a concrete runtime and implementation model.";
  profile.capabilities = ["Executes the documented core workflow"];
  profile.technology.items = [{ name: "TypeScript", category: "language", role: "implementation", state: "known", evidence: ["manifest"] }];
  profile.codebase.importantPaths = [{ path: "src/main.ts", purpose: "runtime entry point", evidence: ["source_entrypoint"] }];
  profile.codebase.evidence = ["repository_tree", "source_entrypoint"];
  profile.architecture.overview = "The runtime coordinates a documented execution pipeline.";
  profile.architecture.style = known("modular runtime", ["readme"]);
  profile.architecture.evidence = ["readme", "source_entrypoint"];
  profile.audience.bestFor = ["Teams that need this documented workflow"];
  profile.audience.poorFit = ["Teams needing a materially different execution model"];
  profile.audience.evidence = ["readme"];
  profile.limitations = ["The current evidence does not support every operating environment"];
  profile.decision.chooseWhen = ["The documented execution model matches the intended use case"];
  profile.decision.avoidWhen = ["The required operating model conflicts with the documented runtime"];
  profile.decision.evaluateFirst = ["Verify workload and deployment constraints"];
  profile.decision.tradeoffs = ["More framework structure reduces low-level control"];
  profile.decision.operationalComplexity = "medium";
  profile.decision.evidence = ["readme", "manifest"];
  profile.deploymentOperations.minimumDeployment = known("local runtime", ["readme"]);
  profile.deploymentOperations.evidence = ["readme"];
  return profile;
}

test("sparse approved profile remains evidence-safe even with high claim confidence", () => {
  const profile = fixture();
  profile.confidence = 0.98;
  const readiness = getRepositoryReadiness(profile);
  assert.equal(readiness.stage, "evidence-safe");
  assert.ok(readiness.blockers.length > 0);
});

test("decision evidence promotes a profile without implying blueprint readiness", () => {
  const readiness = getRepositoryReadiness(decisionFixture());
  assert.equal(readiness.stage, "decision-ready");
  assert.ok(readiness.blueprintCoverage < 0.85);
  assert.ok(readiness.blockers.some((item) => item.includes("security") || item.includes("Integration")));
});

test("implementation, integration, production and security evidence unlock blueprint-ready", () => {
  const profile = decisionFixture();
  profile.developerWorkflow.localSetup = known("pnpm install && pnpm dev", ["readme"]);
  profile.developerWorkflow.commands = [{ purpose: "Run locally", command: "pnpm dev", evidence: ["readme"] }];
  profile.developerWorkflow.evidence = ["readme"];
  profile.architecture.executionModel = known("request-driven runtime", ["readme"]);
  profile.architecture.components = [{ name: "Runtime", responsibility: "Coordinates execution", evidence: ["readme"] }];
  profile.integration.extensionModel = known("documented adapter interface", ["readme"]);
  profile.integration.apis = ["Adapter API"];
  profile.integration.evidence = ["readme"];
  profile.deploymentOperations.configuration = known("environment variables", ["configuration"]);
  profile.deploymentOperations.requiredServices = ["application runtime"];
  profile.deploymentOperations.operationalRisks = ["Validate production resource requirements"];
  profile.securityPrivacy.networkExposure = known("application-defined network boundary", ["readme"]);
  profile.securityPrivacy.evidence = ["readme"];

  const readiness = getRepositoryReadiness(profile);
  assert.equal(readiness.stage, "blueprint-ready");
  assert.equal(readiness.blockers.length, 0);
});
