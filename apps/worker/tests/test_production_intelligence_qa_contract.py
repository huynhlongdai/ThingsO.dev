from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]


def test_post_publication_qa_uses_evidence_depth_provenance() -> None:
    script = (ROOT / "apps/worker/scripts/qa_published_intelligence.py").read_text(encoding="utf-8")
    assert "DEPTH_MODEL" in script
    assert "DEPTH_PROMPT_VERSION" in script
    assert "quality_issues" in script
    assert "TauricResearch/TradingAgents" in script
    assert "source_snapshot_id = r.current_snapshot_id" in script
    assert "review_status = 'approved'" in script
    assert "approved_evidence_depth_profiles" in script
    assert "non_approved_evidence_depth_profiles" in script
    assert "architecture_components" in script
    assert "persistence_model" in script


def test_production_qa_checks_public_tradingagents_depth() -> None:
    workflow = (ROOT / ".github/workflows/verify-intelligence-production.yml").read_text(
        encoding="utf-8"
    )
    assert 'workflows: ["Publish intelligence evidence-depth v1"]' in workflow
    assert "qa_published_intelligence.py" in workflow
    assert "https://thingso.dev/repos/TauricResearch/TradingAgents" in workflow
    assert "Its curated role in the ThingsO catalog" in workflow
    assert "exact implementation differentiation is verified" in workflow
    assert "Analyst Team" in workflow
    assert "Trader Agent" in workflow
    assert "README-backed architecture components: visible" in workflow
    assert "https://thingso.dev/api/health" in workflow


def test_status_beacon_reports_production_intelligence_qa() -> None:
    beacon = (ROOT / ".github/workflows/production-status-beacon.yml").read_text(encoding="utf-8")
    assert "Publish intelligence evidence-depth v1" in beacon
    assert "Verify production intelligence" in beacon
