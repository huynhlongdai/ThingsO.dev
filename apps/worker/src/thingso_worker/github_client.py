from __future__ import annotations

import base64
import time
from collections.abc import Callable
from typing import Any

import httpx

from .exceptions import GitHubAPIError, GitHubRateLimitError


class GitHubClient:
    def __init__(
        self,
        *,
        token: str | None,
        api_version: str = "2022-11-28",
        timeout_seconds: float = 20.0,
        max_retries: int = 3,
        client: httpx.Client | None = None,
        sleeper: Callable[[float], None] = time.sleep,
    ) -> None:
        self.api_version = api_version
        self.max_retries = max_retries
        self._sleeper = sleeper
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": api_version,
            "User-Agent": "ThingsO.dev-worker/0.1",
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"
        self._client = client or httpx.Client(
            base_url="https://api.github.com",
            headers=headers,
            timeout=httpx.Timeout(timeout_seconds),
            follow_redirects=True,
        )
        if client is not None:
            self._client.headers.update(headers)

    def close(self) -> None:
        self._client.close()

    def __enter__(self) -> "GitHubClient":
        return self

    def __exit__(self, *_: object) -> None:
        self.close()

    @staticmethod
    def _retry_after(response: httpx.Response) -> int | None:
        retry_header = response.headers.get("Retry-After")
        if retry_header and retry_header.isdigit():
            return max(1, int(retry_header))
        reset = response.headers.get("X-RateLimit-Reset")
        if reset and reset.isdigit():
            return max(1, int(reset) - int(time.time()))
        return None

    def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Response:
        last_error: Exception | None = None
        for attempt in range(self.max_retries + 1):
            try:
                response = self._client.request(method, path, **kwargs)
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                last_error = exc
                if attempt >= self.max_retries:
                    raise GitHubAPIError(f"GitHub network request failed: {exc}") from exc
                self._sleeper(min(2**attempt, 8))
                continue

            if response.status_code in (403, 429):
                remaining = response.headers.get("X-RateLimit-Remaining")
                retry_after = self._retry_after(response)
                message = "GitHub API rate limit or abuse protection triggered"
                if remaining == "0" or retry_after is not None:
                    raise GitHubRateLimitError(message, retry_after_seconds=retry_after)

            if response.status_code >= 500:
                if attempt < self.max_retries:
                    self._sleeper(min(2**attempt, 8))
                    continue

            if response.is_error:
                detail = response.text[:500]
                raise GitHubAPIError(
                    f"GitHub API {response.status_code} for {path}: {detail}",
                    status_code=response.status_code,
                )
            return response

        raise GitHubAPIError(f"GitHub request failed: {last_error}")

    def get_repository(self, full_name: str) -> dict[str, Any]:
        return self._request("GET", f"/repos/{full_name}").json()

    def get_languages(self, full_name: str) -> dict[str, int]:
        payload = self._request("GET", f"/repos/{full_name}/languages").json()
        return {str(key): int(value) for key, value in payload.items()}

    def get_readme(self, full_name: str) -> tuple[str, str, str | None] | None:
        response = self._client.request("GET", f"/repos/{full_name}/readme")
        if response.status_code == 404:
            return None
        if response.is_error:
            response = self._request("GET", f"/repos/{full_name}/readme")
        payload = response.json()
        encoded = payload.get("content") or ""
        if payload.get("encoding") != "base64" or not encoded:
            return None
        text = base64.b64decode(encoded).decode("utf-8", errors="replace")
        return text, str(payload.get("html_url") or payload.get("download_url") or ""), payload.get("sha")
