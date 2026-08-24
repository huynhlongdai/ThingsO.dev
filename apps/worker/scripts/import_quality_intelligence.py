from __future__ import annotations

import argparse
import json

import thingso_worker.manual_intelligence as manual_intelligence
from thingso_worker.quality_editorial import QUALITY_MODEL, QUALITY_PROMPT_VERSION
from thingso_worker.settings import Settings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    args = parser.parse_args()

    manual_intelligence.PROMPT_VERSION = QUALITY_PROMPT_VERSION
    manual_intelligence.MODEL = QUALITY_MODEL

    settings = Settings()
    results = manual_intelligence.import_manual_intelligence(settings.database_url, args.path)
    print(json.dumps([result.as_dict() for result in results], indent=2))


if __name__ == "__main__":
    main()
