from __future__ import annotations

from .database import RepositoryStore
from .evidence_pack import collect_evidence_pack
from .github_client import GitHubClient
from .models import IngestResult
from .normalization import make_source_document, normalize_languages, normalize_repository


class RepositoryIngestor:
    def __init__(self, *, client: GitHubClient, store: RepositoryStore) -> None:
        self.client = client
        self.store = store

    def ingest(self, full_name: str) -> IngestResult:
        raw_repository = self.client.get_repository(full_name)
        raw_languages = self.client.get_languages(full_name)
        facts = normalize_repository(raw_repository, api_version=self.client.api_version)
        languages = normalize_languages(raw_languages)
        write = self.store.write_repository_snapshot(facts, languages)

        document_written = False
        readme = self.client.get_readme(full_name)
        if readme:
            text, source_url, ref = readme
            document = make_source_document(text=text, source_url=source_url, ref=ref)
            document_written = self.store.write_source_document(write.repository_id, document)

        default_branch = facts.default_branch or "main"
        for document in collect_evidence_pack(
            self.client,
            full_name,
            default_branch=default_branch,
        ):
            inserted = self.store.write_source_document(write.repository_id, document)
            document_written = inserted or document_written

        return IngestResult(
            full_name=full_name,
            repository_id=str(write.repository_id),
            snapshot_id=str(write.snapshot_id),
            source_document_written=document_written,
            reused_snapshot=write.reused_snapshot,
        )
