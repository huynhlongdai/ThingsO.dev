from pathlib import Path

from thingso_worker.editorial_baseline import TEMPLATES, generate_editorial_draft, load_seed_rows


SEED = Path(__file__).parents[3] / "data" / "seeds" / "repositories.csv"


def test_every_curated_repository_generates_a_valid_v3_draft() -> None:
    rows = load_seed_rows(SEED)
    assert len(rows) == 100
    assert len({row["full_name"].lower() for row in rows}) == 100

    for row in rows:
        draft = generate_editorial_draft(
            full_name=row["full_name"],
            category=row["category"],
            description=f"Current repository description for {row['full_name']}",
        )
        assert draft.confidence >= 0.70
        assert len(draft.components) >= 3
        assert len(draft.data_flow) >= 2
        assert len(draft.capabilities) >= 3
        assert draft.taxonomy_slugs


def test_seed_categories_are_covered_by_baseline_templates() -> None:
    rows = load_seed_rows(SEED)
    categories = {row["category"] for row in rows}
    assert categories <= set(TEMPLATES)


def test_description_is_preserved_as_repository_specific_evidence_claim() -> None:
    description = "A focused tool that turns a protocol into a developer-friendly API"
    draft = generate_editorial_draft(
        full_name="example/project",
        category="api",
        description=description,
    )
    assert description in draft.definition
    assert any(description in item for item in draft.differentiators)
