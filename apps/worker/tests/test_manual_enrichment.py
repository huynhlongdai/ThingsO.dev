from __future__ import annotations

import json
from pathlib import Path

from thingso_worker.ai_models import RepositoryAnalysis

ROOT = Path(__file__).resolve().parents[3]
CANARY = ROOT / "data" / "manual-enrichment" / "canary-10.json"


def test_manual_enrichment_canary_has_ten_unique_valid_analyses() -> None:
    payload = json.loads(CANARY.read_text(encoding="utf-8"))

    assert len(payload) == 10
    names = [entry["full_name"] for entry in payload]
    assert len(names) == len(set(names))

    for entry in payload:
        analysis = RepositoryAnalysis.model_validate(entry["analysis"])
        assert analysis.confidence >= 0.65
        assert analysis.evidence == []
        assert analysis.summary


def test_manual_enrichment_build_idea_slugs_are_unique() -> None:
    payload = json.loads(CANARY.read_text(encoding="utf-8"))
    slugs = [
        idea["slug"]
        for entry in payload
        for idea in entry["analysis"].get("build_ideas", [])
    ]

    assert len(slugs) == len(set(slugs))
