from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path
from urllib.parse import unquote, urlparse
from uuid import UUID

import psycopg
from psycopg.types.json import Jsonb

from .ai_models import AnalysisReview, EvidenceReference, RepositoryAnalysis, ReviewIssue
from .ai_store import AIStore, PublishedInferenceCounts
from .evidence import EvidenceBuilder, EvidenceBundle
from .intelligence_compiler import compile_editorial_profile
from .intelligence_draft import EditorialIntelligenceDraftV3
from .intelligence_models import RepositoryIntelligenceProfileV3

PROVIDER = "editorial"
MODEL = "chatgpt-gpt-5.6-sol-manual"
REVIEW_MODEL = "deterministic-intelligence-review-v3"
PROMPT_VERSION = "manual-intelligence-v3-usecases-v1"
ANALYSIS_TYPE = "repository_intelligence"

CORE_CONFIDENCE_SECTIONS = (
    "identity",
    "problem",
    "architecture",
    "technology",
    "codebase",
    "developer_workflow",
    "deployment_operations",
    "decision",
)


@dataclass(frozen=True)
class ManualIntelligenceResult:
    full_name: str
    status: str
    analysis_id: str | None = None
    taxonomy_links: int = 0
    use_case_links: int = 0
    relation_links: int = 0
    build_ideas: int = 0

    def as_dict(self) -> dict[str, object]:
        return asdict(self)


def _evidence_references(bundle: EvidenceBundle) -> list[EvidenceReference]:
    references = [
        EvidenceReference(
            source_type="repository_snapshot",
            source_id=str(bundle.snapshot_id),
            label="Current ingested GitHub repository snapshot",
        )
    ]
    for document in bundle.documents:
        if document.document_type == "readme":
            source_type = "readme"
        elif document.document_type == "manifest":
            source_type = "package"
        else:
            source_type = "documentation"
        references.append(
            EvidenceReference(
                source_type=source_type,
                source_id=str(document.id),
                label=f"{document.document_type}: {document.source_url}",
            )
        )
    return references[:30]


def _available_evidence_keys(bundle: EvidenceBundle) -> set[str]:
    keys = {"repository_snapshot"}
    for document in bundle.documents:
        keys.add(document.document_type.lower())
        url = unquote(urlparse(document.source_url).path).lower()
        keys.add(url)
        if "/blob/" in url:
            parts = url.split("/blob/", 1)[1].split("/", 1)
            if len(parts) == 2:
                keys.add(parts[1])
        if "/tree/" in url:
            keys.add("repository_tree")
    return keys


def _selector_matches(selector: str, available: set[str]) -> bool:
    needle = selector.strip().lower()
    if not needle:
        return False
    return any(needle == item or needle in item for item in available)


def _section_evidence(profile: RepositoryIntelligenceProfileV3) -> dict[str, list[str]]:
    return {
        "identity": profile.identity.evidence,
        "problem": profile.problem.evidence,
        "differentiation": profile.differentiation.evidence,
        "audience": profile.audience.evidence,
        "architecture": profile.architecture.evidence,
        "technology": profile.technology.evidence,
        "codebase": profile.codebase.evidence,
        "developer_workflow": profile.developer_workflow.evidence,
        "integration": profile.integration.evidence,
        "deployment_operations": profile.deployment_operations.evidence,
        "security_privacy": profile.security_privacy.evidence,
        "project_signals": profile.project_signals.evidence,
        "decision": profile.decision.evidence,
        "learning": profile.learning.evidence,
    }


def _quality_issues(
    bundle: EvidenceBundle,
    profile: RepositoryIntelligenceProfileV3,
) -> list[ReviewIssue]:
    issues: list[ReviewIssue] = []
    doc_types = {document.document_type for document in bundle.documents}

    if "readme" not in doc_types:
        issues.append(ReviewIssue(severity="high", field="evidence", message="README evidence is missing."))
    if "repository_tree" not in doc_types:
        issues.append(
            ReviewIssue(severity="high", field="evidence", message="Repository tree evidence is missing.")
        )
    if len(bundle.documents) < 3:
        issues.append(
            ReviewIssue(
                severity="high",
                field="evidence",
                message="V3 requires README, tree, and at least one additional technical evidence document.",
            )
        )
    if profile.confidence < 0.70:
        issues.append(
            ReviewIssue(
                severity="high",
                field="confidence",
                message="Repository intelligence confidence must be at least 0.70.",
            )
        )
    if not profile.technology.items:
        issues.append(
            ReviewIssue(severity="high", field="technology", message="No technology roles were identified.")
        )
    if not profile.codebase.important_paths:
        issues.append(
            ReviewIssue(severity="high", field="codebase", message="No important codebase paths were identified.")
        )

    for field_name, claim in (
        ("architecture.style", profile.architecture.style),
        ("architecture.execution_model", profile.architecture.execution_model),
        ("developer_workflow.local_setup", profile.developer_workflow.local_setup),
        ("deployment_operations.minimum_deployment", profile.deployment_operations.minimum_deployment),
    ):
        if claim.state == "unknown" or not claim.value:
            issues.append(
                ReviewIssue(
                    severity="high",
                    field=field_name,
                    message="A core decision field cannot be unknown for a publishable V3 profile.",
                )
            )

    available = _available_evidence_keys(bundle)
    for section, selectors in _section_evidence(profile).items():
        if section == "security_privacy" and not selectors:
            continue
        if not selectors:
            issues.append(
                ReviewIssue(
                    severity="high",
                    field=f"{section}.evidence",
                    message="Core V3 sections must declare evidence selectors.",
                )
            )
            continue
        if not any(_selector_matches(selector, available) for selector in selectors):
            issues.append(
                ReviewIssue(
                    severity="high",
                    field=f"{section}.evidence",
                    message="Section evidence selectors do not match the ingested evidence pack.",
                )
            )

    for section in CORE_CONFIDENCE_SECTIONS:
        confidence = profile.section_confidence.get(section)
        if confidence is None or confidence < 0.50:
            issues.append(
                ReviewIssue(
                    severity="high",
                    field=f"section_confidence.{section}",
                    message="Core V3 section confidence must be explicitly recorded and at least 0.50.",
                )
            )

    return issues


