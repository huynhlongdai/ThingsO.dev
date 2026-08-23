from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import psycopg


@dataclass(frozen=True)
class MigrationResult:
    applied: tuple[str, ...]
    skipped: tuple[str, ...]


def apply_migrations(database_url: str, directory: str | Path) -> MigrationResult:
    root = Path(directory)
    files = sorted(root.glob("*.sql"))
    if not files:
        raise FileNotFoundError(f"No SQL migrations found in {root}")

    applied: list[str] = []
    skipped: list[str] = []

    with psycopg.connect(database_url, autocommit=True) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS schema_migrations (
                  version text PRIMARY KEY,
                  applied_at timestamptz NOT NULL DEFAULT now()
                )
                """
            )
            cur.execute("SELECT version FROM schema_migrations")
            existing = {row[0] for row in cur.fetchall()}

            for path in files:
                version = path.name
                if version in existing:
                    skipped.append(version)
                    continue
                sql = path.read_text(encoding="utf-8")
                cur.execute(sql)
                cur.execute(
                    "INSERT INTO schema_migrations (version) VALUES (%s)",
                    (version,),
                )
                applied.append(version)

    return MigrationResult(applied=tuple(applied), skipped=tuple(skipped))
