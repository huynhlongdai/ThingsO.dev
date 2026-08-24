from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import psycopg


@dataclass(frozen=True)
class TaxonomySeedResult:
    inserted_or_updated: int


def _label(slug: str) -> str:
    return " ".join(part.capitalize() for part in slug.split("-") if part)


def seed_taxonomy(database_url: str, path: str | Path) -> TaxonomySeedResult:
    payload = json.loads(Path(path).read_text(encoding="utf-8"))
    axes = payload.get("axes") or {}
    count = 0
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            for axis, values in axes.items():
                if not isinstance(values, list):
                    continue
                for raw_slug in values:
                    slug = str(raw_slug).strip().lower()
                    if not slug:
                        continue
                    cur.execute(
                        """
                        INSERT INTO taxonomy_terms (axis, slug, label, status)
                        VALUES (%s,%s,%s,'active')
                        ON CONFLICT (axis, slug) DO UPDATE SET
                          label = EXCLUDED.label,
                          status = 'active'
                        """,
                        (str(axis), slug, _label(slug)),
                    )
                    count += 1
        conn.commit()
    return TaxonomySeedResult(inserted_or_updated=count)


def assign_editorial_capability(database_url: str, full_name: str, slug: str) -> bool:
    normalized = slug.strip().lower()
    if not normalized:
        return False
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO repository_taxonomy (repository_id, term_id, source_type, confidence)
                SELECT r.id, t.id, 'editorial', 1.0
                FROM repositories r
                JOIN taxonomy_terms t ON t.axis = 'capability' AND t.slug = %s AND t.status = 'active'
                WHERE lower(r.full_name) = lower(%s)
                ON CONFLICT (repository_id, term_id, source_type) DO UPDATE SET
                  confidence = 1.0,
                  analysis_id = NULL
                RETURNING repository_id
                """,
                (normalized, full_name),
            )
            assigned = cur.fetchone() is not None
        conn.commit()
    return assigned
