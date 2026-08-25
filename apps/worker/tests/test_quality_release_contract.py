from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_evidence_depth_workflow_is_versioned_and_fail_closed() -> None:
    workflow = (ROOT / ".github/workflows/publish-intelligence-quality-v2.yml").read_text(
        encoding="utf-8"
    )

    assert workflow.startswith("name: Publish intelligence evidence-depth v1")
    assert 'workflows: ["Refresh intelligence evidence"]' in workflow
    assert "Deploy production" not in workflow
    assert "generate_quality_intelligence.py" in workflow
    assert "import_quality_intelligence.py" in workflow
    assert "manual-intelligence-v3-evidence-depth-v1" in workflow
    assert "evidence-depth-editorial-v1" in workflow
    assert "source_snapshot_id = r.current_snapshot_id" in workflow
    assert 'test "$APPROVED" -eq "$TOTAL"' in workflow
    assert 'test "$REVIEW" -eq 0' in workflow
    assert "Current-snapshot reconciliation: required after every evidence refresh" in workflow
    assert "Category-template semantic leakage gate: enabled" in workflow
    assert "Semantic duplicate gate: enabled" in workflow
    assert "Unknown/sparse sections: explicitly allowed" in workflow
    assert "Overall confidence: evidence-coverage weighted" in workflow


def test_status_beacon_reports_evidence_depth_v1() -> None:
    beacon = (ROOT / ".github/workflows/production-status-beacon.yml").read_text(
        encoding="utf-8"
    )
    assert "Publish intelligence evidence-depth v1" in beacon
    assert "Legacy publish repository intelligence v3" in beacon


def test_quality_contract_documents_accuracy_before_completeness() -> None:
    contract = (ROOT / "docs/data-quality/repository-intelligence-quality-v2.md").read_text(
        encoding="utf-8"
    )
    assert "accurate before it is complete" in contract
    assert "Unknown is valid data" in contract
    assert "near-duplicate" in contract
