from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

from .evidence import EvidenceBuilder
from .intelligence_draft import EditorialComponent, EditorialIntelligenceDraftV3


@dataclass(frozen=True)
class CategoryTemplate:
    product_type: str
    primary_role: str
    problem: str
    solution: str
    users: tuple[str, ...]
    jobs: tuple[str, ...]
    best_for: tuple[str, ...]
    poor_fit: tuple[str, ...]
    capabilities: tuple[str, ...]
    limitations: tuple[str, ...]
    architecture_style: str
    execution_model: str
    components: tuple[tuple[str, str], ...]
    data_flow: tuple[str, ...]
    extension_model: str
    tradeoffs: tuple[str, ...]
    deployment_modes: tuple[str, ...]
    interfaces: tuple[str, ...]


TEMPLATES: dict[str, CategoryTemplate] = {
    "ai-agent": CategoryTemplate(
        product_type="AI agent framework or agent application",
        primary_role="Coordinate model reasoning, tools, memory, and multi-step task execution.",
        problem="Building useful AI agents requires more than a model call: applications need tool execution, state, control flow, retries, context, and boundaries around autonomous actions.",
        solution="Provide reusable agent abstractions and runtime patterns that connect models with tools, state, orchestration, and application-specific execution logic.",
        users=("AI application developers", "agent platform teams", "automation engineers"),
        jobs=("build tool-using agents", "orchestrate multi-step model workflows", "integrate models with application actions"),
        best_for=("teams building agentic product features", "developers needing reusable orchestration primitives"),
        poor_fit=("simple single-prompt features", "workloads that do not need model-driven control flow"),
        capabilities=("model-driven task execution", "tool or action integration", "multi-step workflow orchestration"),
        limitations=("agent reliability depends on models and tools", "autonomous actions require explicit safety and permission boundaries"),
        architecture_style="Agent runtime organized around model calls, tools/actions, state, and orchestration components.",
        execution_model="A request or task enters an agent loop/workflow where model decisions select actions until a result or stopping condition is reached.",
        components=(("Agent runtime", "Coordinates the task lifecycle and model/tool loop."), ("Model adapter", "Connects the runtime to one or more language-model providers."), ("Tool layer", "Exposes controlled application or external actions to the agent.")),
        data_flow=("Task/context enters the agent runtime and is prepared for model reasoning.", "Model output drives tool calls or intermediate steps, and results are folded back into the task context."),
        extension_model="Extend through tools, model/provider adapters, agent definitions, memory/state components, or workflow hooks exposed by the project.",
        tradeoffs=("More autonomy increases operational and safety complexity.", "Framework abstractions can simplify orchestration while constraining low-level control."),
        deployment_modes=("library", "service or application runtime"),
        interfaces=("programmatic API", "agent/tool interfaces"),
    ),
    "browser-automation": CategoryTemplate(
        product_type="Browser automation framework, runtime, or agent interface",
        primary_role="Control web browsers programmatically for testing, extraction, or agent-driven interaction.",
        problem="Automating websites requires reliable browser control across navigation, dynamic pages, authentication state, DOM changes, and asynchronous interactions.",
        solution="Expose browser sessions and page actions through programmatic or agent-friendly APIs while handling navigation, element interaction, and browser lifecycle concerns.",
        users=("automation engineers", "AI agent developers", "test engineers", "data collection teams"),
        jobs=("automate browser interactions", "run browser-based tests", "let agents operate websites"),
        best_for=("tasks that require a real browser", "dynamic web applications and authenticated workflows"),
        poor_fit=("static HTTP-only extraction", "workloads where a direct API is available and preferable"),
        capabilities=("browser lifecycle control", "page navigation and interaction", "automation of dynamic web workflows"),
        limitations=("website changes can break selectors or behavior", "browser execution consumes more resources than direct HTTP requests"),
        architecture_style="Browser controller or automation runtime layered over a browser protocol, driver, extension, or managed browser session.",
        execution_model="Commands or agent actions are translated into browser operations and executed against one or more browser pages/sessions.",
        components=(("Browser controller", "Owns browser/session lifecycle and command dispatch."), ("Page interaction layer", "Implements navigation, selectors, input, and page actions."), ("Automation interface", "Exposes APIs, commands, or agent tools to callers.")),
        data_flow=("Caller sends an automation intent or command to the browser interface.", "The controller executes page operations and returns page state, extracted data, or action results."),
        extension_model="Extend with new browser actions, adapters, selectors, agent tools, hooks, or protocol integrations supported by the project.",
        tradeoffs=("Real-browser fidelity costs CPU and memory.", "Stealth and resilience features can add maintenance complexity."),
        deployment_modes=("library", "CLI", "browser service"),
        interfaces=("programmatic API", "browser automation commands"),
    ),
    "workflow-automation": CategoryTemplate(
        product_type="Workflow automation or orchestration platform",
        primary_role="Define, schedule, and execute multi-step workflows across tasks, services, or integrations.",
        problem="Business and engineering automation spans many systems and requires dependable sequencing, state, retries, scheduling, and visibility into failures.",
        solution="Represent work as workflows or graphs and provide an execution engine with connectors, scheduling, state, and operational controls.",
        users=("automation teams", "platform engineers", "developers", "operations teams"),
        jobs=("automate multi-step processes", "orchestrate integrations", "schedule and monitor repeatable workflows"),
        best_for=("repeatable multi-system processes", "teams needing visible orchestration and retries"),
        poor_fit=("single trivial scripts", "ultra-low-latency request paths better served by direct application code"),
        capabilities=("workflow definition", "task orchestration", "scheduling or event-driven execution"),
        limitations=("complex workflows can become difficult to debug", "connector and state management add operational overhead"),
        architecture_style="Workflow definition layer backed by an execution/orchestration engine and integration or task adapters.",
        execution_model="A trigger starts a workflow; the engine evaluates steps/dependencies, executes tasks, persists progress where required, and handles completion or failure.",
        components=(("Workflow model", "Represents steps, dependencies, and execution configuration."), ("Execution engine", "Runs workflow tasks and coordinates state/retries."), ("Integration layer", "Connects workflows to external systems or task runtimes.")),
        data_flow=("A trigger and input create a workflow execution.", "Data and state move through ordered or graph-connected steps until the run completes or fails."),
        extension_model="Extend through connectors, workflow nodes/tasks, triggers, executors, plugins, or custom code hooks.",
        tradeoffs=("Durable orchestration improves reliability but adds state and infrastructure.", "Visual/no-code abstractions can trade flexibility for accessibility."),
        deployment_modes=("self-hosted service", "managed service", "library or worker runtime"),
        interfaces=("workflow UI or DSL", "API", "connectors"),
    ),
    "web-scraping": CategoryTemplate(
        product_type="Web crawling and scraping framework",
        primary_role="Discover web pages and extract data from sites at repeatable scale.",
        problem="Reliable web collection requires crawling, request management, parsing, retries, throttling, and adaptation to diverse page structures.",
        solution="Provide crawler/scraper primitives for fetching pages, scheduling requests, extracting structured data, and controlling crawl behavior.",
        users=("data engineers", "research teams", "automation developers"),
        jobs=("crawl websites", "extract structured web data", "build repeatable collection pipelines"),
        best_for=("multi-page collection", "repeatable extraction pipelines"),
        poor_fit=("sources with an official API that fully meets the requirement", "unauthorized or policy-prohibited collection"),
        capabilities=("web crawling", "content extraction", "request scheduling and retry control"),
        limitations=("site changes can break extraction", "operators must respect authorization, terms, and rate limits"),
        architecture_style="Crawler engine with request scheduling, fetch/browser adapters, parsing/extraction logic, and output pipelines.",
        execution_model="Seed requests enter a scheduler, pages are fetched, parsers extract items and additional links, and outputs flow to downstream storage or processing.",
        components=(("Scheduler", "Coordinates crawl requests, priorities, and retries."), ("Fetcher", "Retrieves page content through HTTP or browser execution."), ("Extractor", "Transforms page content into structured records or follow-up links.")),
        data_flow=("Seeds or URLs are scheduled for retrieval.", "Fetched content is parsed into data and/or new requests, then emitted to a pipeline or consumer."),
        extension_model="Extend with spiders/crawlers, request middleware, parsers, extraction rules, pipelines, or browser adapters.",
        tradeoffs=("More resilient crawling requires more runtime complexity.", "Browser-backed scraping improves dynamic-page coverage at higher resource cost."),
        deployment_modes=("library", "worker service", "CLI"),
        interfaces=("programmatic API", "crawler/spider definitions"),
    ),
    "data-extraction": CategoryTemplate(
        product_type="Data extraction or transformation toolkit",
        primary_role="Convert unstructured or heterogeneous source content into usable structured data.",
        problem="Raw documents, pages, media, or source systems contain useful information in formats that are difficult to query or reuse directly.",
        solution="Apply parsing, extraction, normalization, or transformation pipelines to produce structured output suitable for downstream applications.",
        users=("data engineers", "researchers", "application developers"),
        jobs=("extract structured records", "normalize source content", "prepare data for downstream processing"),
        best_for=("turning heterogeneous sources into structured data", "building reusable extraction pipelines"),
        poor_fit=("sources already available in a clean structured API", "tasks that require full workflow orchestration rather than extraction"),
        capabilities=("content parsing", "structured extraction", "data normalization or transformation"),
        limitations=("extraction quality depends on source structure", "format changes can require parser updates"),
        architecture_style="Input adapters feed parsing/extraction stages that normalize content into structured outputs.",
        execution_model="Source content is loaded, parsed or analyzed, transformed into structured records, and returned or emitted downstream.",
        components=(("Input layer", "Loads source content or records."), ("Extraction engine", "Identifies and parses the target information."), ("Output layer", "Normalizes and returns structured results.")),
        data_flow=("Source content enters an input/parser boundary.", "Extraction stages produce normalized records for a caller, file, database, or downstream pipeline."),
        extension_model="Extend through source adapters, parsers, extractors, schemas, post-processing hooks, or output adapters.",
        tradeoffs=("Generic extraction improves reuse but may sacrifice source-specific precision.", "Higher accuracy often requires more source-specific rules or models."),
        deployment_modes=("library", "CLI", "service"),
        interfaces=("programmatic API", "command line or pipeline interface"),
    ),
    "self-hosting": CategoryTemplate(
        product_type="Self-hosted application or platform",
        primary_role="Deliver an application users can operate on infrastructure they control.",
        problem="Teams may need control over data, deployment, customization, cost, or integrations that hosted-only products do not provide.",
        solution="Package a complete application with documented configuration and deployment paths for operation on user-controlled infrastructure.",
        users=("self-hosters", "small technical teams", "platform or IT teams"),
        jobs=("run the application privately", "control deployment and data location", "customize an open-source application"),
        best_for=("teams valuing control and customization", "deployments with data-location or integration requirements"),
        poor_fit=("users unwilling to operate infrastructure", "teams that prefer a fully managed SaaS experience"),
        capabilities=("self-hosted application runtime", "configurable deployment", "local or private data control"),
        limitations=("operators own upgrades and availability", "production hardening varies by deployment"),
        architecture_style="Application services packaged for user-operated deployment with configuration, persistence, and external integration boundaries.",
        execution_model="Long-running application services receive user/API requests and coordinate application logic, persistence, and configured integrations.",
        components=(("Application service", "Provides the primary product behavior and user/API surface."), ("Persistence layer", "Stores durable application state where required."), ("Integration/configuration layer", "Connects external services and deployment-specific settings.")),
        data_flow=("User or API requests enter the application service.", "Application logic reads/writes configured state and invokes external integrations before returning results."),
        extension_model="Extend through configuration, plugins/integrations, application APIs, themes, or project-specific extension points.",
        tradeoffs=("Control and privacy transfer operational responsibility to the deployer.", "Customization can make upgrades more complex."),
        deployment_modes=("self-hosted service", "container deployment"),
        interfaces=("web UI", "API"),
    ),
    "llm-serving": CategoryTemplate(
        product_type="LLM inference runtime, serving layer, or model client",
        primary_role="Run or expose language/model inference efficiently to applications.",
        problem="Applications need dependable model loading, inference, batching, hardware utilization, and stable APIs without embedding low-level serving logic everywhere.",
        solution="Provide a runtime or client/serving layer that manages model execution and exposes predictable interfaces for inference workloads.",
        users=("ML engineers", "AI platform teams", "AI application developers"),
        jobs=("serve language models", "run local inference", "integrate applications with model runtimes"),
        best_for=("teams operating or consuming model inference", "applications needing a reusable model-serving boundary"),
        poor_fit=("teams that only consume a managed provider and need no runtime abstraction", "non-ML workloads"),
        capabilities=("model inference", "runtime or serving API", "model loading and execution management"),
        limitations=("performance depends on model and hardware", "serving large models can require substantial memory and accelerator capacity"),
        architecture_style="Model runtime or client layer around model loading, execution, request handling, and optional scheduling/batching.",
        execution_model="Inference requests enter an API/client boundary, are prepared and scheduled for model execution, then generated outputs are returned or streamed.",
        components=(("Serving/API layer", "Accepts inference requests and exposes a stable caller interface."), ("Runtime", "Loads and executes models on available compute."), ("Scheduler/adapter", "Coordinates requests, batching, model formats, or backend integrations.")),
        data_flow=("Application input enters the model-serving boundary.", "The runtime executes inference and returns generated outputs, optionally as a stream."),
        extension_model="Extend through model backends, hardware kernels, API adapters, model formats, clients, or serving plugins.",
        tradeoffs=("Optimization can improve throughput while increasing backend complexity.", "Local serving improves control but transfers hardware and operations responsibility to the deployer."),
        deployment_modes=("local runtime", "inference service", "client library"),
        interfaces=("API", "programmatic client", "CLI"),
    ),
    "rag": CategoryTemplate(
        product_type="RAG, knowledge, memory, or semantic retrieval framework",
        primary_role="Connect application or model reasoning with external knowledge through ingestion, indexing, retrieval, and context assembly.",
        problem="Language models do not inherently contain current private knowledge and need reliable retrieval, indexing, and context pipelines to answer from external sources.",
        solution="Provide document/data ingestion, representation, retrieval, and orchestration components that deliver relevant context to applications or models.",
        users=("AI application developers", "knowledge platform teams", "data and ML engineers"),
        jobs=("build retrieval-augmented applications", "index private knowledge", "retrieve relevant context for model workflows"),
        best_for=("applications grounded in external or private knowledge", "teams needing reusable ingestion and retrieval components"),
        poor_fit=("tasks with no external knowledge requirement", "simple exact database queries better served directly"),
        capabilities=("data ingestion", "indexing or memory representation", "semantic retrieval and context assembly"),
        limitations=("answer quality depends on ingestion and retrieval quality", "indexing and storage introduce additional state and operations"),
        architecture_style="Ingestion/indexing pipeline plus retrieval and application/model integration layers.",
        execution_model="Sources are ingested and indexed; a query is transformed into retrieval operations and relevant context is passed to an application or model.",
        components=(("Ingestion layer", "Loads and transforms source knowledge."), ("Index/retrieval layer", "Stores representations and retrieves relevant context."), ("Application/model layer", "Uses retrieved context in downstream reasoning or responses.")),
        data_flow=("Documents or records are processed into an index or memory store.", "Queries retrieve relevant context that is assembled for downstream model or application logic."),
        extension_model="Extend through loaders, parsers, embeddings, stores, retrievers, rerankers, memory components, or application adapters.",
        tradeoffs=("Flexible pipelines increase tuning surface area.", "Better retrieval can require additional infrastructure and evaluation."),
        deployment_modes=("library", "service"),
        interfaces=("programmatic API", "retrieval/indexing interfaces"),
    ),
    "developer-productivity": CategoryTemplate(
        product_type="Developer productivity tool, SDK, or coding assistant",
        primary_role="Reduce engineering effort by improving development, coding, integration, or tooling workflows.",
        problem="Developers lose time to repetitive implementation, integration, environment, and tooling work that can be standardized or assisted.",
        solution="Provide developer-facing APIs, tooling, automation, or assistance that makes common engineering workflows faster and more consistent.",
        users=("software developers", "platform engineers", "developer-tool teams"),
        jobs=("accelerate implementation", "integrate a capability into applications", "standardize developer workflows"),
        best_for=("teams seeking reusable developer tooling", "projects that benefit from programmatic integration"),
        poor_fit=("non-technical end users", "teams needing a fully managed end-user product rather than developer tooling"),
        capabilities=("developer-facing tooling", "reusable programmatic integration", "workflow acceleration"),
        limitations=("value depends on adoption in existing engineering workflows", "SDK/tool compatibility can track upstream runtime changes"),
        architecture_style="Developer-facing library, CLI, or service adapter around a reusable capability.",
        execution_model="Developers invoke the tool through code, CLI, or editor workflow; it performs the target operation and returns artifacts or results.",
        components=(("Developer interface", "Exposes the primary SDK, CLI, or tool surface."), ("Core capability", "Implements the reusable developer-facing behavior."), ("Integration layer", "Connects runtimes, services, or application environments.")),
        data_flow=("Developer input enters through the SDK/CLI/tool interface.", "The core capability processes the request and returns code, artifacts, state changes, or service results."),
        extension_model="Extend through APIs, adapters, plugins, commands, provider integrations, or project-specific hooks.",
        tradeoffs=("Abstractions speed common cases but can hide lower-level controls.", "Tooling must evolve with supported runtimes and integrations."),
        deployment_modes=("library", "CLI", "developer service"),
        interfaces=("SDK", "CLI", "programmatic API"),
    ),
    "testing": CategoryTemplate(
        product_type="Testing or evaluation framework",
        primary_role="Define, execute, and evaluate repeatable tests for software, browser workflows, models, or AI systems.",
        problem="Teams need repeatable evidence that behavior remains correct as code, models, prompts, browsers, or dependencies change.",
        solution="Provide test/evaluation definitions, runners, assertions or metrics, and reporting hooks for automated quality checks.",
        users=("software engineers", "QA engineers", "ML/AI evaluation teams"),
        jobs=("automate quality checks", "run regression tests", "evaluate system behavior consistently"),
        best_for=("repeatable regression and evaluation workflows", "teams integrating quality gates into CI"),
        poor_fit=("one-off exploratory checks", "workloads where target behavior cannot be measured meaningfully"),
        capabilities=("test or evaluation execution", "assertions or metrics", "automation-friendly quality checks"),
        limitations=("test quality depends on representative cases and metrics", "external systems can introduce nondeterminism"),
        architecture_style="Test/evaluation definitions feed a runner that executes targets and produces assertions, metrics, or reports.",
        execution_model="A test suite or evaluation set is loaded, target behavior is executed, and results are compared against assertions or scoring criteria.",
        components=(("Test definitions", "Describe cases, inputs, assertions, or evaluation criteria."), ("Runner", "Executes cases against the system under test."), ("Reporting layer", "Aggregates failures, metrics, and results for users or CI.")),
        data_flow=("Test cases and configuration enter the runner.", "Target outputs are collected, evaluated, and emitted as pass/fail results or metrics."),
        extension_model="Extend through custom assertions, metrics, test adapters, fixtures, reporters, environments, or evaluation datasets.",
        tradeoffs=("More realistic tests are often slower and less deterministic.", "Metric-driven evaluation can miss qualities not represented in the test set."),
        deployment_modes=("library", "CLI", "CI job"),
        interfaces=("test API", "CLI", "CI integration"),
    ),
    "observability": CategoryTemplate(
        product_type="Observability, tracing, or evaluation platform",
        primary_role="Make application, agent, or model behavior measurable and diagnosable in development and production.",
        problem="Complex AI and distributed workflows are difficult to debug without traces, structured events, metrics, evaluations, and visibility into failures.",
        solution="Capture execution telemetry and expose analysis/evaluation surfaces for understanding quality, latency, cost, errors, and behavior.",
        users=("AI platform teams", "SRE/operations teams", "application developers"),
        jobs=("trace complex executions", "evaluate runtime quality", "diagnose failures and regressions"),
        best_for=("systems with opaque multi-step behavior", "teams needing production quality feedback loops"),
        poor_fit=("very small systems with sufficient native logs", "teams unable to instrument the target workload"),
        capabilities=("telemetry collection", "trace or event analysis", "quality and operational evaluation"),
        limitations=("instrumentation adds integration work and data volume", "telemetry may contain sensitive application data"),
        architecture_style="Instrumentation/collector layer sends telemetry to storage and analysis or evaluation surfaces.",
        execution_model="Instrumented applications emit traces/events/metrics that are collected, processed, stored, and queried or evaluated.",
        components=(("Instrumentation", "Captures execution context, traces, events, or metrics."), ("Collector/storage", "Receives and persists observability data."), ("Analysis surface", "Queries, visualizes, or evaluates captured behavior.")),
        data_flow=("Runtime telemetry is emitted by instrumented systems.", "Collectors process and store telemetry for analysis, dashboards, evaluation, or alerts."),
        extension_model="Extend through instrumentation SDKs, exporters, evaluators, dashboards, integrations, or custom metrics.",
        tradeoffs=("Deeper visibility increases telemetry volume and privacy considerations.", "Evaluation quality depends on useful metrics and representative traces."),
        deployment_modes=("service", "self-hosted platform", "SDK"),
        interfaces=("instrumentation SDK", "API", "dashboard"),
    ),
    "image-generation": CategoryTemplate(
        product_type="Image generation or generative media framework",
        primary_role="Generate or transform images through models and programmable media pipelines.",
        problem="Generative image applications need model orchestration, preprocessing/postprocessing, reproducible parameters, and integration with application or batch workflows.",
        solution="Provide model pipelines and developer interfaces for image synthesis, editing, transformation, or related generative-media tasks.",
        users=("creative developers", "ML engineers", "content automation teams"),
        jobs=("generate images programmatically", "build image-generation workflows", "integrate generative media into products"),
        best_for=("programmable visual generation", "creative automation and experimentation"),
        poor_fit=("teams needing only manual design tools", "deployments without suitable model compute for local generation"),
        capabilities=("image synthesis or transformation", "model pipeline execution", "programmable generative-media workflows"),
        limitations=("quality and speed depend on models and hardware", "generated content requires product-specific safety and rights review"),
        architecture_style="Media input/configuration layer drives model pipelines followed by image decoding, processing, and output handling.",
        execution_model="Prompts or media inputs are prepared, processed by one or more generation models, then decoded/postprocessed into output assets.",
        components=(("Input/prompt layer", "Prepares prompts, source media, and generation settings."), ("Generation pipeline", "Runs model inference for synthesis or transformation."), ("Media output layer", "Decodes, postprocesses, and writes generated assets.")),
        data_flow=("Prompt, parameters, and optional source media enter the generation pipeline.", "Model outputs are decoded and processed into image assets returned to the caller or saved downstream."),
        extension_model="Extend through models, pipelines, schedulers, preprocessors, postprocessors, adapters, or application APIs.",
        tradeoffs=("Higher-fidelity generation generally increases compute cost.", "Flexible model ecosystems increase dependency and compatibility complexity."),
        deployment_modes=("library", "local generation service", "batch worker"),
        interfaces=("programmatic API", "CLI"),
    ),
    "video-generation": CategoryTemplate(
        product_type="Video generation, editing, or AI media production tool",
        primary_role="Create, edit, transform, or assemble video through programmable or AI-assisted workflows.",
        problem="Video production combines many media operations—generation, editing, timing, audio, subtitles, rendering, and asset management—that are expensive to automate reliably.",
        solution="Provide a media pipeline or application that coordinates video generation/editing steps and exposes repeatable production workflows.",
        users=("content creators", "creative developers", "media automation teams"),
        jobs=("generate or edit video", "automate repeatable media production", "assemble AI-generated media assets"),
        best_for=("programmatic video workflows", "AI-assisted content production"),
        poor_fit=("high-touch manual editing requiring full professional NLE control", "deployments without adequate rendering/model resources"),
        capabilities=("video generation or transformation", "media pipeline orchestration", "asset/render workflow automation"),
        limitations=("rendering and model inference can be resource intensive", "output quality depends on source assets and models"),
        architecture_style="Media workflow composed of input/asset handling, generation or editing stages, and rendering/output components.",
        execution_model="Media assets, prompts, and timeline/configuration inputs move through generation/editing stages before final rendering or export.",
        components=(("Asset/input layer", "Loads prompts, clips, audio, images, or project configuration."), ("Media processing pipeline", "Generates, edits, composes, or transforms media."), ("Renderer/export layer", "Produces final video or intermediate assets.")),
        data_flow=("Source assets and creative instructions enter the media pipeline.", "Processing stages generate or transform media and pass outputs to rendering/export."),
        extension_model="Extend through media processors, models, effects, templates, timeline operations, renderers, or automation hooks.",
        tradeoffs=("Automation improves throughput but may reduce fine-grained creative control.", "Media and model processing can require substantial compute and storage."),
        deployment_modes=("desktop or local app", "library", "worker/service"),
        interfaces=("UI", "programmatic API", "CLI"),
    ),
    "content-automation": CategoryTemplate(
        product_type="Content automation toolkit or agent skill collection",
        primary_role="Automate repeatable stages of content research, generation, transformation, and publishing workflows.",
        problem="Content production requires many repetitive steps across research, scripting, assets, media processing, formatting, and distribution.",
        solution="Package reusable automation steps, skills, templates, or pipelines that turn structured inputs into content artifacts with less manual work.",
        users=("content automation teams", "creative developers", "publishers and growth teams"),
        jobs=("automate content production", "generate repeatable media/content outputs", "connect AI generation with publishing workflows"),
        best_for=("repeatable content formats", "teams building automated creative pipelines"),
        poor_fit=("one-off bespoke creative work", "workflows requiring continuous manual artistic direction"),
        capabilities=("content generation automation", "multi-step creative processing", "reusable templates or skills"),
        limitations=("automated outputs still require quality controls", "platform and model dependencies can change independently"),
        architecture_style="Pipeline or skill-oriented system where content inputs move through generation/transformation stages to publishable artifacts.",
        execution_model="A content brief or source input selects a workflow/skill; processing steps generate and transform assets until an output artifact is produced.",
        components=(("Input/brief layer", "Receives source material, prompts, or content requirements."), ("Automation pipeline", "Runs generation and transformation steps."), ("Output/publishing layer", "Formats, exports, or hands off finished content artifacts.")),
        data_flow=("Briefs or source assets enter a selected automation workflow.", "Generation and transformation stages produce content artifacts for review, export, or publishing."),
        extension_model="Extend through skills, templates, media processors, model integrations, publishing adapters, or custom workflow steps.",
        tradeoffs=("Higher automation can reduce editorial control without review gates.", "External platform/model changes can break automated workflows."),
        deployment_modes=("toolkit", "CLI", "service or workflow"),
        interfaces=("skills/templates", "programmatic API", "CLI"),
    ),
    "api": CategoryTemplate(
        product_type="API, protocol adapter, or developer integration layer",
        primary_role="Expose a capability through a stable programmatic interface for other applications and tools.",
        problem="Applications need a consistent integration boundary instead of coupling directly to lower-level protocols, runtimes, or service-specific behavior.",
        solution="Wrap the underlying capability in an API, proxy, client, or compatibility layer with developer-friendly request and response semantics.",
        users=("application developers", "platform engineers", "integration teams"),
        jobs=("integrate a capability through code", "standardize service access", "bridge incompatible protocols or APIs"),
        best_for=("applications needing a reusable integration boundary", "teams standardizing access across services"),
        poor_fit=("end users needing a complete standalone product", "cases where direct native integration is already simpler"),
        capabilities=("programmatic integration", "API or protocol adaptation", "reusable client/service boundary"),
        limitations=("compatibility layers may not expose every native feature", "upstream protocol changes can require adapter updates"),
        architecture_style="Thin API/client/proxy boundary around an underlying service, runtime, or protocol.",
        execution_model="Caller requests enter the integration boundary, are validated/transformed, forwarded to the underlying capability, and normalized results are returned.",
        components=(("Public interface", "Defines the caller-facing API or client surface."), ("Adapter/core", "Translates requests to the underlying capability."), ("Transport/provider layer", "Handles protocol, service, or runtime communication.")),
        data_flow=("A caller submits a request through the public interface.", "The adapter translates and executes the request against the provider/runtime, then returns a normalized result."),
        extension_model="Extend through endpoints, clients, transports, provider adapters, middleware, or protocol mappings.",
        tradeoffs=("A stable abstraction improves integration but can lag provider-specific features.", "Proxies add another operational and failure boundary."),
        deployment_modes=("library", "API service", "proxy"),
        interfaces=("API", "SDK or client"),
    ),
}

