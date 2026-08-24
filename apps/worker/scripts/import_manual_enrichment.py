from __future__ import annotations

import argparse
import json

from thingso_worker.manual_enrichment import import_manual_enrichment
from thingso_worker.settings import Settings


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    args = parser.parse_args()

    settings = Settings()
    results = import_manual_enrichment(settings.database_url, args.path)
    print(json.dumps([result.as_dict() for result in results], indent=2))


if __name__ == "__main__":
    main()
