from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

from .ai_models import BuildIdeaInference, EvidenceReference, RelationInference, UseCaseInference

KnowledgeState = Literal["known", "inferred", "unknown", "conflicting"]
Complexity = Literal["low", "medium", "high", "unknown"]


class EvidenceAware(BaseModel):
    evidence: list[str] = Field(default_factory=list, max_length=16)


class IntelligenceClaim(EvidenceAware):
    value: str | None = Field(default=None, max_length=1600)
    state: KnowledgeState = "unknown"
    confidence: float | None = Field(default=None, ge=0, le=1)


class RepositoryIdentityV3(EvidenceAware):
    definition: str = Field(min_length=20, max_length=900)
    product_type: str = Field(min_length=2, max_length=120)
    primary_role: str = Field(min_length=3, max_length=240)
    primary_category: str = Field(min_length=2, max_length=120)
    secondary_categories: list[str] = Field(default_factory=list, max_length=12)
    interaction_model: str | None = Field(default=None, max_length=300)
    intended_scope: str | None = Field(default=None, max_length=300)


class ProblemIntelligenceV3(EvidenceAware):
    problem_statement: str = Field(min_length=20, max_length=1600)
    pain_points: list[str] = Field(default_factory=list, max_length=12)
    solution_approach: str = Field(min_length=20, max_length=1600)
    why_it_matters: str | None = Field(default=None, max_length=1200)


class DifferentiationV3(EvidenceAware):
    # Sparse is intentional: "no explicit differentiation established" is better than template filler.
    differentiators: list[str] = Field(default_factory=list, max_length=12)
    design_philosophy: list[str] = Field(default_factory=list, max_length=10)
    unique_capabilities: list[str] = Field(default_factory=list, max_length=12)
    commodity_capabilities: list[str] = Field(default_factory=list, max_length=12)
    tradeoffs_created_by_design: list[str] = Field(default_factory=list, max_length=12)


class AudienceFitV3(EvidenceAware):
    target_users: list[str] = Field(default_factory=list, max_length=12)
    team_profiles: list[str] = Field(default_factory=list, max_length=10)
    skill_level: str | None = Field(default=None, max_length=160)
    jobs_to_be_done: list[str] = Field(default_factory=list, max_length=12)
    best_for: list[str] = Field(default_factory=list, max_length=12)
    poor_fit: list[str] = Field(default_factory=list, max_length=12)


class ArchitectureComponent(EvidenceAware):
    name: str = Field(min_length=2, max_length=120)
    responsibility: str = Field(min_length=5, max_length=600)


class ArchitectureV3(EvidenceAware):
    overview: str = Field(min_length=20, max_length=1800)
    style: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    execution_model: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    state_model: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    components: list[ArchitectureComponent] = Field(default_factory=list, max_length=20)
    data_flow: list[str] = Field(default_factory=list, max_length=16)
    control_flow: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    persistence_model: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    concurrency_model: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    isolation_model: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    scaling_model: IntelligenceClaim = Field(default_factory=IntelligenceClaim)


class TechnologyItem(EvidenceAware):
    name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=2, max_length=100)
    role: str = Field(min_length=3, max_length=500)
    state: KnowledgeState = "known"


class TechnologyProfileV3(EvidenceAware):
    items: list[TechnologyItem] = Field(default_factory=list, max_length=40)
    api_style: list[str] = Field(default_factory=list, max_length=12)
    protocols: list[str] = Field(default_factory=list, max_length=12)


class CodePath(EvidenceAware):
    path: str = Field(min_length=1, max_length=300)
    purpose: str = Field(min_length=3, max_length=600)


class CodebaseIntelligenceV3(EvidenceAware):
    structure_summary: str = Field(min_length=20, max_length=1800)
    important_paths: list[CodePath] = Field(default_factory=list, max_length=24)
    entry_points: list[str] = Field(default_factory=list, max_length=16)
    start_reading: list[str] = Field(default_factory=list, max_length=16)
    extension_points: list[str] = Field(default_factory=list, max_length=16)


class DevCommand(EvidenceAware):
    purpose: str = Field(min_length=2, max_length=160)
    command: str = Field(min_length=1, max_length=500)


class DeveloperWorkflowV3(EvidenceAware):
    local_setup: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    commands: list[DevCommand] = Field(default_factory=list, max_length=24)
    build: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    tests: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    lint: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    typecheck: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    debugging: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    migrations: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    ci_cd: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    contribution_process: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    release_process: IntelligenceClaim = Field(default_factory=IntelligenceClaim)


