from __future__ import annotations

from thingso_worker.evidence_pack import MAX_SELECTED_FILES, select_evidence_paths


def test_evidence_selection_is_diverse_and_bounded() -> None:
    tree = [
        {"type": "blob", "path": "package.json"},
        {"type": "blob", "path": "apps/web/package.json"},
        {"type": "blob", "path": "Dockerfile"},
        {"type": "blob", "path": ".env.example"},
        {"type": "blob", "path": "CONTRIBUTING.md"},
        {"type": "blob", "path": "SECURITY.md"},
        {"type": "blob", "path": ".github/workflows/ci.yml"},
        {"type": "blob", "path": "docs/architecture.md"},
        {"type": "blob", "path": "README.md"},
    ]

    selected = select_evidence_paths(tree)

    assert len(selected) == MAX_SELECTED_FILES
    assert "package.json" in selected
    assert "Dockerfile" in selected
    assert any(path in selected for path in {"CONTRIBUTING.md", "SECURITY.md"})
    assert ".github/workflows/ci.yml" in selected
    assert "docs/architecture.md" in selected
    assert "README.md" not in selected
