from __future__ import annotations

import socket

from .ai_store import AIStore
from .database import RepositoryStore
from .enrichment import RepositoryEnricher
from .evidence import EvidenceBuilder
from .github_client import GitHubClient
from .jobs import JobQueue
from .llm_client import OpenAICompatibleClient
from .pipeline import RepositoryIngestor
from .scoring import HealthScoreStore
from .settings import Settings


class WorkerRunner:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.store = RepositoryStore(settings.database_url)
        self.queue = JobQueue(settings.database_url, worker_id=socket.gethostname())
        self.client = GitHubClient(token=settings.github_token, api_version=settings.github_api_version)
        self.ingestor = RepositoryIngestor(client=self.client, store=self.store)
        self.score_store = HealthScoreStore(settings.database_url)
        self._ai_client: OpenAICompatibleClient | None = None
        self._enricher: RepositoryEnricher | None = None

    def close(self) -> None:
        self.client.close()
        if self._ai_client:
            self._ai_client.close()

    def _get_enricher(self) -> RepositoryEnricher:
        if self._enricher:
            return self._enricher
        if not self.settings.ai_api_key:
            raise ValueError("AI_API_KEY is required for enrichment jobs")
        if not self.settings.ai_model_enrich:
            raise ValueError("AI_MODEL_ENRICH is required for enrichment jobs")

        review_model = self.settings.ai_model_review or self.settings.ai_model_enrich
        self._ai_client = OpenAICompatibleClient(
            api_key=self.settings.ai_api_key,
            base_url=self.settings.ai_base_url,
            provider=self.settings.ai_provider,
            timeout_seconds=self.settings.ai_timeout_seconds,
        )
        self._enricher = RepositoryEnricher(
            evidence_builder=EvidenceBuilder(
                self.settings.database_url,
                max_source_chars=self.settings.ai_max_source_chars,
            ),
            store=AIStore(self.settings.database_url),
            client=self._ai_client,
            analysis_model=self.settings.ai_model_enrich,
            review_model=review_model,
        )
        return self._enricher

    def run_once(self) -> bool:
        job = self.queue.claim_next()
        if not job:
            return False
        try:
            full_name = str(job.payload.get("full_name") or "")
            if not full_name:
                raise ValueError(f"{job.job_type} job missing full_name")

            if job.job_type == "ingest_repository":
                self.ingestor.ingest(full_name)
                self.score_store.calculate_and_persist(full_name)
            elif job.job_type == "score_repository":
                self.score_store.calculate_and_persist(full_name)
            elif job.job_type == "enrich_repository":
                self._get_enricher().enrich(full_name)
            else:
                raise ValueError(f"Unsupported job type: {job.job_type}")
        except Exception as exc:
            self.queue.fail(job, f"{type(exc).__name__}: {exc}")
        else:
            self.queue.succeed(job.id)
        return True
