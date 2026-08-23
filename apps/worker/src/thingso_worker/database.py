from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

import psycopg
from psycopg.types.json import Jsonb

from .models import LanguageFact, RepositoryFacts, SourceDocument


@dataclass(frozen=True)
class SnapshotWriteResult:
    repository_id: UUID
    snapshot_id: UUID
    reused_snapshot: bool


class RepositoryStore:
    def __init__(self, database_url: str) -> None:
        self.database_url = database_url

    def write_repository_snapshot(
        self,
        facts: RepositoryFacts,
        languages: list[LanguageFact],
    ) -> SnapshotWriteResult:
        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO repositories (
                      github_node_id, owner, name, full_name, github_url, homepage_url, description,
                      is_archived, is_fork, created_at_source, updated_at_source, pushed_at_source, default_branch
                    ) VALUES (
                      %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
                    )
                    ON CONFLICT (github_node_id) DO UPDATE SET
                      owner = EXCLUDED.owner,
                      name = EXCLUDED.name,
                      full_name = EXCLUDED.full_name,
                      github_url = EXCLUDED.github_url,
                      homepage_url = EXCLUDED.homepage_url,
                      description = EXCLUDED.description,
                      is_archived = EXCLUDED.is_archived,
                      is_fork = EXCLUDED.is_fork,
                      created_at_source = EXCLUDED.created_at_source,
                      updated_at_source = EXCLUDED.updated_at_source,
                      pushed_at_source = EXCLUDED.pushed_at_source,
                      default_branch = EXCLUDED.default_branch
                    RETURNING id
                    """,
                    (
                        facts.github_node_id, facts.owner, facts.name, facts.full_name, facts.github_url,
                        facts.homepage_url, facts.description, facts.is_archived, facts.is_fork,
                        facts.created_at_source, facts.updated_at_source, facts.pushed_at_source, facts.default_branch,
                    ),
                )
                repository_id = cur.fetchone()[0]

                cur.execute(
                    """
                    INSERT INTO repository_snapshots (
                      repository_id, captured_at, source_api_version, stars, forks, open_issues, watchers,
                      subscribers, disk_size_kb, primary_language, license_spdx, release_count,
                      latest_release_at, contributor_count, payload_hash, raw_payload_json
                    ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (repository_id, payload_hash) DO NOTHING
                    RETURNING id
                    """,
                    (
                        repository_id, facts.captured_at, facts.source_api_version, facts.stars, facts.forks,
                        facts.open_issues, facts.watchers, facts.subscribers, facts.disk_size_kb,
                        facts.primary_language, facts.license_spdx, facts.release_count, facts.latest_release_at,
                        facts.contributor_count, facts.payload_hash, Jsonb(facts.raw_payload),
                    ),
                )
                row = cur.fetchone()
                reused = row is None
                if reused:
                    cur.execute(
                        "SELECT id FROM repository_snapshots WHERE repository_id = %s AND payload_hash = %s",
                        (repository_id, facts.payload_hash),
                    )
                    snapshot_id = cur.fetchone()[0]
                else:
                    snapshot_id = row[0]
                    for language in languages:
                        cur.execute(
                            """
                            INSERT INTO repository_languages (repository_id, snapshot_id, language, bytes, percentage)
                            VALUES (%s,%s,%s,%s,%s)
                            ON CONFLICT (snapshot_id, language) DO NOTHING
                            """,
                            (repository_id, snapshot_id, language.language, language.bytes, language.percentage),
                        )

                cur.execute(
                    "UPDATE repositories SET current_snapshot_id = %s WHERE id = %s",
                    (snapshot_id, repository_id),
                )
            conn.commit()
        return SnapshotWriteResult(repository_id=repository_id, snapshot_id=snapshot_id, reused_snapshot=reused)

    def write_source_document(self, repository_id: UUID, document: SourceDocument) -> bool:
        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO source_documents (
                      repository_id, document_type, source_url, ref, content_hash, text_content
                    ) VALUES (%s,%s,%s,%s,%s,%s)
                    ON CONFLICT (repository_id, document_type, source_url, content_hash) DO NOTHING
                    RETURNING id
                    """,
                    (
                        repository_id, document.document_type, document.source_url, document.ref,
                        document.content_hash, document.text,
                    ),
                )
                inserted = cur.fetchone() is not None
            conn.commit()
        return inserted

    def enqueue_job(self, job_type: str, payload: dict[str, Any], *, priority: int = 100) -> UUID:
        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO ingestion_jobs (job_type, payload_json, priority) VALUES (%s,%s,%s) RETURNING id",
                    (job_type, Jsonb(payload), priority),
                )
                job_id = cur.fetchone()[0]
            conn.commit()
        return job_id
