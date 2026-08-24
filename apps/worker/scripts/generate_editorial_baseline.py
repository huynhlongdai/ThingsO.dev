from __future__ import annotations

import argparse
import json
from pathlib import Path

from thingso_worker.editorial_baseline import generate_seed_entries
from thingso_worker.editorial_use_cases import attach_curated_use_cases
from thingso_worker.settings import Settings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", default="data/seeds/repositories.csv")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    settings = Settings()
    entries = generate_seed_entries(settings.database_url, args.seed)
    entries = attach_curated_use_cases(entries, args.seed)
    output = Path(args.output)
    output.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"generated": len(entries), "output": str(output)}))


if __name__ == "__main__":
    main()
