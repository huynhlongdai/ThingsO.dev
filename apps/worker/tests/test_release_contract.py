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


def test_evidence_pack_v2_document_types_are_allowed_in_production_schema():
    migration = (ROOT / "packages/db/migrations/0003_evidence_pack_document_types.sql").read_text(
        encoding="utf-8"
    )
    expected = {
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
    }
    for document_type in expected:
        assert f"'{document_type}'" in migration


def test_evidence_refresh_fails_when_any_curated_repository_cannot_be_ingested():
    workflow = (ROOT / ".github/workflows/refresh-intelligence-evidence.yml").read_text(
        encoding="utf-8"
    )
    assert 'test "$total" -eq 100' in workflow
    assert 'test "$failed" -eq 0' in workflow
    assert 'attempt" -le 3' in workflow