class IntegrationExtensionV3(EvidenceAware):
    extension_model: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    plugin_system: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    apis: list[str] = Field(default_factory=list, max_length=16)
    protocols: list[str] = Field(default_factory=list, max_length=16)
    integrations: list[str] = Field(default_factory=list, max_length=24)
    adding_extension: IntelligenceClaim = Field(default_factory=IntelligenceClaim)


class DeploymentOperationsV3(EvidenceAware):
    minimum_deployment: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    production_topology: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    required_services: list[str] = Field(default_factory=list, max_length=16)
    persistence: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    configuration: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    scaling: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    observability: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    backup_upgrade: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    failure_recovery: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    resource_profile: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    operational_risks: list[str] = Field(default_factory=list, max_length=16)


class SecurityPrivacyV3(EvidenceAware):
    authentication: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    authorization: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    secrets: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    network_exposure: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    sandboxing: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    multi_tenancy: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    data_persisted: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    data_leaves_system: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    telemetry: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    security_risks: list[str] = Field(default_factory=list, max_length=16)


class ProjectSignalsV3(EvidenceAware):
    maturity: IntelligenceClaim
    governance: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    licensing: IntelligenceClaim = Field(default_factory=IntelligenceClaim)
    adoption_signals: list[str] = Field(default_factory=list, max_length=16)
    ecosystem: list[str] = Field(default_factory=list, max_length=16)
    evolution: list[str] = Field(default_factory=list, max_length=16)


class DecisionGuideV3(EvidenceAware):
    choose_when: list[str] = Field(default_factory=list, max_length=16)
    avoid_when: list[str] = Field(default_factory=list, max_length=16)
    evaluate_first: list[str] = Field(default_factory=list, max_length=16)
    tradeoffs: list[str] = Field(default_factory=list, max_length=16)
    learning_curve: Complexity = "unknown"
    operational_complexity: Complexity = "unknown"
    migration_cost: Complexity = "unknown"
    lock_in: Complexity = "unknown"
    comparison_dimensions: dict[str, str] = Field(default_factory=dict)


class LearningIntelligenceV3(EvidenceAware):
    learnings: list[str] = Field(default_factory=list, max_length=16)
    reading_order: list[str] = Field(default_factory=list, max_length=16)
    reusable_patterns: list[str] = Field(default_factory=list, max_length=16)
    reusable_components: list[str] = Field(default_factory=list, max_length=16)


class RepositoryIntelligenceProfileV3(BaseModel):
    schema_version: Literal["repo-intelligence-v3"] = "repo-intelligence-v3"
    identity: RepositoryIdentityV3
    problem: ProblemIntelligenceV3
    differentiation: DifferentiationV3
    audience: AudienceFitV3
    capabilities: list[str] = Field(default_factory=list, max_length=24)
    limitations: list[str] = Field(default_factory=list, max_length=20)
    architecture: ArchitectureV3
    technology: TechnologyProfileV3
    codebase: CodebaseIntelligenceV3
    developer_workflow: DeveloperWorkflowV3
    integration: IntegrationExtensionV3
    deployment_operations: DeploymentOperationsV3
    security_privacy: SecurityPrivacyV3
    project_signals: ProjectSignalsV3
    decision: DecisionGuideV3
    learning: LearningIntelligenceV3
    deployment_modes: list[str] = Field(default_factory=list, max_length=12)
    interfaces: list[str] = Field(default_factory=list, max_length=20)
    taxonomy_slugs: list[str] = Field(default_factory=list, max_length=20)
    use_cases: list[UseCaseInference] = Field(default_factory=list, max_length=12)
    relations: list[RelationInference] = Field(default_factory=list, max_length=12)
    build_ideas: list[BuildIdeaInference] = Field(default_factory=list, max_length=6)
    evidence: list[EvidenceReference] = Field(default_factory=list, max_length=30)
    section_confidence: dict[str, float | None] = Field(default_factory=dict)
    confidence: float = Field(ge=0, le=1)

    @field_validator("taxonomy_slugs")
    @classmethod
    def taxonomy_slugs_are_safe(cls, values: list[str]) -> list[str]:
        cleaned: list[str] = []
        for value in values:
            slug = value.strip().lower()
            if not slug or len(slug) > 80:
                continue
            if all(character.isalnum() or character == "-" for character in slug):
                cleaned.append(slug)
        return list(dict.fromkeys(cleaned))

    @property
    def summary(self) -> str:
        return self.identity.definition
