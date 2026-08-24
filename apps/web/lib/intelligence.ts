export type KnowledgeState = "known" | "inferred" | "unknown" | "conflicting";
export type Complexity = "low" | "medium" | "high" | "unknown";

export type IntelligenceClaim = {
  value: string | null;
  state: KnowledgeState;
  confidence: number | null;
  evidence: string[];
};

export type IntelligenceIdentity = {
  definition: string;
  productType: string;
  primaryRole: string;
  primaryCategory: string;
  secondaryCategories: string[];
  interactionModel: string | null;
  intendedScope: string | null;
  evidence: string[];
};

export type ProblemIntelligence = {
  problemStatement: string;
  painPoints: string[];
  solutionApproach: string;
  whyItMatters: string | null;
  evidence: string[];
};

export type DifferentiationIntelligence = {
  differentiators: string[];
  designPhilosophy: string[];
  uniqueCapabilities: string[];
  commodityCapabilities: string[];
  tradeoffsCreatedByDesign: string[];
  evidence: string[];
};

export type AudienceIntelligence = {
  targetUsers: string[];
  teamProfiles: string[];
  skillLevel: string | null;
  jobsToBeDone: string[];
  bestFor: string[];
  poorFit: string[];
  evidence: string[];
};

export type ArchitectureComponent = {
  name: string;
  responsibility: string;
  evidence: string[];
};

export type ArchitectureIntelligence = {
  overview: string;
  style: IntelligenceClaim;
  executionModel: IntelligenceClaim;
  stateModel: IntelligenceClaim;
  components: ArchitectureComponent[];
  dataFlow: string[];
  controlFlow: IntelligenceClaim;
  persistenceModel: IntelligenceClaim;
  concurrencyModel: IntelligenceClaim;
  isolationModel: IntelligenceClaim;
  scalingModel: IntelligenceClaim;
  evidence: string[];
};

export type TechnologyItem = {
  name: string;
  category: string;
  role: string;
  state: KnowledgeState;
  evidence: string[];
};

export type CodePath = {
  path: string;
  purpose: string;
  evidence: string[];
};

export type DevCommand = {
  purpose: string;
  command: string;
  evidence: string[];
};

