from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_curated_seed_contains_100_repositories():
    lines = (ROOT / "data/seeds/repositories.csv").read_text(encoding="utf-8").strip().splitlines()
    assert lines[0] == "full_name,category,priority"
    assert len(lines) == 101
    assert len({line.split(",", 1)[0].lower() for line in lines[1:]}) == 100


def test_production_postgres_is_not_published_to_host():
    compose = (ROOT / "deploy/compose.prod.yml").read_text(encoding="utf-8")
    postgres_section = compose.split("  web:", 1)[0]
    assert '"5432:5432"' not in postgres_section
    assert "service_completed_successfully" in compose


def test_https_proxy_targets_web_service():
    caddy = (ROOT / "deploy/Caddyfile").read_text(encoding="utf-8")
    assert "thingso.dev" in caddy
    assert "reverse_proxy web:3000" in caddy
    assert "Strict-Transport-Security" in caddy


def test_evidence_pack_v3_document_types_are_allowed_in_production_schema():
    migration_v2 = (ROOT / "packages/db/migrations/0003_evidence_pack_document_types.sql").read_text(
        encoding="utf-8"
    )
    migration_v3 = (ROOT / "packages/db/migrations/0005_evidence_pack_v3_document_types.sql").read_text(
        encoding="utf-8"
    )
    for document_type in {
        "readme",
        "documentation",
        "package",
        "other",
        "repository_tree",
        "manifest",
        "container",
        "configuration",
        "contributing",
        "security",
        "architecture",
        "ci",
        "source_entrypoint",
    }:
        assert f"'{document_type}'" in migration_v2
    assert "'source_entrypoint'" in migration_v3
    assert "'changelog'" in migration_v3


def test_evidence_refresh_fails_when_any_curated_repository_cannot_be_reconciled():
    workflow = (ROOT / ".github/workflows/refresh-intelligence-evidence.yml").read_text(
        encoding="utf-8"
    )
    assert 'test "$total" -eq 100' in workflow
    assert 'test "$failed" -eq 0' in workflow
    assert 'attempt" -le 3' in workflow
    assert "ingest \"$full_name\"" in workflow
    assert "--repository \"$full_name\"" in workflow
    assert "import_quality_intelligence.py \"$output\"" in workflow
    assert 'test "$DEPTH" -eq "$REPOS"' in workflow
    assert 'test "$REVIEW" -eq 0' in workflow


def test_data_maintenance_remains_decoupled_from_application_deploys():
    refresh = (ROOT / ".github/workflows/refresh-intelligence-evidence.yml").read_text(
        encoding="utf-8"
    )
    activation = (ROOT / ".github/workflows/activate-data.yml").read_text(encoding="utf-8")
    legacy_publish = (ROOT / ".github/workflows/publish-intelligence-v3.yml").read_text(
        encoding="utf-8"
    )
    depth_publish = (ROOT / ".github/workflows/publish-intelligence-quality-v2.yml").read_text(
        encoding="utf-8"
    )

    assert "workflow_dispatch:" in refresh
    assert 'cron: "17 2 * * *"' in refresh
    assert "Deploy production" not in refresh
    assert "workflow_run:" not in refresh
    assert "refresh + reconcile" in refresh
    assert "semantic_depth.py" not in refresh  # execution is encapsulated by generation script

    assert "workflow_dispatch:" in activation
    assert "Deploy production" not in activation
    assert "schedule:" not in activation

    assert legacy_publish.startswith("name: Legacy publish repository intelligence v3")
    assert "workflow_dispatch:" in legacy_publish
    assert "workflow_run:" not in legacy_publish

    assert 'workflows: ["Deploy production", "Refresh intelligence evidence"]' in depth_publish
    assert "if (run.name === 'Refresh intelligence evidence')" in depth_publish
    assert "files.some(file => watched.includes(file))" in depth_publish
    assert "UI-only releases must not reprocess all curated repositories" in depth_publish
