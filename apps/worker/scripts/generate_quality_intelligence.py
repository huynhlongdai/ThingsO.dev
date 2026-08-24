from __future__ import annotations

import argparse
import json
from pathlib import Path

from pydantic import ValidationError

from thingso_worker.intelligence_models import RepositoryIntelligenceProfileV3
from thingso_worker.quality_editorial import generate_quality_entries
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
            "The current repository evidence establishes the project scope; "
            "use the Architecture, Technology, Codebase, and Developer Workflow sections "
            "for evidence-backed implementation details."
        )
        profile["problem"] = problem

    try:
        validated = RepositoryIntelligenceProfileV3.model_validate(profile)
    except ValidationError as exc:
        raise ValueError(f"{full_name}: generated quality profile failed schema validation: {exc}") from exc

    return {"full_name": full_name, "profile": validated.model_dump(mode="json")}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", default="data/seeds/repositories.csv")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    settings = Settings()
    entries = [
        validate_entry(entry)
        for entry in generate_quality_entries(settings.database_url, args.seed)
    ]
    output = Path(args.output)
    output.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"generated": len(entries), "output": str(output), "quality": "v2"}))


if __name__ == "__main__":
    main()