# Curated corrections where the seed category is intentionally broad.
CATEGORY_OVERRIDES: dict[str, str] = {
    "vercel/ai": "api",
    "humanlayer/12-factor-agents": "developer-productivity",
    "webdriverio/webdriverio": "testing",
    "ServiceNow/BrowserGym": "testing",
    "laravel/dusk": "testing",
    "firecrawl/firecrawl": "data-extraction",
    "firecrawl/firecrawl-mcp-server": "api",
    "alirezamika/autoscraper": "data-extraction",
    "brightdata/cli": "data-extraction",
    "dzhng/deep-research": "ai-agent",
    "MontFerret/ferret": "data-extraction",
    "apache/airflow": "workflow-automation",
    "PrefectHQ/prefect": "workflow-automation",
    "airbytehq/airbyte": "workflow-automation",
    "n8n-io/self-hosted-ai-starter-kit": "self-hosting",
    "raga-ai-hub/RagaAI-Catalyst": "observability",
    "confident-ai/deepeval": "testing",
    "openai/evals": "testing",
    "llmware-ai/llmware": "rag",
    "pathwaycom/pathway": "rag",
    "open-webui/pipelines": "api",
    "ollama/ollama-python": "api",
    "ollama/ollama-js": "api",
    "YILS-LIN/short-video-factory": "content-automation",
    "krillinai/KrillinAI": "content-automation",
}


