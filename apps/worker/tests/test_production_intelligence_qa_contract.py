from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_post_publication_qa_uses_evidence_only_provenance() -> None:
    script = (ROOT / "apps/worker/scripts/qa_published_intelligence.py").read_text(encoding="utf-8")
    assert "QUALITY_MODEL" in script
    assert "QUALITY_PROMPT_VERSION" in script
    assert "quality_issues" in script
    assert "TauricResearch/TradingAgents" in script
    assert "source_snapshot_id = r.current_snapshot_id" in script
    assert "review_status = 'approved'" in script


def test_production_qa_checks_public_tradingagents_route() -> None:
    workflow = (ROOT / ".github/workflows/verify-intelligence-production.yml").read_text(
        encoding="utf-8"
    )
    assert 'workflows: ["Publish intelligence evidence-only v1"]' in workflow
    assert "qa_published_intelligence.py" in workflow
    assert "https://thingso.dev/repos/TauricResearch/TradingAgents" in workflow
    assert "Its curated role in the ThingsO catalog" in workflow
    assert "exact implementation differentiation is verified" in workflow
    assert "https://thingso.dev/api/health" in workflow


def test_status_beacon_reports_production_intelligence_qa() -> None:
    beacon = (ROOT / ".github/workflows/production-status-beacon.yml").read_text(encoding="utf-8")
    assert "Verify production intelligence" in beacon
