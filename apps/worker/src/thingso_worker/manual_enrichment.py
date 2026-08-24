from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

import psycopg

from .ai_models import AnalysisReview, EvidenceReference, RepositoryAnalysis
from .ai_store import AIStore, PublishedInferenceCounts
from .evidence import EvidenceBuilder, EvidenceBundle

PROVIDER = "editorial"
MODEL = "chatgpt-gpt-5.6-sol-manual"
REVIEW_MODEL = "deterministic-evidence-review-v1"
PROMPT_VERSION = "manual-editorial-v1"


@dataclass(frozen=True)
class ManualEnrichmentResult:
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
        source_type = "readme" if document.document_type == "readme" else "documentation"
        references.append(
            EvidenceReference(
                source_type=source_type,
                source_id=str(document.id),
                label=f"Ingested {document.document_type}: {document.source_url}",
            )
        )
    return references[:30]


def _already_published(database_url: str, bundle: EvidenceBundle) -> bool:
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT EXISTS (
                  SELECT 1
                  FROM ai_analyses
                  WHERE repository_id = %s
                    AND analysis_type = 'repository_enrichment'
                    AND model_provider = %s
                    AND model_name = %s
                    AND prompt_version = %s
                    AND source_snapshot_id = %s
                    AND review_status = 'approved'
                )
                """,
                (
                    bundle.repository_id,
                    PROVIDER,
                    MODEL,
                    PROMPT_VERSION,
                    bundle.snapshot_id,
                ),
            )
            return bool(cur.fetchone()[0])


def _review(bundle: EvidenceBundle, analysis: RepositoryAnalysis) -> AnalysisReview:
    issues: list[dict[str, str]] = []
    if not bundle.documents:
        issues.append(
            {
                "severity": "high",
                "field": "evidence",
                "message": "No ingested source document is available for editorial enrichment.",
            }
        )
    if analysis.confidence < 0.65:
        issues.append(
            {
                "severity": "high",
                "field": "confidence",
                "message": "Editorial confidence is below the publication threshold.",
            }
        )

    decision = "approved" if not any(issue["severity"] == "high" for issue in issues) else "human_review"
    return AnalysisReview(
        decision=decision,
        confidence=min(analysis.confidence, 0.95),
        issues=issues,
        rationale=(
            "Deterministic editorial gate passed: the analysis is schema-valid, tied to the current "
            "repository snapshot and ingested source documents, and meets the confidence threshold."
            if decision == "approved"
            else "Manual editorial analysis did not pass the deterministic evidence publication gate."
        ),
    )


def import_manual_enrichment(database_url: str, path: str | Path) -> list[ManualEnrichmentResult]:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("Manual enrichment file must contain a JSON array")

    evidence_builder = EvidenceBuilder(database_url)
    store = AIStore(database_url)
    results: list[ManualEnrichmentResult] = []

    for entry in payload:
        full_name = str(entry["full_name"])
        bundle = evidence_builder.load_by_full_name(full_name)
        if _already_published(database_url, bundle):
            results.append(ManualEnrichmentResult(full_name=full_name, status="skipped-current-snapshot"))
            continue

        raw_analysis = dict(entry["analysis"])
        raw_analysis["evidence"] = [item.model_dump(mode="json") for item in _evidence_references(bundle)]
        analysis = RepositoryAnalysis.model_validate(raw_analysis)
        review = _review(bundle, analysis)

        analysis_id = store.write_analysis(
            bundle=bundle,
            analysis=analysis,
            provider=PROVIDER,
            model=MODEL,
            prompt_version=PROMPT_VERSION,
        )
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
                analysis=analysis,
            )

        results.append(
            ManualEnrichmentResult(
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