def _clean_description(full_name: str, description: str | None) -> str:
    text = (description or "").strip().rstrip(".")
    if text:
        return text
    return f"{full_name} is an open-source project in the curated ThingsO catalog"


def generate_editorial_draft(
    *,
    full_name: str,
    category: str,
    description: str | None,
) -> EditorialIntelligenceDraftV3:
    canonical_category = CATEGORY_OVERRIDES.get(full_name, category)
    template = TEMPLATES.get(canonical_category)
    if template is None:
        raise ValueError(f"No editorial baseline template for category: {canonical_category}")

    source_description = _clean_description(full_name, description)
    definition = f"{source_description}. In ThingsO it is evaluated as a {template.product_type.lower()}."

    components = [
        EditorialComponent(name=name, responsibility=responsibility)
        for name, responsibility in template.components
    ]
    return EditorialIntelligenceDraftV3(
        definition=definition,
        product_type=template.product_type,
        primary_role=template.primary_role,
        primary_category=canonical_category,
        secondary_categories=[category] if category != canonical_category else [],
        interaction_model=template.interfaces[0] if template.interfaces else "programmatic interface",
        intended_scope=f"Use {full_name} for the {canonical_category} role described by its repository and current evidence, not as a universal replacement for adjacent infrastructure.",
        problem_statement=template.problem,
        pain_points=[template.problem[:500]],
        solution_approach=template.solution,
        why_it_matters=f"The project is useful when teams need the {canonical_category} capability without building every supporting primitive from scratch.",
        differentiators=[
            f"Repository-stated scope: {source_description}.",
            f"Its curated role in the ThingsO catalog is {canonical_category}; exact implementation differentiation is verified from repository evidence rather than assumed from popularity.",
        ],
        design_philosophy=["Prefer the project’s documented public interfaces and extension points over undocumented internals."],
        tradeoffs_created_by_design=list(template.tradeoffs),
        target_users=list(template.users),
        team_profiles=["teams comfortable integrating and operating open-source software"],
        skill_level="developer or technical operator",
        jobs_to_be_done=list(template.jobs),
        best_for=list(template.best_for),
        poor_fit=list(template.poor_fit),
        capabilities=list(template.capabilities),
        limitations=list(template.limitations),
        architecture_overview=f"The baseline architecture for this {canonical_category} project is interpreted from its product category, while concrete runtime, technology, code paths, commands, and deployment evidence are compiled from the current repository snapshot.",
        architecture_style=template.architecture_style,
        execution_model=template.execution_model,
        components=components,
        data_flow=list(template.data_flow),
        extension_model=template.extension_model,
        integration_notes=["Validate concrete integrations against the current repository docs and codebase map before adoption."],
        choose_when=list(template.best_for),
        avoid_when=list(template.poor_fit),
        evaluate_first=[
            "Confirm the current license and project activity meet your requirements.",
            "Prototype the project against one representative production workflow.",
            "Review the generated Technology, Codebase, Developer Workflow, Deployment, and Security evidence sections before committing to adoption.",
        ],
        tradeoffs=list(template.tradeoffs),
        learning_curve="medium",
        operational_complexity="medium",
        migration_cost="medium",
        lock_in="medium",
        comparison_dimensions={
            "fit": f"How directly the project satisfies the intended {canonical_category} workflow.",
            "operations": "Infrastructure, state, upgrades, and runtime requirements.",
            "extensibility": "Quality of documented APIs, plugins, adapters, or extension points.",
            "evidence": "How strongly adoption claims are supported by current repository evidence.",
        },
        learnings=[
            f"Study {full_name} to understand practical implementation choices in the {canonical_category} problem space.",
            "Compare its public extension model with its internal module boundaries before reusing patterns elsewhere.",
        ],
        reusable_patterns=[template.architecture_style, template.extension_model],
        reusable_components=[component.name for component in components],
        deployment_modes=list(template.deployment_modes),
        interfaces=list(template.interfaces),
        taxonomy_slugs=[canonical_category],
        confidence=0.78,
    )


def load_seed_rows(path: str | Path) -> list[dict[str, str]]:
    with Path(path).open("r", encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    for row in rows:
        if not row.get("full_name") or not row.get("category"):
            raise ValueError("Seed rows must include full_name and category")
    return rows


def generate_seed_entries(
    database_url: str,
    seed_path: str | Path,
) -> list[dict[str, object]]:
    evidence_builder = EvidenceBuilder(database_url, max_source_chars=36_000)
    entries: list[dict[str, object]] = []
    for row in load_seed_rows(seed_path):
        full_name = row["full_name"]
        bundle = evidence_builder.load_by_full_name(full_name)
        draft = generate_editorial_draft(
            full_name=full_name,
            category=row["category"],
            description=str(bundle.facts.get("description") or "") or None,
        )
        entries.append({"full_name": full_name, "draft": draft.model_dump(mode="json")})
    return entries
