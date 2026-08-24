from __future__ import annotations

import csv
from pathlib import Path

from thingso_worker.ai_models import UseCaseInference


# Versioned, intentionally small editorial mapping from the already-reviewed curated category
# to jobs-to-be-done. These are decision/discovery labels, not claims that every repository
# implements every possible workflow in the use case.
CATEGORY_USE_CASES: dict[str, tuple[tuple[str, float, str], ...]] = {
    "ai-agent": (
        ("tool-using-ai-agents", 0.92, "The curated agent category and reviewed V3 profile make this a candidate for model-driven tasks that invoke controlled tools or actions."),
        ("multi-step-ai-automation", 0.90, "Agent orchestration primitives are relevant when a task needs multiple model/tool steps rather than a single prompt."),
        ("agent-orchestration", 0.88, "Consider this project when evaluating runtimes or frameworks for coordinating agent state, tools, and execution flow."),
    ),
    "browser-automation": (
        ("browser-task-automation", 0.94, "The curated browser-automation category fits tasks that require programmatic navigation and interaction in a real browser."),
        ("agentic-web-navigation", 0.88, "This category is relevant when an AI or automation system needs a browser execution boundary for web interaction."),
        ("end-to-end-web-testing", 0.76, "Browser-control projects can be candidates for end-to-end web testing; verify testing-specific APIs and assertions in the repository profile."),
    ),
    "workflow-automation": (
        ("multi-step-workflow-automation", 0.94, "The reviewed workflow category directly targets repeatable multi-step execution across tasks or services."),
        ("integration-orchestration", 0.90, "Use this category when coordinating actions across integrations, connectors, or service boundaries."),
        ("scheduled-background-jobs", 0.78, "Workflow runtimes can fit scheduled or background work when their trigger and scheduling model meets the deployment requirements."),
    ),
    "web-scraping": (
        ("web-data-collection", 0.95, "The curated scraping category is a strong fit for repeatable collection of data from authorized web sources."),
        ("crawling-and-content-extraction", 0.93, "Crawler and extraction primitives are relevant for traversing pages and turning page content into structured output."),
        ("public-web-monitoring", 0.80, "This category can support monitoring public web sources when operators respect authorization, terms, and rate limits."),
    ),
    "data-extraction": (
        ("document-and-content-extraction", 0.94, "The reviewed data-extraction category fits pipelines that convert heterogeneous content into structured information."),
        ("data-normalization-pipelines", 0.88, "Extraction and transformation tooling can fit normalization before downstream analytics, search, or automation."),
        ("research-data-preparation", 0.82, "This category is relevant for preparing source material into reusable structured data for research workflows."),
    ),
    "self-hosting": (
        ("private-self-hosted-deployment", 0.95, "The curated self-hosting category directly targets operating an application on infrastructure controlled by the adopter."),
        ("data-control-and-sovereignty", 0.86, "Self-hosted applications are relevant when deployment and data-location control are material decision criteria."),
        ("internal-tools-and-knowledge", 0.80, "A self-hosted application can fit internal-team workflows when its product capabilities match the required job."),
    ),
    "llm-serving": (
        ("local-llm-inference", 0.91, "The reviewed model-serving category is relevant for running inference under local or self-managed compute constraints."),
        ("production-model-serving", 0.90, "Serving runtimes are candidates for exposing model inference to applications; validate model, hardware, batching, and API requirements."),
    ),
    "rag": (
        ("private-knowledge-rag", 0.95, "The curated RAG category directly fits applications that retrieve external or private knowledge for model context."),
        ("semantic-search", 0.90, "Retrieval and indexing components are relevant for semantic discovery over application or organization knowledge."),
        ("document-question-answering", 0.88, "RAG frameworks can support grounded question answering when ingestion and retrieval quality meet the workload needs."),
    ),
    "developer-productivity": (
        ("developer-workflow-automation", 0.90, "The curated developer-productivity category fits tools that reduce friction in development, integration, or local model workflows."),
        ("developer-tool-integration", 0.88, "Use this category when evaluating reusable tooling or clients that integrate capabilities into a developer workflow."),
    ),
    "testing": (
        ("evaluation-and-quality-gates", 0.94, "The reviewed testing category fits repeatable evaluation and quality gates around software or AI behavior."),
        ("regression-testing", 0.90, "Testing frameworks are relevant when teams need repeatable checks that detect behavior changes across versions."),
    ),
    "observability": (
        ("ai-application-observability", 0.92, "The curated observability category fits inspection of AI application behavior, traces, evaluations, or runtime quality signals."),
        ("trace-and-evaluation-analysis", 0.86, "Use this category when teams need visibility into execution traces or evaluation outcomes for diagnosis and improvement."),
    ),
    "image-generation": (
        ("programmatic-image-generation", 0.94, "The reviewed image-generation category fits software-driven generation or transformation of visual assets."),
        ("generative-media-pipelines", 0.86, "Image-generation tooling can be a component in larger automated media-production pipelines."),
    ),
    "video-generation": (
        ("automated-video-production", 0.94, "The curated video-generation category fits workflows that programmatically create, assemble, or transform video output."),
        ("generative-media-pipelines", 0.90, "Video tooling is relevant as a stage in automated generative-media workflows; validate the project's exact generation or editing scope."),
        ("video-postproduction-automation", 0.80, "This category can fit automated post-production tasks when the repository exposes the required editing, subtitle, avatar, or media-processing capabilities."),
    ),
    "content-automation": (
        ("content-production-automation", 0.92, "The curated content-automation category fits repeatable pipelines that assemble or transform content with software-driven stages."),
        ("generative-media-pipelines", 0.86, "Content automation tooling can coordinate or package reusable steps in generative-media production."),
    ),
    "api": (
        ("api-integration-layer", 0.92, "The reviewed API category fits projects whose primary value is exposing, adapting, or bridging a programmatic interface."),
        ("tool-protocol-bridging", 0.80, "API-layer projects can fit protocol or tool bridging when their documented interface matches the target integration."),
    ),
}


def use_cases_for_category(category: str) -> list[UseCaseInference]:
    rows = CATEGORY_USE_CASES.get(category.strip().lower(), ())
    return [UseCaseInference(slug=slug, fit_score=score, reason=reason) for slug, score, reason in rows]


def category_by_repository(seed_path: str | Path) -> dict[str, str]:
    with Path(seed_path).open("r", encoding="utf-8", newline="") as handle:
        rows = csv.DictReader(handle)
        return {
            str(row["full_name"]).strip().lower(): str(row["category"]).strip().lower()
            for row in rows
            if row.get("full_name") and row.get("category")
        }


def attach_curated_use_cases(
    entries: list[dict[str, object]],
    seed_path: str | Path,
) -> list[dict[str, object]]:
    categories = category_by_repository(seed_path)
    for entry in entries:
        full_name = str(entry.get("full_name") or "").strip()
        draft = entry.get("draft")
        category = categories.get(full_name.lower())
        if not full_name or not category or not isinstance(draft, dict):
            raise ValueError(f"Cannot attach curated use cases to malformed entry: {full_name or '<missing>'}")
        draft["use_cases"] = [
            inference.model_dump(mode="json") for inference in use_cases_for_category(category)
        ]
    return entries