def _review(bundle: EvidenceBundle, profile: RepositoryIntelligenceProfileV3) -> AnalysisReview:
    issues = _quality_issues(bundle, profile)
    decision = "approved" if not any(issue.severity == "high" for issue in issues) else "human_review"
    return AnalysisReview(
        decision=decision,
        confidence=min(profile.confidence, 0.95),
        issues=issues,
        rationale=(
            "Repository Intelligence V3 passed schema, evidence-pack, section provenance, confidence, "
            "architecture, codebase, developer workflow, deployment, and decision gates."
            if decision == "approved"
            else "Repository Intelligence V3 did not pass one or more deterministic publication gates."
        ),
    )


def _already_published(database_url: str, bundle: EvidenceBundle) -> bool:
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT EXISTS (
                  SELECT 1
                  FROM ai_analyses
                  WHERE repository_id = %s
                    AND analysis_type = %s
                    AND model_provider = %s
                    AND model_name = %s
                    AND prompt_version = %s
                    AND source_snapshot_id = %s
                    AND review_status = 'approved'
                )
                """,
                (
                    bundle.repository_id,
                    ANALYSIS_TYPE,
                    PROVIDER,
                    MODEL,
                    PROMPT_VERSION,
                    bundle.snapshot_id,
                ),
            )
            return bool(cur.fetchone()[0])


def _write_profile(
    database_url: str,
    bundle: EvidenceBundle,
    profile: RepositoryIntelligenceProfileV3,
) -> UUID:
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO ai_analyses (
                  repository_id, analysis_type, schema_version, prompt_version,
                  model_provider, model_name, source_snapshot_id, source_document_ids,
                  output_json, confidence, review_status
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'pending')
                RETURNING id
                """,
                (
                    bundle.repository_id,
                    ANALYSIS_TYPE,
                    profile.schema_version,
                    PROMPT_VERSION,
                    PROVIDER,
                    MODEL,
                    bundle.snapshot_id,
                    list(bundle.source_document_ids),
                    Jsonb(profile.model_dump(mode="json")),
                    profile.confidence,
                ),
            )
            analysis_id = cur.fetchone()[0]
        conn.commit()
    return analysis_id


def _projection(profile: RepositoryIntelligenceProfileV3) -> RepositoryAnalysis:
    return RepositoryAnalysis(
        summary=profile.identity.definition,
        capabilities=profile.capabilities,
        limitations=profile.limitations,
        deployment_modes=profile.deployment_modes,
        interfaces=profile.interfaces,
        taxonomy_slugs=profile.taxonomy_slugs,
        use_cases=profile.use_cases,
        relations=profile.relations,
        build_ideas=profile.build_ideas,
        evidence=profile.evidence,
        confidence=profile.confidence,
    )


def _profile_from_entry(
    entry: dict[str, object],
    bundle: EvidenceBundle,
) -> RepositoryIntelligenceProfileV3:
    if "draft" in entry:
        draft = EditorialIntelligenceDraftV3.model_validate(entry["draft"])
        compiled = compile_editorial_profile(bundle, draft)
        return compiled.model_copy(update={"evidence": _evidence_references(bundle)})

    if "profile" in entry:
        raw_profile = dict(entry["profile"])
        raw_profile["evidence"] = [item.model_dump(mode="json") for item in _evidence_references(bundle)]
        return RepositoryIntelligenceProfileV3.model_validate(raw_profile)

    raise ValueError("Manual intelligence entry must contain either 'draft' or 'profile'.")


def import_manual_intelligence(
    database_url: str,
    path: str | Path,
) -> list[ManualIntelligenceResult]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("Manual intelligence file must contain a JSON array")

    evidence_builder = EvidenceBuilder(database_url, max_source_chars=36_000)
    store = AIStore(database_url)
    results: list[ManualIntelligenceResult] = []

    for entry in payload:
        if not isinstance(entry, dict):
            raise ValueError("Manual intelligence entries must be JSON objects")
        full_name = str(entry["full_name"])
        bundle = evidence_builder.load_by_full_name(full_name)
        if _already_published(database_url, bundle):
            results.append(ManualIntelligenceResult(full_name=full_name, status="skipped-current-snapshot"))
            continue

        profile = _profile_from_entry(entry, bundle)
        review = _review(bundle, profile)
        analysis_id = _write_profile(database_url, bundle, profile)
        store.write_review(
            bundle=bundle,
            analysis_id=analysis_id,
            review=review,
            provider=PROVIDER,
            model=REVIEW_MODEL,
            prompt_version=PROMPT_VERSION,
        )

        counts = PublishedInferenceCounts()
        if review.decision == "approved":
            counts = store.publish_approved_inferences(
                bundle=bundle,
                analysis_id=analysis_id,
                analysis=_projection(profile),
                source_type="editorial",
            )

        results.append(
            ManualIntelligenceResult(
                full_name=full_name,
                status=review.decision,
                analysis_id=str(analysis_id),
                taxonomy_links=counts.taxonomy_links,
                use_case_links=counts.use_case_links,
                relation_links=counts.relation_links,
                build_ideas=counts.build_ideas,
            )
        )

    return results
