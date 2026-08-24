from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_quality_v2_workflow_is_versioned_and_fail_closed() -> None:
    workflow = (ROOT / ".github/workflows/publish-intelligence-quality-v2.yml").read_text(
        encoding="utf-8"
    )

    assert 'workflows: ["Deploy production"]' in workflow
    assert "change-gate:" in workflow
    assert "quality_editorial.py" in workflow
    assert "generate_quality_intelligence.py" in workflow
    assert "import_quality_intelligence.py" in workflow
    assert "manual-intelligence-v3-quality-v2" in workflow
    assert "evidence-editorial-quality-v2" in workflow
    assert 'test "$QUALITY" -ge 100' in workflow
    assert 'test "$REVIEW" -eq 0' in workflow
    assert "Semantic duplicate gate: passed during generation" in workflow


def test_status_beacon_reports_quality_v2() -> None:
    beacon = (ROOT / ".github/workflows/production-status-beacon.yml").read_text(
        encoding="utf-8"
    )
    assert "Publish intelligence quality v2" in beacon


def test_quality_contract_documents_accuracy_before_completeness() -> None:
    contract = (ROOT / "docs/data-quality/repository-intelligence-quality-v2.md").read_text(
        encoding="utf-8"
    )
    assert "accurate before it is complete" in contract
    assert "Unknown is valid data" in contract
    assert "near-duplicate" in contract
