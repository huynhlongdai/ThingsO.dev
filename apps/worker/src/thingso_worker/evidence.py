from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID

import psycopg
from psycopg.rows import dict_row

from .ai_security import SanitizedEvidence, sanitize_untrusted_text


@dataclass(frozen=True)
class EvidenceDocument:
    id: UUID
    document_type: str
    source_url: str
    ref: str | None
    content_hash: str
    sanitized: SanitizedEvidence


@dataclass(frozen=True)
class EvidenceBundle:
    repository_id: UUID
    snapshot_id: UUID
    full_name: str
    facts: dict[str, Any]
    documents: tuple[EvidenceDocument, ...]

    @property
    def source_document_ids(self) -> tuple[UUID, ...]:
        return tuple(document.id for document in self.documents)

    @property
    def has_suspicious_source_text(self) -> bool:
        return any(document.sanitized.suspicious for document in self.documents)


class EvidenceBuilder:
    def __init__(self, database_url: str, *, max_source_chars: int = 24000) -> None:
        self.database_url = database_url
        self.max_source_chars = max_source_chars

    def load_by_full_name(self, full_name: str) -> EvidenceBundle:
        with psycopg.connect(self.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                      r.id AS repository_id,
                      r.full_name,
                      r.owner,
                      r.name,
                      r.github_url,
                      r.homepage_url,
                      r.description,
                      r.is_archived,
                      r.is_fork,
                      r.created_at_source,
                      r.updated_at_source,
                      r.pushed_at_source,
                      r.default_branch,
                      s.id AS snapshot_id,
                      s.captured_at,
                      s.source_api_version,
                      s.stars,
                      s.forks,
                      s.open_issues,
                      s.watchers,
                      s.subscribers,
                      s.disk_size_kb,
                      s.primary_language,
                      s.license_spdx,
                      s.release_count,
                      s.latest_release_at,
                      s.contributor_count,
                      s.payload_hash
                    FROM repositories r
                    JOIN repository_snapshots s ON s.id = r.current_snapshot_id
                    WHERE lower(r.full_name) = lower(%s)
                    """,
                    (full_name,),
                )
                row = cur.fetchone()
                if not row:
                    raise LookupError(f"Repository has no current snapshot: {full_name}")

                repository_id = row["repository_id"]
                snapshot_id = row["snapshot_id"]
                facts = {key: value for key, value in row.items() if key not in {"repository_id", "snapshot_id"}}

                cur.execute(
                    """
                    SELECT DISTINCT ON (document_type, source_url)
                      id, document_type, source_url, ref, content_hash, text_content
                    FROM source_documents
                    WHERE repository_id = %s
                    ORDER BY document_type, source_url, fetched_at DESC
                    """,
                    (repository_id,),
                )
                document_rows = cur.fetchall()

        documents = tuple(
            EvidenceDocument(
                id=document["id"],
                document_type=document["document_type"],
                source_url=document["source_url"],
                ref=document["ref"],
                content_hash=document["content_hash"],
                sanitized=sanitize_untrusted_text(
                    document["text_content"],
                    max_chars=self.max_source_chars,
                ),
            )
            for document in document_rows
        )
        return EvidenceBundle(
            repository_id=repository_id,
            snapshot_id=snapshot_id,
            full_name=row["full_name"],
            facts=facts,
            documents=documents,
        )
