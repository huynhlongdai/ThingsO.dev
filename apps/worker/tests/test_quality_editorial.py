from thingso_worker.quality_editorial import (
    _distinct,
    _items_for,
    _paragraph_for,
    _sections,
    similarity,
)


def test_similarity_detects_duplicate_semantics() -> None:
    left = "Building agents requires tools, state, retries, and control flow."
    right = "Building agents requires tools, state, retries and control flow"
    assert similarity(left, right) > 0.90
    assert similarity(left, "A browser driver controls Chromium sessions") < 0.50


def test_readme_sections_extract_problem_and_features_separately() -> None:
    readme = """
# Example
A repository-specific introduction.

## Problem
Teams repeatedly write fragile integration glue and manual retry logic.

## Features
- Durable execution history
- Typed provider adapters
- Retry-aware task workers

## Why choose Example
- Small extension surface with explicit provider boundaries
- Self-hosted runtime with local state ownership
"""
    sections = _sections(readme)
    problem = _paragraph_for(sections, ("problem",))
    features = _items_for(sections, ("features",))
    why = _items_for(sections, ("why choose",))

    assert problem is not None
    assert "fragile integration glue" in problem
    assert "Durable execution history" in features
    assert "provider boundaries" in why[0]
    assert all(similarity(problem, feature) < 0.80 for feature in features)


def test_distinct_removes_near_duplicate_items() -> None:
    values = [
        "Repository provides durable workflow execution.",
        "Repository provides durable workflow execution",
        "Repository exposes a typed provider adapter layer.",
    ]
    result = _distinct(values)
    assert len(result) == 2
