from __future__ import annotations

import json
from pathlib import Path
from thingso_worker.ai_models import RepositoryAnalysis

ROOT = Path(__file__).resolve().parents[3]
DATASET = ROOT / "data" / "manual-enrichment" / "batch-11-25.json"


def test_batch_11_25_has_fifteen_unique_valid_analyses() -> None:
    payload = json.loads(DATASET.read_text(encoding="utf-8"))

    assert len(payload) == 15
    names = [entry["full_name"] for entry in payload]
    assert len(names) == len(set(names))

    for entry in payload:
        analysis = RepositoryAnalysis.model_validate(entry["analysis"])
        assert analysis.confidence >= 0.65
        assert analysis.summary
        assert analysis.evidence == []


def test_batch_11_25_build_idea_slugs_are_unique() -> None:
    payload = json.loads(DATASET.read_text(encoding="utf-8"))
    slugs = [
        idea["slug"]
        for entry in payload
        for idea in entry["analysis"].get("build_ideas", [])
    ]

    assert len(slugs) == len(set(slugs))
