from __future__ import annotations

import socket

from .database import RepositoryStore
from .github_client import GitHubClient
from .jobs import JobQueue
from .pipeline import RepositoryIngestor
from .settings import Settings


class WorkerRunner:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.store = RepositoryStore(settings.database_url)
        self.queue = JobQueue(settings.database_url, worker_id=socket.gethostname())
        self.client = GitHubClient(token=settings.github_token, api_version=settings.github_api_version)
        self.ingestor = RepositoryIngestor(client=self.client, store=self.store)

    def close(self) -> None:
        self.client.close()

    def run_once(self) -> bool:
        job = self.queue.claim_next()
        if not job:
            return False
        try:
            if job.job_type == "ingest_repository":
                full_name = str(job.payload.get("full_name") or "")
                if not full_name:
                    raise ValueError("ingest_repository job missing full_name")
                self.ingestor.ingest(full_name)
            else:
                raise ValueError(f"Unsupported job type: {job.job_type}")
        except Exception as exc:
            self.queue.fail(job, f"{type(exc).__name__}: {exc}")
        else:
            self.queue.succeed(job.id)
        return True
