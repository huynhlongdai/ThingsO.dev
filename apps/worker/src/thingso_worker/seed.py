from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path

from .database import RepositoryStore

_REPO = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")


@dataclass(frozen=True)
class SeedRepository:
    full_name: str
    category: str
    priority: int


def load_seed(path: str | Path) -> list[SeedRepository]:
    rows: list[SeedRepository] = []
    seen: set[str] = set()
    with Path(path).open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        required = {"full_name", "category", "priority"}
        if not reader.fieldnames or not required.issubset(set(reader.fieldnames)):
            raise ValueError(f"Seed CSV must contain columns: {', '.join(sorted(required))}")
        for line, raw in enumerate(reader, start=2):
            full_name = (raw.get("full_name") or "").strip()
            if not _REPO.fullmatch(full_name):
                raise ValueError(f"Invalid repository on line {line}: {full_name!r}")
            key = full_name.lower()
            if key in seen:
                continue
            seen.add(key)
            category = (raw.get("category") or "uncategorized").strip() or "uncategorized"
            try:
                priority = int(raw.get("priority") or 100)
            except ValueError as exc:
                raise ValueError(f"Invalid priority on line {line}") from exc
            rows.append(SeedRepository(full_name=full_name, category=category, priority=priority))
    return rows


def enqueue_seed(store: RepositoryStore, path: str | Path) -> list[str]:
    job_ids: list[str] = []
    for row in load_seed(path):
        job_id = store.enqueue_job(
            "ingest_repository",
            {"full_name": row.full_name, "category": row.category},
            priority=row.priority,
        )
        job_ids.append(str(job_id))
    return job_ids
