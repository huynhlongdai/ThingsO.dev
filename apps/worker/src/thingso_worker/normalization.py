from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from .models import LanguageFact, RepositoryFacts, SourceDocument


def canonical_payload_hash(payload: dict[str, Any]) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    return hashlib.sha256(encoded).hexdigest()


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def normalize_repository(payload: dict[str, Any], *, api_version: str) -> RepositoryFacts:
    owner = payload.get("owner") or {}
    license_info = payload.get("license") or {}
    node_id = payload.get("node_id")
    full_name = payload.get("full_name")
    name = payload.get("name")
    owner_login = owner.get("login")
    html_url = payload.get("html_url")

    required = {
        "node_id": node_id,
        "full_name": full_name,
        "name": name,
        "owner.login": owner_login,
        "html_url": html_url,
    }
    missing = [key for key, value in required.items() if not value]
    if missing:
        raise ValueError(f"GitHub repository payload missing required fields: {', '.join(missing)}")

    return RepositoryFacts(
        github_node_id=str(node_id),
        owner=str(owner_login),
        name=str(name),
        full_name=str(full_name),
        github_url=str(html_url),
        homepage_url=payload.get("homepage") or None,
        description=payload.get("description") or None,
        is_archived=bool(payload.get("archived", False)),
        is_fork=bool(payload.get("fork", False)),
        created_at_source=_parse_datetime(payload.get("created_at")),
        updated_at_source=_parse_datetime(payload.get("updated_at")),
        pushed_at_source=_parse_datetime(payload.get("pushed_at")),
        default_branch=payload.get("default_branch") or None,
        source_api_version=api_version,
        captured_at=datetime.now(timezone.utc),
        stars=int(payload.get("stargazers_count") or 0),
        forks=int(payload.get("forks_count") or 0),
        open_issues=int(payload.get("open_issues_count") or 0),
        watchers=int(payload.get("watchers_count") or 0),
        subscribers=(int(payload["subscribers_count"]) if payload.get("subscribers_count") is not None else None),
        disk_size_kb=(int(payload["size"]) if payload.get("size") is not None else None),
        primary_language=payload.get("language") or None,
        license_spdx=license_info.get("spdx_id") or None,
        payload_hash=canonical_payload_hash(payload),
        raw_payload=payload,
    )


def normalize_languages(payload: dict[str, int]) -> list[LanguageFact]:
    total = sum(max(0, int(value)) for value in payload.values())
    if total <= 0:
        return []
    return [
        LanguageFact(language=language, bytes=max(0, int(value)), percentage=(max(0, int(value)) / total) * 100)
        for language, value in sorted(payload.items(), key=lambda item: item[1], reverse=True)
    ]


def make_source_document(*, text: str, source_url: str, ref: str | None, document_type: str = "readme") -> SourceDocument:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return SourceDocument(
        document_type=document_type,
        source_url=source_url,
        ref=ref,
        content_hash=digest,
        text=text,
    )
