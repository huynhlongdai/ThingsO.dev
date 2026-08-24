from __future__ import annotations

import argparse
import json
from pathlib import Path

from pydantic import ValidationError

from thingso_worker.intelligence_models import RepositoryIntelligenceProfileV3
from thingso_worker.quality_editorial import (
    generate_quality_entries,
    generate_quality_entry,
    quality_issues,
)
from thingso_worker.semantic_depth import enhance_quality_entry
from thingso_worker.settings import Settings


def validate_entry(entry: dict[str, object]) -> dict[str, object]:
    full_name = str(entry.get("full_name") or "<unknown>")
    raw = entry.get("profile")
    if not isinstance(raw, dict):
        raise ValueError(f"{full_name}: quality entry is missing profile data")

    profile = dict(raw)
    problem = dict(profile.get("problem") or {})
    solution = str(problem.get("solution_approach") or "").strip()
    if len(solution) < 20:
        problem["solution_approach"] = (
            f"A more specific solution approach for {full_name} is not established "
            "from the current bounded evidence pack."
        )
        profile["problem"] = problem

    # Overall confidence includes evidence coverage. Unsupported sections contribute zero
    # instead of being silently excluded from the average, so a sparse profile cannot show
    # an inflated 80–90% overall confidence merely because a few deterministic facts are strong.
    section_confidence = profile.get("section_confidence")
    if isinstance(section_confidence, dict) and section_confidence:
        values = list(section_confidence.values())
        score = sum(float(value) if isinstance(value, (int, float)) else 0.0 for value in values) / len(values)
        profile["confidence"] = round(max(0.0, min(score, 1.0)), 4)

    try:
        validated = RepositoryIntelligenceProfileV3.model_validate(profile)
    except ValidationError as exc:
        raise ValueError(f"{full_name}: generated quality profile failed schema validation: {exc}") from exc

    issues = quality_issues(validated)
    if issues:
        raise ValueError(f"{full_name}: post-depth semantic gate failed: {'; '.join(issues)}")

    return {"full_name": full_name, "profile": validated.model_dump(mode="json")}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", default="data/seeds/repositories.csv")
    parser.add_argument("--repository")
    parser.add_argument("--category")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    if bool(args.repository) != bool(args.category):
        parser.error("--repository and --category must be supplied together")

    settings = Settings()
    if args.repository:
        base_entries = [
            generate_quality_entry(
                settings.database_url,
                args.repository,
                args.category,
            )
        ]
    else:
        base_entries = generate_quality_entries(settings.database_url, args.seed)

    entries = [
        validate_entry(enhance_quality_entry(settings.database_url, entry))
        for entry in base_entries
    ]
    output = Path(args.output)
    output.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"generated": len(entries), "output": str(output), "quality": "evidence-depth-v1"}))


if __name__ == "__main__":
    main()
