from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from .ai_models import BuildIdeaInference, RelationInference, UseCaseInference


class EditorialComponent(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    responsibility: str = Field(min_length=5, max_length=600)


class EditorialIntelligenceDraftV3(BaseModel):
    """Human/editorial semantics compiled with deterministic repository evidence at import time."""

    definition: str = Field(min_length=20, max_length=900)
    product_type: str = Field(min_length=2, max_length=120)
    primary_role: str = Field(min_length=3, max_length=240)
    primary_category: str = Field(min_length=2, max_length=120)
    secondary_categories: list[str] = Field(default_factory=list, max_length=12)
    interaction_model: str | None = Field(default=None, max_length=300)
    intended_scope: str | None = Field(default=None, max_length=300)

    problem_statement: str = Field(min_length=20, max_length=1600)
    pain_points: list[str] = Field(min_length=1, max_length=12)
    solution_approach: str = Field(min_length=20, max_length=1600)
    why_it_matters: str | None = Field(default=None, max_length=1200)

    differentiators: list[str] = Field(min_length=2, max_length=12)
    design_philosophy: list[str] = Field(default_factory=list, max_length=10)
    tradeoffs_created_by_design: list[str] = Field(min_length=1, max_length=12)

    target_users: list[str] = Field(min_length=1, max_length=12)
    team_profiles: list[str] = Field(default_factory=list, max_length=10)
    skill_level: str | None = Field(default=None, max_length=160)
    jobs_to_be_done: list[str] = Field(min_length=1, max_length=12)
    best_for: list[str] = Field(min_length=2, max_length=12)
    poor_fit: list[str] = Field(min_length=1, max_length=12)

    capabilities: list[str] = Field(min_length=3, max_length=24)
    limitations: list[str] = Field(min_length=2, max_length=20)

    architecture_overview: str = Field(min_length=20, max_length=1800)
    architecture_style: str = Field(min_length=3, max_length=600)
    execution_model: str = Field(min_length=3, max_length=600)
    components: list[EditorialComponent] = Field(min_length=3, max_length=12)
    data_flow: list[str] = Field(min_length=2, max_length=16)

    extension_model: str = Field(min_length=3, max_length=900)
    integration_notes: list[str] = Field(default_factory=list, max_length=16)

    choose_when: list[str] = Field(min_length=2, max_length=16)
    avoid_when: list[str] = Field(min_length=1, max_length=16)
    evaluate_first: list[str] = Field(min_length=2, max_length=16)
    tradeoffs: list[str] = Field(min_length=1, max_length=16)
    learning_curve: str = Field(default="unknown", max_length=20)
    operational_complexity: str = Field(default="unknown", max_length=20)
    migration_cost: str = Field(default="unknown", max_length=20)
    lock_in: str = Field(default="unknown", max_length=20)
    comparison_dimensions: dict[str, str] = Field(default_factory=dict)

    learnings: list[str] = Field(default_factory=list, max_length=16)
    reusable_patterns: list[str] = Field(default_factory=list, max_length=16)
    reusable_components: list[str] = Field(default_factory=list, max_length=16)

    deployment_modes: list[str] = Field(default_factory=list, max_length=12)
    interfaces: list[str] = Field(default_factory=list, max_length=20)
    taxonomy_slugs: list[str] = Field(default_factory=list, max_length=20)
    use_cases: list[UseCaseInference] = Field(default_factory=list, max_length=12)
    relations: list[RelationInference] = Field(default_factory=list, max_length=12)
    build_ideas: list[BuildIdeaInference] = Field(default_factory=list, max_length=6)

    confidence: float = Field(ge=0.70, le=1)

    @field_validator("taxonomy_slugs")
    @classmethod
    def safe_taxonomy_slugs(cls, values: list[str]) -> list[str]:
        result: list[str] = []
        for value in values:
            slug = value.strip().lower()
            if slug and len(slug) <= 80 and all(char.isalnum() or char == "-" for char in slug):
                result.append(slug)
        return list(dict.fromkeys(result))
