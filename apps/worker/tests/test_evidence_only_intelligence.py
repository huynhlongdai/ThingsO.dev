from uuid import uuid4

from thingso_worker.ai_security import sanitize_untrusted_text
from thingso_worker.editorial_baseline import TEMPLATES
from thingso_worker.evidence import EvidenceBundle, EvidenceDocument
from thingso_worker.intelligence_models import (
    ArchitectureV3,
    AudienceFitV3,
    CodebaseIntelligenceV3,
    DecisionGuideV3,
    DeploymentOperationsV3,
    DeveloperWorkflowV3,
    DifferentiationV3,
    IntegrationExtensionV3,
    IntelligenceClaim,
    LearningIntelligenceV3,
    ProblemIntelligenceV3,
    ProjectSignalsV3,
    RepositoryIdentityV3,
    RepositoryIntelligenceProfileV3,
    SecurityPrivacyV3,
    TechnologyProfileV3,
)
from thingso_worker.quality_editorial import evidence_only_review_issues, quality_issues


def _profile() -> RepositoryIntelligenceProfileV3:
    return RepositoryIntelligenceProfileV3(
        identity=RepositoryIdentityV3(
            definition="example/project is an evidence-scoped open-source repository.",
            product_type="Open-source repository",
            primary_role="Repository-specific scope from captured metadata",
            primary_category="api",
        ),
        problem=ProblemIntelligenceV3(
            problem_statement="Repository-stated scope: expose a developer-facing API for the project.",
            pain_points=[],
            solution_approach="A more specific solution approach is not established from the bounded evidence pack.",
        ),
        differentiation=DifferentiationV3(),
        audience=AudienceFitV3(),
        capabilities=[],
        limitations=[],
        architecture=ArchitectureV3(
            overview="Architecture details are not established from the current bounded evidence pack."
        ),
        technology=TechnologyProfileV3(),
        codebase=CodebaseIntelligenceV3(
            structure_summary="The captured repository tree is present but no conventional code area was classified."
        ),
        developer_workflow=DeveloperWorkflowV3(),
        integration=IntegrationExtensionV3(),
        deployment_operations=DeploymentOperationsV3(),
        security_privacy=SecurityPrivacyV3(),
        project_signals=ProjectSignalsV3(maturity=IntelligenceClaim()),
        decision=DecisionGuideV3(),
        learning=LearningIntelligenceV3(),
        section_confidence={
            "identity": 0.95,
            "problem": 0.68,
            "differentiation": None,
            "audience": None,
            "architecture": None,
            "technology": None,
            "codebase": 0.70,
            "developer_workflow": None,
            "integration": None,
            "deployment_operations": None,
            "security_privacy": None,
            "project_signals": 0.98,
            "decision": None,
            "learning": None,
        },
        confidence=0.24,
    )


def _bundle() -> EvidenceBundle:
    documents = tuple(
        EvidenceDocument(
            id=uuid4(),
            document_type=document_type,
            source_url=f"https://github.com/example/project/{document_type}",
            ref="main",
            content_hash=f"hash-{document_type}",
            sanitized=sanitize_untrusted_text("Repository-specific evidence text."),
        )
        for document_type in ("readme", "repository_tree", "manifest")
    )
    return EvidenceBundle(
        repository_id=uuid4(),
        snapshot_id=uuid4(),
        full_name="example/project",
        facts={"description": "Example repository"},
        documents=documents,
    )


def test_sparse_unknown_sections_are_valid_v3_data() -> None:
    profile = _profile()
    assert profile.differentiation.differentiators == []
    assert profile.audience.target_users == []
    assert profile.architecture.components == []
    assert profile.architecture.style.state == "unknown"
    assert profile.deployment_operations.minimum_deployment.state == "unknown"
    assert profile.decision.choose_when == []


def test_evidence_only_review_allows_unknown_core_sections() -> None:
    issues = evidence_only_review_issues(_bundle(), _profile())
    assert not [issue for issue in issues if issue.severity == "high"]


def test_category_template_text_is_rejected_from_semantic_profile() -> None:
    template_value = next(iter(TEMPLATES.values())).capabilities[0]
    profile = _profile().model_copy(update={"capabilities": [template_value]})
    assert "category-template semantic text leaked into public repository profile" in quality_issues(profile)
