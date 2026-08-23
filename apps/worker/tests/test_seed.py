from pathlib import Path

import pytest

from thingso_worker.seed import load_seed


def test_seed_deduplicates_case_insensitively(tmp_path: Path) -> None:
    path = tmp_path / "repos.csv"
    path.write_text("full_name,category,priority\nOwner/Repo,ai-agent,10\nowner/repo,ai-agent,20\n", encoding="utf-8")
    rows = load_seed(path)
    assert len(rows) == 1
    assert rows[0].priority == 10


def test_seed_rejects_invalid_repository(tmp_path: Path) -> None:
    path = tmp_path / "repos.csv"
    path.write_text("full_name,category,priority\nnot-a-repo,ai-agent,10\n", encoding="utf-8")
    with pytest.raises(ValueError):
        load_seed(path)
