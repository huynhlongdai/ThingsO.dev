from __future__ import annotations

import argparse
import csv
import json
import os
from pathlib import Path

from thingso_worker.evidence_pack import collect_evidence_pack
from thingso_worker.github_client import GitHubClient

MAX_DOCUMENT_CHARS = 24_000


def _seed_names(path: Path, limit: int | None) -> list[str]:
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    names = [str(row["full_name"]).strip() for row in rows if str(row.get("full_name") or "").strip()]
    return names[:limit] if limit else names


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", default="data/seeds/repositories.csv")
    parser.add_argument("--output", default="evidence-packs.json")
    parser.add_argument("--limit", type=int)
    parser.add_argument("--min-success", type=int, default=95)
    args = parser.parse_args()

    token = os.getenv("GITHUB_TOKEN")
    names = _seed_names(Path(args.seed), args.limit)
    packets: list[dict[str, object]] = []
    failures: list[dict[str, str]] = []

    with GitHubClient(token=token, max_retries=2, timeout_seconds=25) as client:
        for index, full_name in enumerate(names, start=1):
            try:
                repository = client.get_repository(full_name)
                default_branch = str(repository.get("default_branch") or "main")
                documents: list[dict[str, object]] = []

                readme = client.get_readme(full_name)
                if readme:
                    text, source_url, ref = readme
                    documents.append(
                        {
                            "document_type": "readme",
                            "source_url": source_url,
                            "ref": ref,
                            "text": text[:MAX_DOCUMENT_CHARS],
                        }
                    )

                for document in collect_evidence_pack(
                    client,
                    full_name,
                    default_branch=default_branch,
                ):
                    documents.append(
                        {
                            "document_type": document.document_type,
                            "source_url": document.source_url,
                            "ref": document.ref,
                            "text": document.text[:MAX_DOCUMENT_CHARS],
                        }
                    )

                packets.append(
                    {
                        "full_name": full_name,
                        "repository": {
                            "description": repository.get("description"),
                            "homepage": repository.get("homepage"),
                            "default_branch": default_branch,
                            "language": repository.get("language"),
                            "license": (repository.get("license") or {}).get("spdx_id"),
                            "stars": int(repository.get("stargazers_count") or 0),
                            "forks": int(repository.get("forks_count") or 0),
                            "open_issues": int(repository.get("open_issues_count") or 0),
                            "archived": bool(repository.get("archived", False)),
                            "topics": repository.get("topics") or [],
                            "created_at": repository.get("created_at"),
                            "pushed_at": repository.get("pushed_at"),
                        },
                        "documents": documents,
                    }
                )
                print(f"[{index}/{len(names)}] collected {full_name}: {len(documents)} documents", flush=True)
            except Exception as exc:  # noqa: BLE001 - batch export records per-repo failures
                failures.append({"full_name": full_name, "error": str(exc)[:800]})
                print(f"[{index}/{len(names)}] failed {full_name}: {exc}", flush=True)

    output = {
        "schema_version": "evidence-pack-export-v1",
        "requested": len(names),
        "succeeded": len(packets),
        "failed": len(failures),
        "failures": failures,
        "repositories": packets,
    }
    Path(args.output).write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")

    if len(packets) < min(args.min_success, len(names)):
        raise SystemExit(
            f"Only {len(packets)} of {len(names)} evidence packs succeeded; minimum is {args.min_success}."
        )


if __name__ == "__main__":
    main()
