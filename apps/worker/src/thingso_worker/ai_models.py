from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class EvidenceReference(BaseModel):
    source_type: Literal["repository_snapshot", "readme", "documentation", "package", "other"]
    source_id: str
    label: str


class UseCaseInference(BaseModel):
    slug: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    fit_score: float = Field(ge=0, le=1)
    reason: str = Field(min_length=3, max_length=600)


class RelationInference(BaseModel):
    repository_full_name: str = Field(min_length=3, max_length=180)
    relation_type: Literal["alternative", "similar", "integrates_with", "depends_on", "complements"]
    confidence: float = Field(ge=0, le=1)
    reason: str = Field(min_length=3, max_length=600)


class BuildIdeaInference(BaseModel):
    slug: str = Field(min_length=3, max_length=100, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    title: str = Field(min_length=3, max_length=160)
    problem: str = Field(min_length=10, max_length=1200)
    target_user: str | None = Field(default=None, max_length=300)
    complexity: Literal["low", "medium", "high", "unknown"] = "unknown"
    architecture: dict[str, object] = Field(default_factory=dict)
    assumptions: list[str] = Field(default_factory=list, max_length=12)
    risks: list[str] = Field(default_factory=list, max_length=12)


class RepositoryAnalysis(BaseModel):
    schema_version: Literal["repo-analysis-v1"] = "repo-analysis-v1"
    summary: str = Field(min_length=20, max_length=1800)
    capabilities: list[str] = Field(default_factory=list, max_length=20)
    limitations: list[str] = Field(default_factory=list, max_length=20)
    deployment_modes: list[str] = Field(default_factory=list, max_length=12)
    interfaces: list[str] = Field(default_factory=list, max_length=20)
    taxonomy_slugs: list[str] = Field(default_factory=list, max_length=20)
    use_cases: list[UseCaseInference] = Field(default_factory=list, max_length=12)
    relations: list[RelationInference] = Field(default_factory=list, max_length=12)
    build_ideas: list[BuildIdeaInference] = Field(default_factory=list, max_length=6)
    evidence: list[EvidenceReference] = Field(default_factory=list, max_length=30)
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


class ReviewIssue(BaseModel):
    severity: Literal["low", "medium", "high"]
    field: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=3, max_length=600)


class AnalysisReview(BaseModel):
    schema_version: Literal["repo-review-v1"] = "repo-review-v1"
    decision: Literal["approved", "rejected", "human_review"]
    confidence: float = Field(ge=0, le=1)
    issues: list[ReviewIssue] = Field(default_factory=list, max_length=30)
    rationale: str = Field(min_length=3, max_length=1200)


class EnrichmentResult(BaseModel):
    repository_id: str
    analysis_id: str
    review_status: Literal["approved", "rejected", "human_review"]
    taxonomy_links: int = 0
    use_case_links: int = 0
    relation_links: int = 0
    build_ideas: int = 0
