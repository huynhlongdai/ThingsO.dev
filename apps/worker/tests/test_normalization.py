from thingso_worker.normalization import (
    canonical_payload_hash,
    make_source_document,
    normalize_languages,
    normalize_repository,
)


def repository_fixture() -> dict:
    return {
        "node_id": "R_test",
        "name": "demo",
        "full_name": "thingso/demo",
        "html_url": "https://github.com/thingso/demo",
        "homepage": "https://demo.example",
        "description": "Demo repository",
        "archived": False,
        "fork": False,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2026-08-20T00:00:00Z",
        "pushed_at": "2026-08-19T00:00:00Z",
        "default_branch": "main",
        "stargazers_count": 123,
        "forks_count": 12,
        "open_issues_count": 3,
        "watchers_count": 123,
        "subscribers_count": 9,
        "size": 456,
        "language": "Python",
        "license": {"spdx_id": "MIT"},
        "owner": {"login": "thingso"},
    }


def test_payload_hash_is_order_independent() -> None:
    assert canonical_payload_hash({"a": 1, "b": 2}) == canonical_payload_hash({"b": 2, "a": 1})


def test_repository_normalization() -> None:
    facts = normalize_repository(repository_fixture(), api_version="2022-11-28")
    assert facts.full_name == "thingso/demo"
    assert facts.stars == 123
    assert facts.license_spdx == "MIT"
    assert len(facts.payload_hash) == 64


def test_language_percentages_sum_to_100() -> None:
    rows = normalize_languages({"Python": 75, "JavaScript": 25})
    assert round(sum(row.percentage for row in rows), 6) == 100
    assert rows[0].language == "Python"


def test_source_document_strips_nul_before_hash_and_persistence() -> None:
    document = make_source_document(
        text="prefix\x00suffix",
        source_url="https://github.com/thingso/demo/blob/main/example.txt",
        ref="main",
        document_type="documentation",
    )
    expected = make_source_document(
        text="prefixsuffix",
        source_url="https://github.com/thingso/demo/blob/main/example.txt",
        ref="main",
        document_type="documentation",
    )

    assert document.text == "prefixsuffix"
    assert "\x00" not in document.text
    assert document.content_hash == expected.content_hash
