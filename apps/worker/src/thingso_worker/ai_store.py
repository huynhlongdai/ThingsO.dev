from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

import psycopg
from psycopg.types.json import Jsonb

from .ai_models import AnalysisReview, RepositoryAnalysis
from .evidence import EvidenceBundle


@dataclass(frozen=True)
class PublishedInferenceCounts:
    taxonomy_links: int = 0
    use_case_links: int = 0
    relation_links: int = 0
    build_ideas: int = 0


def _humanize_slug(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.split("-") if part)


def _safe_slug(value: str) -> str:
    return value.strip().lower().replace("_", "-").replace(" ", "-")


class AIStore:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    def write_analysis(
        self,
        *,
        bundle: EvidenceBundle,
        analysis: RepositoryAnalysis,
        provider: str,
        model: str,
        prompt_version: str,
    ) -> UUID:
        with psycopg.connect(self.database_url) as conn:
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
                        "repository_enrichment",
                        analysis.schema_version,
                        prompt_version,
                        provider,
                        model,
                        bundle.snapshot_id,
                        list(bundle.source_document_ids),
                        Jsonb(analysis.model_dump(mode="json")),
                        analysis.confidence,
                    ),
                )
                analysis_id = cur.fetchone()[0]
            conn.commit()
        return analysis_id

    def write_review(
        self,
        *,
        bundle: EvidenceBundle,
        analysis_id: UUID,
        review: AnalysisReview,
        provider: str,
        model: str,
        prompt_version: str,
    ) -> UUID:
        output = review.model_dump(mode="json")
        output["reviewed_analysis_id"] = str(analysis_id)
        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO ai_analyses (
                      repository_id, analysis_type, schema_version, prompt_version,
                      model_provider, model_name, source_snapshot_id, source_document_ids,
                      output_json, confidence, review_status
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'approved')
                    RETURNING id
                    """,
                    (
                        bundle.repository_id,
                        "repository_review",
                        review.schema_version,
                        prompt_version,
                        provider,
                        model,
                        bundle.snapshot_id,
                        list(bundle.source_document_ids),
                        Jsonb(output),
                        review.confidence,
                    ),
                )
                review_id = cur.fetchone()[0]
                cur.execute(
                    "UPDATE ai_analyses SET review_status = %s WHERE id = %s",
                    (review.decision, analysis_id),
                )
            conn.commit()
        return review_id

    def publish_approved_inferences(
        self,
        *,
        bundle: EvidenceBundle,
        analysis_id: UUID,
        analysis: RepositoryAnalysis,
        source_type: str = "ai",
    ) -> PublishedInferenceCounts:
        if source_type not in {"ai", "editorial"}:
            raise ValueError("Inference source_type must be ai or editorial")

        taxonomy_links = 0
        use_case_links = 0
        relation_links = 0
        build_ideas = 0

        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                taxonomy_candidates = [
                    ("capability", slug, analysis.confidence)
                    for slug in analysis.taxonomy_slugs
                ]
                taxonomy_candidates.extend(
                    ("interface", _safe_slug(value), analysis.confidence)
                    for value in analysis.interfaces
                )
                taxonomy_candidates.extend(
                    ("deployment", _safe_slug(value), analysis.confidence)
                    for value in analysis.deployment_modes
                )

                for axis, slug, confidence in taxonomy_candidates:
                    cur.execute(
                        "SELECT id FROM taxonomy_terms WHERE axis = %s AND slug = %s AND status = 'active'",
                        (axis, slug),
                    )
                    term = cur.fetchone()
                    if not term:
                        continue
                    cur.execute(
                        """
                        INSERT INTO repository_taxonomy (
                          repository_id, term_id, source_type, confidence, analysis_id
                        ) VALUES (%s,%s,%s,%s,%s)
                        ON CONFLICT (repository_id, term_id, source_type) DO UPDATE SET
                          confidence = EXCLUDED.confidence,
                          analysis_id = EXCLUDED.analysis_id
                        """,
                        (bundle.repository_id, term[0], source_type, confidence, analysis_id),
                    )
                    taxonomy_links += 1

                for inference in analysis.use_cases:
                    cur.execute(
                        "SELECT id FROM use_cases WHERE slug = %s",
                        (inference.slug,),
                    )
                    row = cur.fetchone()
                    if row:
                        use_case_id = row[0]
                    else:
                        description = (
                            "Editorially proposed use case pending taxonomy review."
                            if source_type == "editorial"
                            else "AI-proposed use case pending editorial taxonomy review."
                        )
                        cur.execute(
                            """
                            INSERT INTO use_cases (slug, title, description, status)
                            VALUES (%s,%s,%s,'proposed')
                            RETURNING id
                            """,
                            (inference.slug, _humanize_slug(inference.slug), description),
                        )
                        use_case_id = cur.fetchone()[0]
                    cur.execute(
                        """
                        INSERT INTO repository_use_cases (
                          repository_id, use_case_id, fit_score, reason, source_type, analysis_id, reviewed
                        ) VALUES (%s,%s,%s,%s,%s,%s,true)
                        ON CONFLICT (repository_id, use_case_id, source_type) DO UPDATE SET
                          fit_score = EXCLUDED.fit_score,
                          reason = EXCLUDED.reason,
                          analysis_id = EXCLUDED.analysis_id,
                          reviewed = true
                        """,
                        (
                            bundle.repository_id,
                            use_case_id,
                            inference.fit_score,
                            inference.reason,
                            source_type,
                            analysis_id,
                        ),
                    )
                    use_case_links += 1

                for relation in analysis.relations:
                    cur.execute(
                        "SELECT id FROM repositories WHERE lower(full_name) = lower(%s)",
                        (relation.repository_full_name,),
                    )
                    target = cur.fetchone()
                    if not target or target[0] == bundle.repository_id:
                        continue
                    cur.execute(
                        """
                        INSERT INTO repository_relations (
                          from_repository_id, to_repository_id, relation_type, source_type,
                          confidence, analysis_id, reviewed
                        ) VALUES (%s,%s,%s,%s,%s,%s,true)
                        ON CONFLICT (
                          from_repository_id, to_repository_id, relation_type, source_type
                        ) DO UPDATE SET
                          confidence = EXCLUDED.confidence,
                          analysis_id = EXCLUDED.analysis_id,
                          reviewed = true
                        RETURNING 1
                        """,
                        (
                            bundle.repository_id,
                            target[0],
                            relation.relation_type,
                            source_type,
                            relation.confidence,
                            analysis_id,
                        ),
                    )
                    if cur.fetchone():
                        relation_links += 1

                for idea in analysis.build_ideas:
                    cur.execute(
                        """
                        INSERT INTO build_ideas (
                          repository_id, slug, title, problem, target_user, complexity,
                          architecture_json, assumptions_json, risks_json, analysis_id, review_status
                        ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,'approved')
                        ON CONFLICT (slug) DO NOTHING
                        RETURNING id
                        """,
                        (
                            bundle.repository_id,
                            idea.slug,
                            idea.title,
                            idea.problem,
                            idea.target_user,
                            idea.complexity,
                            Jsonb(idea.architecture),
                            Jsonb(idea.assumptions),
                            Jsonb(idea.risks),
                            analysis_id,
                        ),
                    )
                    if cur.fetchone():
                        build_ideas += 1
            conn.commit()

        return PublishedInferenceCounts(
            taxonomy_links=taxonomy_links,
            use_case_links=use_case_links,
            relation_links=relation_links,
            build_ideas=build_ideas,
        )
