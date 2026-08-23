from __future__ import annotations

import argparse
import json

from .ai_store import AIStore
from .database import RepositoryStore
from .enrichment import RepositoryEnricher
from .evidence import EvidenceBuilder
from .github_client import GitHubClient
from .llm_client import OpenAICompatibleClient
from .operations import enqueue_enrichment_jobs
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

    enrich = sub.add_parser("enrich", help="Enrich one already-ingested repository immediately")
    enrich.add_argument("full_name")

    enqueue_ai = sub.add_parser(
        "enqueue-enrichment",
        help="Queue AI enrichment for repositories with current snapshots",
    )
    enqueue_ai.add_argument("--limit", type=int, default=None)
    enqueue_ai.add_argument("--priority", type=int, default=100)

    sub.add_parser("run-once", help="Claim and execute at most one queued job")
    return parser


def _build_enricher(settings: Settings) -> tuple[RepositoryEnricher, OpenAICompatibleClient]:
    if not settings.ai_api_key:
        raise ValueError("AI_API_KEY is required")
    if not settings.ai_model_enrich:
        raise ValueError("AI_MODEL_ENRICH is required")
    client = OpenAICompatibleClient(
        api_key=settings.ai_api_key,
        base_url=settings.ai_base_url,
        provider=settings.ai_provider,
        timeout_seconds=settings.ai_timeout_seconds,
    )
    enricher = RepositoryEnricher(
        evidence_builder=EvidenceBuilder(
            settings.database_url,
            max_source_chars=settings.ai_max_source_chars,
        ),
        store=AIStore(settings.database_url),
        client=client,
        analysis_model=settings.ai_model_enrich,
        review_model=settings.ai_model_review or settings.ai_model_enrich,
    )
    return enricher, client


def main() -> None:
    args = build_parser().parse_args()
    settings = Settings()

    if args.command in (None, "check"):
        print(
            json.dumps(
                {
                    "worker_concurrency": settings.worker_concurrency,
                    "github_api_version": settings.github_api_version,
                    "github_token_configured": bool(settings.github_token),
                    "ai_provider": settings.ai_provider,
                    "ai_api_key_configured": bool(settings.ai_api_key),
                    "ai_model_enrich_configured": bool(settings.ai_model_enrich),
                    "ai_model_review_configured": bool(settings.ai_model_review),
                }
            )
        )
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
        with GitHubClient(
            token=settings.github_token,
            api_version=settings.github_api_version,
        ) as client:
            result = RepositoryIngestor(client=client, store=store).ingest(args.full_name)
        print(result.model_dump_json())
        return

    if args.command == "enrich":
        enricher, client = _build_enricher(settings)
        try:
            result = enricher.enrich(args.full_name)
        finally:
            client.close()
        print(result.model_dump_json())
        return

    if args.command == "enqueue-enrichment":
        result = enqueue_enrichment_jobs(
            settings.database_url,
            priority=args.priority,
            limit=args.limit,
        )
        print(json.dumps({"eligible": result.eligible, "enqueued": result.enqueued}))
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
