import base64

import httpx
import pytest

from thingso_worker.exceptions import GitHubRateLimitError
from thingso_worker.github_client import GitHubClient


def test_client_sends_version_and_auth_headers() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["X-GitHub-Api-Version"] == "2022-11-28"
        assert request.headers["Authorization"] == "Bearer secret"
        return httpx.Response(200, json={"full_name": "x/y"})

    transport = httpx.MockTransport(handler)
    client = httpx.Client(base_url="https://api.github.com", transport=transport)
    github = GitHubClient(token="secret", client=client, sleeper=lambda _: None)
    assert github.get_repository("x/y")["full_name"] == "x/y"


def test_readme_is_decoded() -> None:
    encoded = base64.b64encode(b"# hello").decode()

    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"encoding": "base64", "content": encoded, "html_url": "https://github.com/x/y/blob/main/README.md", "sha": "abc"})

    client = httpx.Client(base_url="https://api.github.com", transport=httpx.MockTransport(handler))
    github = GitHubClient(token=None, client=client, sleeper=lambda _: None)
    text, url, ref = github.get_readme("x/y") or (None, None, None)
    assert text == "# hello"
    assert ref == "abc"
    assert url and "README" in url


def test_primary_rate_limit_raises_without_busy_retry() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, headers={"X-RateLimit-Remaining": "0", "Retry-After": "60"}, text="rate limited")

    client = httpx.Client(base_url="https://api.github.com", transport=httpx.MockTransport(handler))
    github = GitHubClient(token=None, client=client, sleeper=lambda _: None)
    with pytest.raises(GitHubRateLimitError) as error:
        github.get_repository("x/y")
    assert error.value.retry_after_seconds == 60