export type RepositoryIntelligenceV3 = {
  schemaVersion: "repo-intelligence-v3";
  identity: IntelligenceIdentity;
  problem: ProblemIntelligence;
  differentiation: DifferentiationIntelligence;
  audience: AudienceIntelligence;
  capabilities: string[];
  limitations: string[];
  architecture: ArchitectureIntelligence;
  technology: {
    items: TechnologyItem[];
    apiStyle: string[];
    protocols: string[];
    evidence: string[];
  };
  codebase: {
    structureSummary: string;
    importantPaths: CodePath[];
    entryPoints: string[];
    startReading: string[];
    extensionPoints: string[];
    evidence: string[];
  };
  developerWorkflow: {
    localSetup: IntelligenceClaim;
    commands: DevCommand[];
    build: IntelligenceClaim;
    tests: IntelligenceClaim;
    lint: IntelligenceClaim;
    typecheck: IntelligenceClaim;
    debugging: IntelligenceClaim;
    migrations: IntelligenceClaim;
    ciCd: IntelligenceClaim;
    contributionProcess: IntelligenceClaim;
    releaseProcess: IntelligenceClaim;
    evidence: string[];
  };
  integration: {
    extensionModel: IntelligenceClaim;
    pluginSystem: IntelligenceClaim;
    apis: string[];
    protocols: string[];
    integrations: string[];
    addingExtension: IntelligenceClaim;
    evidence: string[];
  };
  deploymentOperations: {
    minimumDeployment: IntelligenceClaim;
    productionTopology: IntelligenceClaim;
    requiredServices: string[];
    persistence: IntelligenceClaim;
    configuration: IntelligenceClaim;
    scaling: IntelligenceClaim;
    observability: IntelligenceClaim;
    backupUpgrade: IntelligenceClaim;
    failureRecovery: IntelligenceClaim;
    resourceProfile: IntelligenceClaim;
    operationalRisks: string[];
    evidence: string[];
  };
  securityPrivacy: {
    authentication: IntelligenceClaim;
    authorization: IntelligenceClaim;
    secrets: IntelligenceClaim;
    networkExposure: IntelligenceClaim;
    sandboxing: IntelligenceClaim;
    multiTenancy: IntelligenceClaim;
    dataPersisted: IntelligenceClaim;
    dataLeavesSystem: IntelligenceClaim;
    telemetry: IntelligenceClaim;
    securityRisks: string[];
    evidence: string[];
  };
  projectSignals: {
    maturity: IntelligenceClaim;
    governance: IntelligenceClaim;
    licensing: IntelligenceClaim;
    adoptionSignals: string[];
    ecosystem: string[];
    evolution: string[];
    evidence: string[];
  };
  decision: {
    chooseWhen: string[];
    avoidWhen: string[];
    evaluateFirst: string[];
    tradeoffs: string[];
    learningCurve: Complexity;
    operationalComplexity: Complexity;
    migrationCost: Complexity;
    lockIn: Complexity;
    comparisonDimensions: Record<string, string>;
    evidence: string[];
  };
  learning: {
    learnings: string[];
    readingOrder: string[];
    reusablePatterns: string[];
    reusableComponents: string[];
    evidence: string[];
  };
  sectionConfidence: Record<string, number | null>;
  confidence: number;
  provider: string;
  model: string;
  createdAt: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function strings(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function evidence(value: unknown): string[] {
  return strings(record(value).evidence);
}

function numberValue(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function claim(value: unknown): IntelligenceClaim {
  const raw = record(value);
  const state = raw.state;
  return {
    value: nullableString(raw.value),
    state: state === "known" || state === "inferred" || state === "conflicting" ? state : "unknown",
    confidence: numberValue(raw.confidence),
    evidence: strings(raw.evidence),
  };
}

function complexity(value: unknown): Complexity {
  return value === "low" || value === "medium" || value === "high" ? value : "unknown";
}

export function parseRepositoryIntelligence(
  value: unknown,
  metadata: { provider: string; model: string; createdAt: string; confidence: number | null },
): RepositoryIntelligenceV3 | null {
  const root = record(value);
  if (root.schema_version !== "repo-intelligence-v3") return null;

  const identity = record(root.identity);
  const problem = record(root.problem);
  const differentiation = record(root.differentiation);
  const audience = record(root.audience);
  const architecture = record(root.architecture);
  const technology = record(root.technology);
  const codebase = record(root.codebase);
  const developer = record(root.developer_workflow);
  const integration = record(root.integration);
  const deployment = record(root.deployment_operations);
  const security = record(root.security_privacy);
  const signals = record(root.project_signals);
  const decision = record(root.decision);
  const learning = record(root.learning);

  const definition = stringValue(identity.definition);
  if (!definition) return null;

  return {
    schemaVersion: "repo-intelligence-v3",
    identity: {
      definition,
      productType: stringValue(identity.product_type, "Unknown"),
      primaryRole: stringValue(identity.primary_role, "Unknown"),
      primaryCategory: stringValue(identity.primary_category, "Unknown"),
      secondaryCategories: strings(identity.secondary_categories),
      interactionModel: nullableString(identity.interaction_model),
      intendedScope: nullableString(identity.intended_scope),
      evidence: evidence(identity),
    },
    problem: {
      problemStatement: stringValue(problem.problem_statement),
      painPoints: strings(problem.pain_points),
      solutionApproach: stringValue(problem.solution_approach),
      whyItMatters: nullableString(problem.why_it_matters),
      evidence: evidence(problem),
    },
    differentiation: {
      differentiators: strings(differentiation.differentiators),
      designPhilosophy: strings(differentiation.design_philosophy),
      uniqueCapabilities: strings(differentiation.unique_capabilities),
      commodityCapabilities: strings(differentiation.commodity_capabilities),
      tradeoffsCreatedByDesign: strings(differentiation.tradeoffs_created_by_design),
      evidence: evidence(differentiation),
    },
    audience: {
      targetUsers: strings(audience.target_users),
      teamProfiles: strings(audience.team_profiles),
      skillLevel: nullableString(audience.skill_level),
      jobsToBeDone: strings(audience.jobs_to_be_done),
      bestFor: strings(audience.best_for),
      poorFit: strings(audience.poor_fit),
      evidence: evidence(audience),
    },
    capabilities: strings(root.capabilities),
    limitations: strings(root.limitations),
    architecture: {
      overview: stringValue(architecture.overview),
      style: claim(architecture.style),
      executionModel: claim(architecture.execution_model),
      stateModel: claim(architecture.state_model),
      components: Array.isArray(architecture.components)
        ? architecture.components.map((item) => {
            const component = record(item);
            return {
              name: stringValue(component.name, "Component"),
              responsibility: stringValue(component.responsibility),
              evidence: strings(component.evidence),
            };
          })
        : [],
      dataFlow: strings(architecture.data_flow),
      controlFlow: claim(architecture.control_flow),
      persistenceModel: claim(architecture.persistence_model),
      concurrencyModel: claim(architecture.concurrency_model),
      isolationModel: claim(architecture.isolation_model),
      scalingModel: claim(architecture.scaling_model),
      evidence: evidence(architecture),
    },
    technology: {
      items: Array.isArray(technology.items)
        ? technology.items.map((item) => {
            const tech = record(item);
            const state = tech.state;
            return {
              name: stringValue(tech.name, "Unknown"),
              category: stringValue(tech.category, "technology"),
              role: stringValue(tech.role),
              state: state === "inferred" || state === "unknown" || state === "conflicting" ? state : "known",
              evidence: strings(tech.evidence),
            };
          })
        : [],
      apiStyle: strings(technology.api_style),
      protocols: strings(technology.protocols),
      evidence: evidence(technology),
    },
    codebase: {
      structureSummary: stringValue(codebase.structure_summary),
      importantPaths: Array.isArray(codebase.important_paths)
        ? codebase.important_paths.map((item) => {
            const path = record(item);
            return {
              path: stringValue(path.path),
              purpose: stringValue(path.purpose),
              evidence: strings(path.evidence),
            };
          })
        : [],
      entryPoints: strings(codebase.entry_points),
      startReading: strings(codebase.start_reading),
      extensionPoints: strings(codebase.extension_points),
      evidence: evidence(codebase),
    },
    developerWorkflow: {
      localSetup: claim(developer.local_setup),
      commands: Array.isArray(developer.commands)
        ? developer.commands.map((item) => {
            const command = record(item);
            return {
              purpose: stringValue(command.purpose),
              command: stringValue(command.command),
              evidence: strings(command.evidence),
            };
          })
        : [],
      build: claim(developer.build),
      tests: claim(developer.tests),
      lint: claim(developer.lint),
      typecheck: claim(developer.typecheck),
      debugging: claim(developer.debugging),
      migrations: claim(developer.migrations),
      ciCd: claim(developer.ci_cd),
      contributionProcess: claim(developer.contribution_process),
      releaseProcess: claim(developer.release_process),
      evidence: evidence(developer),
    },
    integration: {
      extensionModel: claim(integration.extension_model),
      pluginSystem: claim(integration.plugin_system),
      apis: strings(integration.apis),
      protocols: strings(integration.protocols),
      integrations: strings(integration.integrations),
      addingExtension: claim(integration.adding_extension),
      evidence: evidence(integration),
    },
    deploymentOperations: {
      minimumDeployment: claim(deployment.minimum_deployment),
      productionTopology: claim(deployment.production_topology),
      requiredServices: strings(deployment.required_services),
      persistence: claim(deployment.persistence),
      configuration: claim(deployment.configuration),
      scaling: claim(deployment.scaling),
      observability: claim(deployment.observability),
      backupUpgrade: claim(deployment.backup_upgrade),
      failureRecovery: claim(deployment.failure_recovery),
      resourceProfile: claim(deployment.resource_profile),
      operationalRisks: strings(deployment.operational_risks),
      evidence: evidence(deployment),
    },
    securityPrivacy: {
      authentication: claim(security.authentication),
      authorization: claim(security.authorization),
      secrets: claim(security.secrets),
      networkExposure: claim(security.network_exposure),
      sandboxing: claim(security.sandboxing),
      multiTenancy: claim(security.multi_tenancy),
      dataPersisted: claim(security.data_persisted),
      dataLeavesSystem: claim(security.data_leaves_system),
      telemetry: claim(security.telemetry),
      securityRisks: strings(security.security_risks),
      evidence: evidence(security),
    },
    projectSignals: {
      maturity: claim(signals.maturity),
      governance: claim(signals.governance),
      licensing: claim(signals.licensing),
      adoptionSignals: strings(signals.adoption_signals),
      ecosystem: strings(signals.ecosystem),
      evolution: strings(signals.evolution),
      evidence: evidence(signals),
    },
    decision: {
      chooseWhen: strings(decision.choose_when),
      avoidWhen: strings(decision.avoid_when),
      evaluateFirst: strings(decision.evaluate_first),
      tradeoffs: strings(decision.tradeoffs),
      learningCurve: complexity(decision.learning_curve),
      operationalComplexity: complexity(decision.operational_complexity),
      migrationCost: complexity(decision.migration_cost),
      lockIn: complexity(decision.lock_in),
      comparisonDimensions: Object.fromEntries(
        Object.entries(record(decision.comparison_dimensions))
          .filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      ),
      evidence: evidence(decision),
    },
    learning: {
      learnings: strings(learning.learnings),
      readingOrder: strings(learning.reading_order),
      reusablePatterns: strings(learning.reusable_patterns),
      reusableComponents: strings(learning.reusable_components),
      evidence: evidence(learning),
    },
    sectionConfidence: Object.fromEntries(
      Object.entries(record(root.section_confidence)).map(([key, item]) => [key, numberValue(item)]),
    ),
    confidence: metadata.confidence ?? 0,
    provider: metadata.provider,
    model: metadata.model,
    createdAt: metadata.createdAt,
  };
}
