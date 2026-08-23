from __future__ import annotations

from dataclasses import dataclass

import psycopg
from psycopg.types.json import Jsonb


@dataclass(frozen=True)
class EnrichmentQueueResult:
    eligible: int
    enqueued: int


def enqueue_enrichment_jobs(
    database_url: str,
    *,
    priority: int = 100,
    limit: int | None = None,
) -> EnrichmentQueueResult:
    if limit is not None and limit < 1:
        raise ValueError("limit must be positive")

    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT r.id, r.full_name
                FROM repositories r
                WHERE r.current_snapshot_id IS NOT NULL
                  AND NOT EXISTS (
                    SELECT 1
                    FROM ingestion_jobs j
                    WHERE j.job_type = 'enrich_repository'
                      AND lower(j.payload_json->>'full_name') = lower(r.full_name)
                      AND j.status IN ('queued','running','retry')
                  )
                ORDER BY r.updated_at DESC, r.full_name ASC
                """
            )
            rows = cur.fetchall()
            eligible = len(rows)
            if limit is not None:
                rows = rows[:limit]
            for repository_id, full_name in rows:
                cur.execute(
                    """
                    INSERT INTO ingestion_jobs (job_type, entity_id, payload_json, priority)
                    VALUES ('enrich_repository', %s, %s, %s)
                    """,
                    (repository_id, Jsonb({"full_name": full_name}), priority),
                )
        conn.commit()
    return EnrichmentQueueResult(eligible=eligible, enqueued=len(rows))
