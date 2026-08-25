from __future__ import annotations

from thingso_worker.evidence_pack import MAX_SELECTED_FILES, select_evidence_paths


def test_evidence_selection_is_diverse_and_bounded_to_api_budget() -> None:
    tree = [
        {"type": "blob", "path": "package.json"},
        {"type": "blob", "path": "apps/web/package.json"},
        {"type": "blob", "path": "Dockerfile"},
        {"type": "blob", "path": ".env.example"},
        {"type": "blob", "path": "CONTRIBUTING.md"},
        {"type": "blob", "path": "SECURITY.md"},
        {"type": "blob", "path": ".github/workflows/ci.yml"},
        {"type": "blob", "path": "docs/architecture.md"},
        {"type": "blob", "path": "src/main.py"},
        {"type": "blob", "path": "CHANGELOG.md"},
        {"type": "blob", "path": "README.md"},
    ]

    selected = select_evidence_paths(tree)

    assert MAX_SELECTED_FILES == 5
    assert len(selected) == MAX_SELECTED_FILES
    assert "package.json" in selected
    assert "Dockerfile" in selected
    assert any(path in selected for path in {"CONTRIBUTING.md", "SECURITY.md"})
    assert "src/main.py" in selected
    assert "CHANGELOG.md" in selected
    assert "README.md" not in selected


def test_source_entrypoint_selection_is_bounded_to_likely_runtime_paths() -> None:
    tree = [
        {"type": "blob", "path": "src/main.py"},
        {"type": "blob", "path": "src/core/orchestrator.py"},
        {"type": "blob", "path": "examples/deep/demo/main.py"},
        {"type": "blob", "path": "examples/demo/src/runtime.py"},
        {"type": "blob", "path": "docs/main.py"},
        {"type": "blob", "path": "package.json"},
    ]

    selected = select_evidence_paths(tree)

    assert "src/main.py" in selected
    assert "src/core/orchestrator.py" in selected
    assert "examples/deep/demo/main.py" not in selected
    assert "examples/demo/src/runtime.py" not in selected
    assert "docs/main.py" not in selected


def test_evolution_documents_compete_as_one_diversity_group() -> None:
    tree = [
        {"type": "blob", "path": "package.json"},
        {"type": "blob", "path": "CHANGELOG.md"},
        {"type": "blob", "path": "ROADMAP.md"},
        {"type": "blob", "path": "Dockerfile"},
        {"type": "blob", "path": "src/main.ts"},
        {"type": "blob", "path": ".github/workflows/ci.yml"},
    ]

    selected = select_evidence_paths(tree)
    evolution = [path for path in selected if path in {"CHANGELOG.md", "ROADMAP.md"}]

    assert len(evolution) >= 1
    assert "src/main.ts" in selected
    assert ".github/workflows/ci.yml" in selected


def test_ci_and_architecture_docs_are_used_when_higher_value_groups_are_absent() -> None:
    tree = [
        {"type": "blob", "path": "package.json"},
        {"type": "blob", "path": ".github/workflows/ci.yml"},
        {"type": "blob", "path": "docs/architecture.md"},
        {"type": "blob", "path": "docs/getting-started.md"},
    ]

    selected = select_evidence_paths(tree)

    assert "package.json" in selected
    assert ".github/workflows/ci.yml" in selected
    assert "docs/architecture.md" in selected
