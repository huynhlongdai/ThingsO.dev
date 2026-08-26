from __future__ import annotations

import pytest

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


GOLD_FIXTURES = [
    (
        "ai-agent",
        "Architecture",
        "Agent Runtime",
        "The runtime coordinates tool calls and agent state across a bounded execution graph.",
    ),
    (
        "automation",
        "System Design",
        "Worker Service",
        "Workers execute queued automation steps while the control plane schedules workflow runs.",
    ),
    (
        "browser-automation",
        "Internals",
        "Browser Controller",
        "The controller translates high-level browser actions into isolated page operations.",
    ),
    (
        "self-hosting",
        "Implementation Details",
        "Server Module",
        "The server module exposes the local application surface and coordinates background tasks.",
    ),
    (
        "rag-memory",
        "Architecture",
        "Indexing Pipeline",
        "The indexing pipeline normalizes documents before retrieval data is written to storage.",
    ),
    (
        "testing",
        "Execution Model",
        "Test Runner Service",
        "The runner service executes test jobs and reports deterministic results to the coordinator.",
    ),
    (
        "observability",
        "System Design",
        "Collector Agent",
        "The collector receives telemetry batches and forwards normalized events to downstream storage.",
    ),
    (
        "media",
        "Architecture",
        "Render Worker",
        "Render workers process media jobs independently and return artifacts to the orchestration layer.",
    ),
    (
        "developer-tooling",
        "Framework",
        "CLI Client",
        "The CLI client validates commands and invokes the framework runtime through a narrow interface.",
    ),
    (
        "data-platform",
        "Internals",
        "Storage Engine",
        "The storage engine owns durable records and exposes reads through repository-defined adapters.",
    ),
]


@pytest.mark.parametrize("fixture_id,root_heading,component_heading,responsibility", GOLD_FIXTURES)
def test_semantic_depth_generalizes_across_repository_domains(
    fixture_id: str,
    root_heading: str,
    component_heading: str,
    responsibility: str,
) -> None:
    markdown = f"""
# {fixture_id}
Repository fixture for semantic-depth regression coverage.

## {root_heading}
This section documents the repository-specific architecture for the {fixture_id} fixture.

### {component_heading}
{responsibility}
"""

    enriched = enhance_profile_from_markdown(_profile(), markdown)
    architecture = enriched["architecture"]
    assert isinstance(architecture, dict)
    assert fixture_id in str(architecture["overview"])
    components = architecture["components"]
    assert isinstance(components, list)
    assert any(component["name"] == component_heading for component in components)
    assert enriched["differentiation"] == {"differentiators": [], "unique_capabilities": []}
    assert float(enriched["section_confidence"]["architecture"]) >= 0.81


def test_heading_hierarchy_extracts_explicit_persistence_recovery_and_limitations() -> None:
    markdown = """
## TradingAgents Framework
TradingAgents is a multi-agent trading framework that mirrors the dynamics of real-world trading firms.

### Analyst Team
Fundamentals, sentiment, news, and technical analysts evaluate market conditions from specialized perspectives.

### Trader Agent
The trader composes the reports and produces a trading decision.

## Persistence and Recovery
TradingAgents persists a decision log across runs and can save graph checkpoints after each node.
Checkpoint resume lets an interrupted run continue from the last successful step.

> TradingAgents is designed for research purposes. Trading performance may vary based on model and data quality. It is not intended as financial, investment, or trading advice.
"""

    enriched = enhance_profile_from_markdown(_profile(), markdown)
    architecture = enriched["architecture"]
    persistence = architecture["persistence_model"]
    assert persistence["state"] == "known"
    assert "decision log" in str(persistence["value"])

    recovery = enriched["deployment_operations"]["failure_recovery"]
    assert recovery["state"] == "known"
    assert "checkpoint" in str(recovery["value"]).lower()

    limitations = enriched["limitations"]
    assert any("research purposes" in item for item in limitations)
    assert any("not intended" in item for item in limitations)
    assert enriched["differentiation"] == {"differentiators": [], "unique_capabilities": []}


def test_component_matching_uses_phrase_boundaries_and_ignores_code_fences() -> None:
    markdown = """
## Architecture
The actual architecture uses a narrow runtime boundary and does not infer components from arbitrary headings.

### Management Notes
This heading contains the letters agent but is not an agent component and must not become one.

```markdown
### Agent Service
This fake component exists inside a fenced example and must be ignored by the parser.
```

### Runtime Engine
The runtime engine coordinates real execution work for this repository.
"""

    sections = parse_markdown_sections(markdown)
    assert all(section.title != "Agent Service" for section in sections)

    enriched = enhance_profile_from_markdown(_profile(), markdown)
    components = enriched["architecture"]["components"]
    names = {component["name"] for component in components}
    assert "Runtime Engine" in names
    assert "Management Notes" not in names
    assert "Agent Service" not in names


def test_sparse_readme_preserves_unknown_state_instead_of_inventing_depth() -> None:
    markdown = """
# Tiny Tool
A compact utility with a short repository description and no architecture documentation.

## Usage
Run the documented command to use the utility in a local project.
"""

    enriched = enhance_profile_from_markdown(_profile(), markdown)
    architecture = enriched["architecture"]
    assert "not established" in str(architecture["overview"]).lower()
    assert architecture["components"] == []
    assert architecture["persistence_model"]["state"] == "unknown"
    assert enriched["deployment_operations"]["failure_recovery"]["state"] == "unknown"
