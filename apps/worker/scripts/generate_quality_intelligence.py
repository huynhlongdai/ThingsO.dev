from __future__ import annotations

import argparse
import json
from pathlib import Path

from thingso_worker.quality_editorial import generate_quality_entries
from thingso_worker.settings import Settings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", default="data/seeds/repositories.csv")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    settings = Settings()
    entries = generate_quality_entries(settings.database_url, args.seed)
    output = Path(args.output)
    output.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"generated": len(entries), "output": str(output), "quality": "v2"}))


if __name__ == "__main__":
    main()
