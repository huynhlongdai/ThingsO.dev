from __future__ import annotations

import argparse
import json

from .database import RepositoryStore
from .github_client import GitHubClient
from .pipeline import RepositoryIngestor
from .runner import WorkerRunner
from .seed import enqueue_seed, load_seed
from .settings import Settings


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="thingso-worker")
    sub = parser.add_subparsers(dest="command")

    sub.add_parser("check", help="Print sanitized worker configuration")

    seed = sub.add_parser("seed-check", help="Validate a repository seed CSV")
    seed.add_argument("path")

    enqueue = sub.add_parser("enqueue-seed", help="Queue repositories from a seed CSV")
    enqueue.add_argument("path")

    ingest = sub.add_parser("ingest", help="Ingest one GitHub repository immediately")
    ingest.add_argument("full_name")

    sub.add_parser("run-once", help="Claim and execute at most one queued job")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    settings = Settings()

    if args.command in (None, "check"):
        print(json.dumps({
            "worker_concurrency": settings.worker_concurrency,
            "github_api_version": settings.github_api_version,
            "github_token_configured": bool(settings.github_token),
        }))
        return

    if args.command == "seed-check":
        rows = load_seed(args.path)
        print(json.dumps({"repositories": len(rows)}))
        return

    if args.command == "enqueue-seed":
        ids = enqueue_seed(RepositoryStore(settings.database_url), args.path)
        print(json.dumps({"jobs_enqueued": len(ids)}))
        return

    if args.command == "ingest":
        store = RepositoryStore(settings.database_url)
        with GitHubClient(token=settings.github_token, api_version=settings.github_api_version) as client:
            result = RepositoryIngestor(client=client, store=store).ingest(args.full_name)
        print(result.model_dump_json())
        return

    if args.command == "run-once":
        runner = WorkerRunner(settings)
        try:
            processed = runner.run_once()
        finally:
            runner.close()
        print(json.dumps({"processed": processed}))
        return


if __name__ == "__main__":
    main()
