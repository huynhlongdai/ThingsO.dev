from __future__ import annotations

from .ai_models import AnalysisReview, EnrichmentResult, RepositoryAnalysis, ReviewIssue
from .ai_prompts import (
    ANALYSIS_PROMPT_VERSION,
    ANALYSIS_SYSTEM_PROMPT,
    REVIEW_PROMPT_VERSION,
    REVIEW_SYSTEM_PROMPT,
    build_analysis_prompt,
    build_review_prompt,
)
from .ai_store import AIStore
from .evidence import EvidenceBuilder, EvidenceBundle
from .llm_client import OpenAICompatibleClient


class RepositoryEnricher:
    def __init__(
        self,
        *,
        evidence_builder: EvidenceBuilder,
        store: AIStore,
        client: OpenAICompatibleClient,
        analysis_model: str,
        review_model: str,
    ) -> None:
        self.evidence_builder = evidence_builder
        self.store = store
        self.client = client
        self.analysis_model = analysis_model
        self.review_model = review_model

    def enrich(self, full_name: str) -> EnrichmentResult:
        bundle = self.evidence_builder.load_by_full_name(full_name)
        analysis_response = self.client.generate_json(
            model=self.analysis_model,
            system_prompt=ANALYSIS_SYSTEM_PROMPT,
            user_prompt=build_analysis_prompt(bundle),
            temperature=0.0,
        )
        analysis = RepositoryAnalysis.model_validate(analysis_response.data)
        analysis_id = self.store.write_analysis(
            bundle=bundle,
            analysis=analysis,
            provider=analysis_response.provider,
            model=analysis_response.model,
            prompt_version=ANALYSIS_PROMPT_VERSION,
        )

        review_response = self.client.generate_json(
            model=self.review_model,
            system_prompt=REVIEW_SYSTEM_PROMPT,
            user_prompt=build_review_prompt(bundle, analysis),
            temperature=0.0,
        )
        review = AnalysisReview.model_validate(review_response.data)
        review = self._apply_local_trust_gates(bundle, analysis, review)
        self.store.write_review(
            bundle=bundle,
            analysis_id=analysis_id,
            review=review,
            provider=review_response.provider,
            model=review_response.model,
            prompt_version=REVIEW_PROMPT_VERSION,
        )

        counts = None
        if review.decision == "approved":
            counts = self.store.publish_approved_inferences(
                bundle=bundle,
                analysis_id=analysis_id,
                analysis=analysis,
            )

        return EnrichmentResult(
            repository_id=str(bundle.repository_id),
            analysis_id=str(analysis_id),
            review_status=review.decision,
            taxonomy_links=counts.taxonomy_links if counts else 0,
            use_case_links=counts.use_case_links if counts else 0,
            relation_links=counts.relation_links if counts else 0,
            build_ideas=counts.build_ideas if counts else 0,
        )

    @staticmethod
    def _apply_local_trust_gates(
        bundle: EvidenceBundle,
        analysis: RepositoryAnalysis,
        review: AnalysisReview,
    ) -> AnalysisReview:
        issues = list(review.issues)
        force_human_review = False

        valid_source_ids = {str(bundle.snapshot_id)} | {
            str(document.id) for document in bundle.documents
        }
        invalid_references = sorted(
            {
                reference.source_id
                for reference in analysis.evidence
                if reference.source_id not in valid_source_ids
            }
        )
        if invalid_references:
            force_human_review = True
            issues.append(
                ReviewIssue(
                    severity="high",
                    field="evidence",
                    message="Analysis cites evidence IDs that were not supplied by ThingsO.",
                )
            )

        if bundle.has_suspicious_source_text and review.decision == "approved":
            force_human_review = True
            issues.append(
                ReviewIssue(
                    severity="high",
                    field="source_documents",
                    message="Instruction-like text was detected in untrusted repository content.",
                )
            )

        if analysis.confidence > 0.9 and not bundle.documents:
            force_human_review = True
            issues.append(
                ReviewIssue(
                    severity="medium",
                    field="confidence",
                    message="High confidence is not allowed without captured source documents.",
                )
            )

        if not force_human_review:
            return review
        return AnalysisReview(
            decision="human_review",
            confidence=min(review.confidence, 0.75),
            issues=issues,
            rationale=(
                review.rationale
                + " Local ThingsO trust gates require human review before publication."
            )[:1200],
        )
