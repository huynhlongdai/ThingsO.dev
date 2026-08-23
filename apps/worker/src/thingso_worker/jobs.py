from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import UUID

import psycopg
from psycopg.rows import dict_row


@dataclass(frozen=True)
class Job:
    id: UUID
    job_type: str
    payload: dict[str, Any]
    attempt_count: int


def retry_delay_seconds(attempt_count: int) -> int:
    return min(3600, max(5, 5 * (2 ** max(0, attempt_count - 1))))


class JobQueue:
    def __init__(self, database_url: str, *, worker_id: str) -> None:
        self.database_url = database_url
        self.worker_id = worker_id

    def claim_next(self) -> Job | None:
        with psycopg.connect(self.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    WITH next_job AS (
                      SELECT id
                      FROM ingestion_jobs
                      WHERE status IN ('queued','retry') AND available_at <= now()
                      ORDER BY priority ASC, created_at ASC
                      FOR UPDATE SKIP LOCKED
                      LIMIT 1
                    )
                    UPDATE ingestion_jobs AS j
                    SET status = 'running', locked_at = now(), locked_by = %s, attempt_count = attempt_count + 1
                    FROM next_job
                    WHERE j.id = next_job.id
                    RETURNING j.id, j.job_type, j.payload_json, j.attempt_count
                    """,
                    (self.worker_id,),
                )
                row = cur.fetchone()
            conn.commit()
        if not row:
            return None
        return Job(id=row["id"], job_type=row["job_type"], payload=dict(row["payload_json"]), attempt_count=row["attempt_count"])

    def succeed(self, job_id: UUID) -> None:
        self._finish(job_id, status="succeeded", error=None, available_at=None)

    def fail(self, job: Job, error: str, *, max_attempts: int = 5) -> None:
        if job.attempt_count >= max_attempts:
            self._finish(job.id, status="dead", error=error, available_at=None)
            return
        delay = retry_delay_seconds(job.attempt_count)
        self._finish(
            job.id,
            status="retry",
            error=error,
            available_at=datetime.now(timezone.utc) + timedelta(seconds=delay),
        )

    def recover_stale(self, *, older_than_minutes: int = 15) -> int:
        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE ingestion_jobs
                    SET status = 'retry', locked_at = NULL, locked_by = NULL,
                        available_at = now(), error = COALESCE(error, 'Recovered stale worker lock')
                    WHERE status = 'running' AND locked_at < now() - (%s * interval '1 minute')
                    """,
                    (older_than_minutes,),
                )
                count = cur.rowcount
            conn.commit()
        return count

    def _finish(self, job_id: UUID, *, status: str, error: str | None, available_at: datetime | None) -> None:
        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE ingestion_jobs
                    SET status = %s, error = %s, available_at = COALESCE(%s, available_at),
                        locked_at = NULL, locked_by = NULL
                    WHERE id = %s
                    """,
                    (status, error[:4000] if error else None, available_at, job_id),
                )
            conn.commit()
