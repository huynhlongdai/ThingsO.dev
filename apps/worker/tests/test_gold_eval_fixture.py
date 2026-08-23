import json
from pathlib import Path


def test_gold_eval_fixture_is_well_formed() -> None:
    path = Path(__file__).resolve().parents[3] / "data" / "evals" / "repository-analysis-gold.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    assert payload["version"] == "gold-v1"
    cases = payload["cases"]
    assert len(cases) >= 3
    names = [case["full_name"].lower() for case in cases]
    assert len(names) == len(set(names))
    for case in cases:
        assert "/" in case["full_name"]
        assert case["expected_capability_any"]
        assert case["forbidden_claims"]
