from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, Field


class LanguageFact(BaseModel):
    language: str
    bytes: int = Field(ge=0)
    percentage: float = Field(ge=0, le=100)


class RepositoryFacts(BaseModel):
    github_node_id: str
    owner: str
    name: str
    full_name: str
    github_url: str
    homepage_url: str | None = None
    description: str | None = None
    is_archived: bool = False
    is_fork: bool = False
    created_at_source: datetime | None = None
    updated_at_source: datetime | None = None
    pushed_at_source: datetime | None = None
    default_branch: str | None = None

    source_api_version: str
    captured_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    stars: int = Field(default=0, ge=0)
    forks: int = Field(default=0, ge=0)
    open_issues: int = Field(default=0, ge=0)
    watchers: int = Field(default=0, ge=0)
    subscribers: int | None = Field(default=None, ge=0)
    disk_size_kb: int | None = Field(default=None, ge=0)
    primary_language: str | None = None
    license_spdx: str | None = None
    release_count: int | None = Field(default=None, ge=0)
    latest_release_at: datetime | None = None
    contributor_count: int | None = Field(default=None, ge=0)
    payload_hash: str
    raw_payload: dict[str, Any]


class SourceDocument(BaseModel):
    document_type: str
    source_url: str
    ref: str | None = None
    content_hash: str
    text: str


class IngestResult(BaseModel):
    full_name: str
    repository_id: str
    snapshot_id: str
    source_document_written: bool
    reused_snapshot: bool
