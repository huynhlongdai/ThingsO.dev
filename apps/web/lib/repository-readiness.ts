import type { IntelligenceClaim, RepositoryIntelligenceV3 } from "./intelligence";

export type RepositoryReadinessStage =
  | "evidence-safe"
  | "analyzed"
  | "decision-ready"
  | "blueprint-ready";

export type RepositoryReadiness = {
  stage: RepositoryReadinessStage;
  label: string;
  coverage: number;
  completedChecks: number;
  totalChecks: number;
  analyzedCoverage: number;
  decisionCoverage: number;
  blueprintCoverage: number;
  blockers: string[];
};

type Check = {
  key: string;
  label: string;
  passed: boolean;
};

function claimEstablished(claim: IntelligenceClaim): boolean {
  return Boolean(claim.value && (claim.state === "known" || claim.state === "inferred"));
}

function meaningful(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length >= 12 && !normalized.includes("not established") && normalized !== "unknown";
}

function evidenceSelectorCount(profile: RepositoryIntelligenceV3): number {
  return new Set([
    ...profile.identity.evidence,
    ...profile.problem.evidence,
    ...profile.differentiation.evidence,
    ...profile.audience.evidence,
    ...profile.architecture.evidence,
    ...profile.technology.evidence,
    ...profile.codebase.evidence,
    ...profile.developerWorkflow.evidence,
    ...profile.integration.evidence,
    ...profile.deploymentOperations.evidence,
    ...profile.securityPrivacy.evidence,
    ...profile.projectSignals.evidence,
    ...profile.decision.evidence,
    ...profile.learning.evidence,
  ]).size;
}

function ratio(checks: Check[]): number {
  if (!checks.length) return 0;
  return checks.filter((check) => check.passed).length / checks.length;
}

export function getRepositoryReadiness(profile: RepositoryIntelligenceV3): RepositoryReadiness {
  const architectureEstablished =
    claimEstablished(profile.architecture.style)
    || claimEstablished(profile.architecture.executionModel)
    || profile.architecture.components.length > 0
    || meaningful(profile.architecture.overview);

  const analyzedChecks: Check[] = [
    { key: "problem", label: "Repository-specific problem and solution", passed: meaningful(profile.problem.problemStatement) && meaningful(profile.problem.solutionApproach) },
    { key: "capability", label: "Capabilities or technology role evidence", passed: profile.capabilities.length > 0 || profile.technology.items.length > 0 },
    { key: "codebase", label: "Codebase reading or entry-point evidence", passed: profile.codebase.importantPaths.length > 0 || profile.codebase.startReading.length > 0 || profile.codebase.entryPoints.length > 0 },
    { key: "architecture", label: "Architecture evidence", passed: architectureEstablished },
    { key: "evidence", label: "At least three distinct evidence selectors", passed: evidenceSelectorCount(profile) >= 3 },
  ];

  const fitEstablished = profile.audience.bestFor.length > 0 || profile.decision.chooseWhen.length > 0;
  const negativeFitEstablished = profile.audience.poorFit.length > 0 || profile.decision.avoidWhen.length > 0 || profile.limitations.length > 0;

  const decisionChecks: Check[] = [
    { key: "fit", label: "Best-fit or choose-when context", passed: fitEstablished },
    { key: "negative-fit", label: "Poor-fit, avoid-when or limitation context", passed: negativeFitEstablished },
    { key: "evaluate", label: "Pre-adoption evaluation criteria", passed: profile.decision.evaluateFirst.length > 0 },
    { key: "tradeoff", label: "Explicit trade-off evidence", passed: profile.decision.tradeoffs.length > 0 || profile.differentiation.tradeoffsCreatedByDesign.length > 0 },
    { key: "deployment", label: "Minimum deployment established", passed: claimEstablished(profile.deploymentOperations.minimumDeployment) },
    { key: "operations", label: "Operational complexity established", passed: profile.decision.operationalComplexity !== "unknown" },
    { key: "architecture-decision", label: "Architecture is established enough for adoption context", passed: architectureEstablished },
  ];

  const securityBoundaryEstablished = [
    profile.securityPrivacy.authentication,
    profile.securityPrivacy.authorization,
    profile.securityPrivacy.networkExposure,
    profile.securityPrivacy.dataPersisted,
    profile.securityPrivacy.dataLeavesSystem,
  ].some(claimEstablished);

  const integrationEstablished =
    claimEstablished(profile.integration.extensionModel)
    || claimEstablished(profile.integration.pluginSystem)
    || profile.integration.apis.length > 0
    || profile.integration.integrations.length > 0;

  const blueprintChecks: Check[] = [
    { key: "local-setup", label: "Local setup or runnable commands", passed: claimEstablished(profile.developerWorkflow.localSetup) || profile.developerWorkflow.commands.length > 0 },
    { key: "implementation-map", label: "Implementation code paths", passed: profile.codebase.importantPaths.length > 0 || profile.codebase.entryPoints.length > 0 },
    { key: "execution", label: "Execution or component architecture", passed: claimEstablished(profile.architecture.executionModel) || profile.architecture.components.length > 0 },
    { key: "integration", label: "Integration or extension boundary", passed: integrationEstablished },
    { key: "production", label: "Minimum deployment plus production configuration/services", passed: claimEstablished(profile.deploymentOperations.minimumDeployment) && (claimEstablished(profile.deploymentOperations.configuration) || profile.deploymentOperations.requiredServices.length > 0 || claimEstablished(profile.deploymentOperations.productionTopology)) },
    { key: "security", label: "At least one security/data boundary established", passed: securityBoundaryEstablished },
    { key: "validation", label: "Implementation validation backlog", passed: profile.decision.evaluateFirst.length > 0 || profile.deploymentOperations.operationalRisks.length > 0 || profile.securityPrivacy.securityRisks.length > 0 },
  ];

  const analyzedCoverage = ratio(analyzedChecks);
  const decisionCoverage = ratio(decisionChecks);
  const blueprintCoverage = ratio(blueprintChecks);

  const analyzedReady = analyzedCoverage >= 0.8;
  const decisionReady = analyzedReady
    && decisionCoverage >= 0.85
    && fitEstablished
    && claimEstablished(profile.deploymentOperations.minimumDeployment)
    && architectureEstablished;
  const blueprintReady = decisionReady
    && blueprintCoverage >= 0.85
    && blueprintChecks.find((check) => check.key === "security")?.passed === true
    && blueprintChecks.find((check) => check.key === "integration")?.passed === true;

  let stage: RepositoryReadinessStage = "evidence-safe";
  if (analyzedReady) stage = "analyzed";
  if (decisionReady) stage = "decision-ready";
  if (blueprintReady) stage = "blueprint-ready";

  const allChecks = [...analyzedChecks, ...decisionChecks, ...blueprintChecks];
  const completedChecks = allChecks.filter((check) => check.passed).length;
  const blockers = stage === "blueprint-ready"
    ? []
    : (stage === "decision-ready" ? blueprintChecks : stage === "analyzed" ? decisionChecks : analyzedChecks)
      .filter((check) => !check.passed)
      .map((check) => check.label);

  const labels: Record<RepositoryReadinessStage, string> = {
    "evidence-safe": "Evidence-safe",
    analyzed: "Analyzed",
    "decision-ready": "Decision-ready",
    "blueprint-ready": "Blueprint-ready",
  };

  return {
    stage,
    label: labels[stage],
    coverage: allChecks.length ? completedChecks / allChecks.length : 0,
    completedChecks,
    totalChecks: allChecks.length,
    analyzedCoverage,
    decisionCoverage,
    blueprintCoverage,
    blockers,
  };
}
