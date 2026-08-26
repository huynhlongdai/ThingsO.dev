from pathlib import Path

from thingso_worker.editorial_baseline import generate_editorial_draft, load_seed_rows
from thingso_worker.editorial_use_cases import CATEGORY_USE_CASES, attach_curated_use_cases
from thingso_worker.intelligence_draft import EditorialIntelligenceDraftV3

ROOT = Path(__file__).resolve().parents[3]
SEED = ROOT / "data/seeds/repositories.csv"
MIGRATION = ROOT / "packages/db/migrations/0004_curated_use_cases.sql"


def test_every_curated_category_has_a_small_reviewed_use_case_mapping() -> None:
    categories = {row["category"] for row in load_seed_rows(SEED)}
    assert categories == set(CATEGORY_USE_CASES)

    slugs: set[str] = set()
    for category, mappings in CATEGORY_USE_CASES.items():
        assert 2 <= len(mappings) <= 3, category
        for slug, fit_score, reason in mappings:
            assert slug not in slugs or slug == "generative-media-pipelines"
            slugs.add(slug)
            assert 0.70 <= fit_score <= 1.0
            assert len(reason) >= 40

    assert len(slugs) == 36


def test_curated_use_case_terms_are_explicitly_activated_by_migration() -> None:
    migration = MIGRATION.read_text(encoding="utf-8")
    unique_slugs = {
        slug
        for mappings in CATEGORY_USE_CASES.values()
        for slug, _fit_score, _reason in mappings
    }
    assert len(unique_slugs) == 36
    for slug in unique_slugs:
        assert f"('{slug}'," in migration
    assert "ON CONFLICT (slug) DO UPDATE" in migration
    assert "status = 'active'" in migration


def test_all_100_editorial_drafts_receive_valid_use_cases_without_relations() -> None:
    rows = load_seed_rows(SEED)
    entries: list[dict[str, object]] = []
    for row in rows:
        draft = generate_editorial_draft(
            full_name=row["full_name"],
            category=row["category"],
            description=f"Current repository description for {row['full_name']}",
        )
        assert draft.relations == []
        entries.append({"full_name": row["full_name"], "draft": draft.model_dump(mode="json")})

    attached = attach_curated_use_cases(entries, SEED)
    assert len(attached) == 100
    for entry in attached:
        draft = EditorialIntelligenceDraftV3.model_validate(entry["draft"])
        assert 2 <= len(draft.use_cases) <= 3
        assert draft.relations == []


def test_th107_legacy_publication_is_preserved_only_for_manual_rollback() -> None:
    importer = (ROOT / "apps/worker/src/thingso_worker/manual_intelligence.py").read_text(
        encoding="utf-8"
    )
    workflow = (ROOT / ".github/workflows/publish-intelligence-v3.yml").read_text(
        encoding="utf-8"
    )

    assert 'PROMPT_VERSION = "manual-intelligence-v3-usecases-v1"' in importer
    assert "manual-intelligence-v3-usecases-v1" in workflow
    assert workflow.startswith("name: Legacy publish repository intelligence v3")
    assert "workflow_dispatch:" in workflow
    assert "workflow_run:" not in workflow
    assert "push:" not in workflow
    assert "Legacy publication warning" in workflow
    assert "evidence-depth publication" in workflow
