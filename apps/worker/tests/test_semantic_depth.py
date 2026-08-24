from __future__ import annotations

from thingso_worker.semantic_depth import enhance_profile_from_markdown, parse_markdown_sections


def _profile() -> dict[str, object]:
    return {
        "architecture": {
            "overview": "Architecture details are not established from the current bounded evidence pack.",
            "components": [],
            "persistence_model": {"value": None, "state": "unknown", "confidence": None, "evidence": []},
            "evidence": ["repository_tree"],
        },
        "deployment_operations": {
            "failure_recovery": {"value": None, "state": "unknown", "confidence": None, "evidence": []},
        },
        "capabilities": [],
        "limitations": [],
        "differentiation": {"differentiators": [], "unique_capabilities": []},
        "audience": {"poor_fit": []},
        "decision": {"avoid_when": []},
        "section_confidence": {"architecture": None, "identity": 0.9},
    }


def test_heading_hierarchy_extracts_repo_stated_architecture_without_filler() -> None:
    markdown = """
## TradingAgents Framework
TradingAgents is a multi-agent trading framework that mirrors the dynamics of real-world trading firms.

### Analyst Team
Fundamentals, sentiment, news, and technical analysts evaluate market conditions from specialized perspectives.

### Researcher Team
Bullish and bearish researchers debate the analyst reports and balance potential gains against risks.

### Trader Agent
The trader composes the reports and produces a trading decision.

### Risk Management and Portfolio Manager
The risk team evaluates the proposal and the portfolio manager approves or rejects it.

## Persistence and Recovery
TradingAgents persists a decision log across runs and can save graph checkpoints after each node.
Checkpoint resume lets an interrupted run continue from the last successful step.

> TradingAgents is designed for research purposes. Trading performance may vary based on model and data quality. It is not intended as financial, investment, or trading advice.
"""

    sections = parse_markdown_sections(markdown)
    analyst = next(section for section in sections if section.title == "Analyst Team")
    assert "tradingagents framework" in analyst.ancestors

    enriched = enhance_profile_from_markdown(_profile(), markdown)
    architecture = enriched["architecture"]
    assert isinstance(architecture, dict)
    assert "multi-agent trading framework" in str(architecture["overview"])

    components = architecture["components"]
    assert isinstance(components, list)
    assert len(components) >= 4
    assert {component["name"] for component in components} >= {"Analyst Team", "Trader Agent"}

    persistence = architecture["persistence_model"]
    assert isinstance(persistence, dict)
    assert persistence["state"] == "known"
    assert "decision log" in str(persistence["value"])

    limitations = enriched["limitations"]
    assert isinstance(limitations, list)
    assert any("research purposes" in item for item in limitations)
    assert any("not intended" in item for item in limitations)

    differentiation = enriched["differentiation"]
    assert differentiation == {"differentiators": [], "unique_capabilities": []}
    assert float(enriched["section_confidence"]["architecture"]) >= 0.85
