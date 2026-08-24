from __future__ import annotations

import json
import re
import tomllib
from pathlib import PurePosixPath
from urllib.parse import unquote, urlparse

from .evidence import EvidenceBundle, EvidenceDocument
from .intelligence_draft import EditorialIntelligenceDraftV3
from .intelligence_models import (
    ArchitectureComponent,
    ArchitectureV3,
    AudienceFitV3,
    CodePath,
    CodebaseIntelligenceV3,
    DecisionGuideV3,
    DeploymentOperationsV3,
    DeveloperWorkflowV3,
    DevCommand,
    DifferentiationV3,
    IntegrationExtensionV3,
    IntelligenceClaim,
    LearningIntelligenceV3,
    ProblemIntelligenceV3,
    ProjectSignalsV3,
    RepositoryIdentityV3,
    RepositoryIntelligenceProfileV3,
    SecurityPrivacyV3,
    TechnologyItem,
    TechnologyProfileV3,
)

_DEPENDENCY_TECH: dict[str, tuple[str, str]] = {
    "next": ("Next.js", "web framework"),
    "react": ("React", "frontend"),
    "vue": ("Vue", "frontend"),
    "svelte": ("Svelte", "frontend"),
    "@angular/core": ("Angular", "frontend"),
    "vite": ("Vite", "frontend build"),
    "express": ("Express", "backend framework"),
    "fastapi": ("FastAPI", "backend framework"),
    "flask": ("Flask", "backend framework"),
    "django": ("Django", "backend framework"),
    "pydantic": ("Pydantic", "validation"),
    "sqlalchemy": ("SQLAlchemy", "ORM/database"),
    "psycopg": ("PostgreSQL client", "database"),
    "psycopg2": ("PostgreSQL client", "database"),
    "prisma": ("Prisma", "ORM/database"),
    "redis": ("Redis client", "cache/queue"),
    "bullmq": ("BullMQ", "queue"),
    "celery": ("Celery", "queue"),
    "playwright": ("Playwright", "browser automation"),
    "selenium": ("Selenium", "browser automation"),
    "httpx": ("HTTPX", "HTTP client"),
    "requests": ("Requests", "HTTP client"),
    "openai": ("OpenAI client/API", "AI provider client"),
    "anthropic": ("Anthropic client/API", "AI provider client"),
    "transformers": ("Transformers", "ML library"),
    "torch": ("PyTorch", "ML framework"),
    "pytorch": ("PyTorch", "ML framework"),
    "langchain": ("LangChain", "AI framework"),
    "llama-index": ("LlamaIndex", "RAG framework"),
    "llama_index": ("LlamaIndex", "RAG framework"),
    "chromadb": ("Chroma", "vector database"),
    "qdrant-client": ("Qdrant client", "vector database"),
    "weaviate-client": ("Weaviate client", "vector database"),
    "ffmpeg-python": ("FFmpeg integration", "media processing"),
    "electron": ("Electron", "desktop runtime"),
    "@tauri-apps/api": ("Tauri", "desktop runtime"),
}

_PATH_PURPOSES: dict[str, str] = {
    "apps": "Deployable applications or workspace applications.",
    "packages": "Reusable packages/modules that compose the project.",
    "src": "Primary implementation source code.",
    "lib": "Library implementation code.",
    "core": "Core domain or execution logic.",
    "api": "API/service boundary.",
    "server": "Backend or server runtime.",
    "backend": "Backend application/services.",
    "frontend": "Frontend application.",
    "web": "Web-facing application or modules.",
    "ui": "User-interface code/components.",
    "worker": "Background worker/execution code.",
    "workers": "Background workers/execution code.",
    "cmd": "Command-line entry points.",
    "cli": "Command-line interface implementation.",
    "agent": "Agent runtime or agent implementation.",
    "agents": "Agent implementations/orchestration.",
    "plugins": "Plugin/extension implementations.",
    "integrations": "External service integrations.",
    "connectors": "Connector implementations.",
    "providers": "Provider adapters.",
    "nodes": "Workflow/node implementations.",
    "models": "Model-related implementation/assets.",
    "tests": "Automated tests.",
    "test": "Automated tests.",
    "docs": "Project documentation.",
    "examples": "Usage examples/reference implementations.",
    "scripts": "Development/automation scripts.",
}


def _doc_path(document: EvidenceDocument) -> str:
    path = unquote(urlparse(document.source_url).path)
    if "/blob/" in path:
        rest = path.split("/blob/", 1)[1]
        parts = rest.split("/", 1)
        return parts[1] if len(parts) == 2 else ""
    return ""


def _documents(bundle: EvidenceBundle, document_type: str) -> list[EvidenceDocument]:
    return [document for document in bundle.documents if document.document_type == document_type]


def _first_text(bundle: EvidenceBundle, document_type: str) -> str:
    documents = _documents(bundle, document_type)
    return documents[0].sanitized.text if documents else ""


def _evidence_types(bundle: EvidenceBundle) -> set[str]:
    return {document.document_type for document in bundle.documents}


def _claim(
    value: str | None,
    *,
    state: str = "inferred",
    confidence: float | None = None,
    evidence: list[str] | None = None,
) -> IntelligenceClaim:
    if not value:
        return IntelligenceClaim(value=None, state="unknown", confidence=None, evidence=[])
    safe_state = state if state in {"known", "inferred", "conflicting"} else "inferred"
    return IntelligenceClaim(
        value=value,
        state=safe_state,
        confidence=confidence,
        evidence=evidence or [],
    )


def _manifest_dependencies(bundle: EvidenceBundle) -> tuple[set[str], list[str]]:
    dependencies: set[str] = set()
    package_scripts: list[str] = []

    for document in _documents(bundle, "manifest"):
        path = _doc_path(document)
        name = PurePosixPath(path).name.lower()
        text = document.sanitized.text
        try:
            if name == "package.json":
                payload = json.loads(text)
                for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
                    values = payload.get(key) or {}
                    if isinstance(values, dict):
                        dependencies.update(str(item).lower() for item in values)
                scripts = payload.get("scripts") or {}
                if isinstance(scripts, dict):
                    for script_name, command in scripts.items():
                        if isinstance(command, str):
                            package_scripts.append(f"{script_name}: {command}")
            elif name == "pyproject.toml":
                payload = tomllib.loads(text)
                project = payload.get("project") or {}
                for item in project.get("dependencies") or []:
                    dependency = re.split(r"[<>=!~ ;\[]", str(item), maxsplit=1)[0].strip().lower()
                    if dependency:
                        dependencies.add(dependency)
                poetry = ((payload.get("tool") or {}).get("poetry") or {}).get("dependencies") or {}
                if isinstance(poetry, dict):
                    dependencies.update(str(item).lower() for item in poetry if str(item).lower() != "python")
            elif name.startswith("requirements"):
                for line in text.splitlines():
                    line = line.strip()
                    if not line or line.startswith(("#", "-")):
                        continue
                    dependency = re.split(r"[<>=!~ ;\[]", line, maxsplit=1)[0].strip().lower()
                    if dependency:
                        dependencies.add(dependency)
            elif name in {"setup.py", "setup.cfg"}:
                for dependency in _DEPENDENCY_TECH:
                    if re.search(rf"(?i)(?<![a-z0-9_.-]){re.escape(dependency)}(?![a-z0-9_.-])", text):
                        dependencies.add(dependency)
            elif name == "go.mod":
                for line in text.splitlines():
                    line = line.strip()
                    if line.startswith("module "):
                        dependencies.add("go-module")
            elif name == "cargo.toml":
                payload = tomllib.loads(text)
                for section in ("dependencies", "dev-dependencies", "build-dependencies"):
                    values = payload.get(section) or {}
                    if isinstance(values, dict):
                        dependencies.update(str(item).lower() for item in values)
        except (json.JSONDecodeError, tomllib.TOMLDecodeError, TypeError, AttributeError):
            continue

    return dependencies, package_scripts


def _technology(bundle: EvidenceBundle) -> TechnologyProfileV3:
    dependencies, _ = _manifest_dependencies(bundle)
    types = _evidence_types(bundle)
    items: list[TechnologyItem] = []
    seen: set[str] = set()

    primary_language = bundle.facts.get("primary_language")
    if isinstance(primary_language, str) and primary_language:
        items.append(
            TechnologyItem(
                name=primary_language,
                category="primary language",
                role="Primary language reported by the current GitHub repository snapshot.",
                state="known",
                evidence=["repository_snapshot"],
            )
        )
        seen.add(primary_language.lower())

    for dependency in sorted(dependencies):
        match = _DEPENDENCY_TECH.get(dependency)
        if not match:
            continue
        display_name, category = match
        if display_name.lower() in seen:
            continue
        items.append(
            TechnologyItem(
                name=display_name,
                category=category,
                role=f"Declared project dependency associated with {category}.",
                state="known",
                evidence=["manifest"],
            )
        )
        seen.add(display_name.lower())

    manifest_names = {PurePosixPath(_doc_path(document)).name.lower() for document in _documents(bundle, "manifest")}
    package_tools = [
        ("package.json", "Node/npm-compatible package manifest"),
        ("pyproject.toml", "Python pyproject packaging"),
        ("requirements.txt", "Python requirements manifest"),
        ("setup.py", "Python setuptools packaging"),
        ("go.mod", "Go modules"),
        ("cargo.toml", "Cargo/Rust package manifest"),
        ("pom.xml", "Maven build"),
    ]
    for filename, display in package_tools:
        if filename in manifest_names and display.lower() not in seen:
            items.append(
                TechnologyItem(
                    name=display,
                    category="build/package",
                    role="Defines dependency, packaging or build metadata.",
                    state="known",
                    evidence=["manifest"],
                )
            )
            seen.add(display.lower())

    if "container" in types:
        items.append(
            TechnologyItem(
                name="Container configuration",
                category="deployment",
                role="Container build or compose configuration is present in repository evidence.",
                state="known",
                evidence=["container"],
            )
        )
    if "ci" in types:
        items.append(
            TechnologyItem(
                name="CI automation",
                category="development infrastructure",
                role="Repository CI configuration automates checks, builds or release tasks.",
                state="known",
                evidence=["ci"],
            )
        )

    if not items:
        items.append(
            TechnologyItem(
                name="Repository-defined runtime",
                category="runtime",
                role="Runtime details are visible in the repository tree/README but no recognized manifest technology was deterministically extracted.",
                state="inferred",
                evidence=["repository_tree", "readme"],
            )
        )

    return TechnologyProfileV3(items=items[:20], api_style=[], protocols=[], evidence=["manifest"] if "manifest" in types else ["repository_tree", "readme"])


def _tree_paths(bundle: EvidenceBundle) -> list[str]:
    text = _first_text(bundle, "repository_tree")
    return [line.rstrip("/").strip() for line in text.splitlines() if line.strip()]


def _codebase(bundle: EvidenceBundle) -> CodebaseIntelligenceV3:
    paths = _tree_paths(bundle)
    candidates: list[tuple[int, int, str, str]] = []
    for path in paths:
        parts = PurePosixPath(path).parts
        if not parts or parts[0].startswith("."):
            continue
        name = parts[-1].lower()
        purpose = _PATH_PURPOSES.get(name)
        if not purpose:
            continue
        depth = len(parts)
        candidates.append((0 if depth == 1 else 1, depth, path, purpose))
    candidates.sort()

    important: list[CodePath] = []
    seen: set[str] = set()
    for _, _, path, purpose in candidates:
        if path in seen:
            continue
        seen.add(path)
        important.append(CodePath(path=path, purpose=purpose, evidence=["repository_tree"]))
        if len(important) >= 8:
            break

    if not important:
        for path in paths:
            parts = PurePosixPath(path).parts
            if len(parts) == 1 and path and not path.startswith("."):
                important.append(
                    CodePath(
                        path=path,
                        purpose="Visible top-level repository area or entry point.",
                        evidence=["repository_tree"],
                    )
                )
            if len(important) >= 4:
                break

    selected_paths = [item.path for item in important]
    extension_points = [
        path
        for path in selected_paths
        if any(keyword in path.lower() for keyword in ("plugin", "integration", "connector", "provider", "tool", "node"))
    ]
    entry_points = [
        path
        for path in paths
        if PurePosixPath(path).name.lower()
        in {"main.py", "app.py", "server.py", "cli.py", "index.ts", "index.js", "main.ts", "main.js", "main.go", "main.rs"}
    ][:8]

    summary = (
        "The semantic codebase map is derived from the captured repository tree. "
        f"Key visible areas include {', '.join(selected_paths[:5])}."
        if selected_paths
        else "The repository tree was captured, but no conventional code area could be confidently classified."
    )
    return CodebaseIntelligenceV3(
        structure_summary=summary,
        important_paths=important,
        entry_points=entry_points,
        start_reading=selected_paths[:5],
        extension_points=extension_points[:8],
        evidence=["repository_tree"],
    )


def _readme_commands(bundle: EvidenceBundle) -> list[str]:
    text = _first_text(bundle, "readme")
    commands: list[str] = []
    in_fence = False
    fence_is_command = False
    for raw_line in text.splitlines():
        stripped = raw_line.strip()
        if stripped.startswith("```"):
            if not in_fence:
                language = stripped[3:].strip().lower()
                in_fence = True
                fence_is_command = language in {"", "sh", "shell", "bash", "zsh", "console", "powershell", "ps1"}
            else:
                in_fence = False
                fence_is_command = False
            continue
        if not in_fence or not fence_is_command:
            continue
        line = stripped.lstrip("$>").strip()
        if not line or line.startswith(("#", "<")) or len(line) > 300:
            continue
        if re.match(
            r"^(?:pnpm|npm|npx|yarn|bun|pip3?|uv|poetry|docker(?:\s+compose)?|make|go(?:\s|$)|cargo|python3?|pytest|mvn|gradle|\.\/|curl|git)(?:\s|$)",
            line,
            re.IGNORECASE,
        ):
            normalized = re.sub(r"\s+", " ", line)
            if normalized not in commands:
                commands.append(normalized)
        if len(commands) >= 12:
            break
    return commands


def _developer_workflow(bundle: EvidenceBundle) -> DeveloperWorkflowV3:
    types = _evidence_types(bundle)
    commands = _readme_commands(bundle)
    _, package_scripts = _manifest_dependencies(bundle)
    dev_commands: list[DevCommand] = []
    for command in commands[:8]:
        lower = command.lower()
        purpose = "setup or run project"
        if "install" in lower:
            purpose = "install dependencies/runtime"
        elif " test" in f" {lower}" or lower.startswith("pytest"):
            purpose = "run tests"
        elif "dev" in lower or "serve" in lower:
            purpose = "run development mode"
        elif lower.startswith("docker"):
            purpose = "container workflow"
        dev_commands.append(DevCommand(purpose=purpose, command=command, evidence=["readme"]))

    def script_value(keywords: tuple[str, ...]) -> str | None:
        for item in package_scripts:
            name, _, command = item.partition(": ")
            if any(keyword in name.lower() for keyword in keywords):
                return f"Package script `{name}` runs `{command}`."
        return None

    local_setup = (
        f"The README provides executable setup/run commands; a representative captured command is `{commands[0]}`."
        if commands
        else "Use the installation/setup path documented by the project README; no command was deterministically extracted from a shell code block."
    )
    build = script_value(("build",))
    tests = script_value(("test", "check"))
    lint = script_value(("lint",))
    typecheck = script_value(("typecheck", "type-check", "types"))

    evidence = ["readme"]
    if "manifest" in types:
        evidence.append("manifest")
    if "ci" in types:
        evidence.append("ci")

    return DeveloperWorkflowV3(
        local_setup=_claim(local_setup, state="known" if commands else "inferred", confidence=0.80 if commands else 0.62, evidence=["readme"]),
        commands=dev_commands,
        build=_claim(build, state="known", confidence=0.90, evidence=["manifest"]),
        tests=_claim(
            tests or ("Automated CI is present; the exact local test command is not established from the selected manifest." if "ci" in types else None),
            state="known" if tests else "inferred",
            confidence=0.88 if tests else (0.58 if "ci" in types else None),
            evidence=["manifest"] if tests else (["ci"] if "ci" in types else []),
        ),
        lint=_claim(lint, state="known", confidence=0.90, evidence=["manifest"]),
        typecheck=_claim(typecheck, state="known", confidence=0.90, evidence=["manifest"]),
        debugging=_claim(None),
        migrations=_claim(None),
        ci_cd=_claim(
            "Captured CI configuration is present for automated repository checks/build/release tasks."
            if "ci" in types
            else None,
            state="known",
            confidence=0.82,
            evidence=["ci"] if "ci" in types else [],
        ),
        contribution_process=_claim(
            "A captured contribution/development document describes project contribution expectations."
            if "contributing" in types
            else None,
            state="known",
            confidence=0.80,
            evidence=["contributing"] if "contributing" in types else [],
        ),
        release_process=_claim(None),
        evidence=evidence,
    )


def _deployment(bundle: EvidenceBundle, draft: EditorialIntelligenceDraftV3) -> DeploymentOperationsV3:
    types = _evidence_types(bundle)
    product_type = draft.product_type.lower()
    if "container" in types:
        minimum = "Captured container configuration establishes a container-based development or deployment path."
        minimum_state = "known"
        minimum_evidence = ["container"]
        minimum_confidence = 0.86
    elif any(word in product_type for word in ("library", "sdk", "framework")):
        minimum = "Install/invoke the project inside a compatible host runtime or application; a universal standalone service is not required by the product type."
        minimum_state = "inferred"
        minimum_evidence = ["readme", "manifest"] if "manifest" in types else ["readme"]
        minimum_confidence = 0.68
    else:
        minimum = "Run the application using the installation/start path documented in the repository README on a compatible host environment."
        minimum_state = "inferred"
        minimum_evidence = ["readme"]
        minimum_confidence = 0.64

    technical = _technology(bundle)
    required_services = [
        item.name
        for item in technical.items
        if item.category in {"database", "cache/queue", "runtime"}
    ][:10]
    evidence = minimum_evidence.copy()
    if "configuration" in types:
        evidence.append("configuration")

    return DeploymentOperationsV3(
        minimum_deployment=_claim(
            minimum,
            state=minimum_state,
            confidence=minimum_confidence,
            evidence=minimum_evidence,
        ),
        production_topology=_claim(
            "Production topology is deployment-specific; validate stateful services, worker/runtime boundaries and external dependencies before high-availability scale-out.",
            confidence=0.54,
            evidence=minimum_evidence,
        ),
        required_services=required_services,
        persistence=_claim(
            "Persistence requirements are workload/deployment specific unless explicitly established by a captured manifest/container document.",
            confidence=0.52,
            evidence=minimum_evidence,
        ),
        configuration=_claim(
            "Configuration is supplied through the project’s documented runtime/application settings; inspect README and captured configuration files for exact keys.",
            confidence=0.62,
            evidence=["configuration"] if "configuration" in types else ["readme"],
        ),
        scaling=_claim(
            "Scale according to the runtime’s supported process/service model and validate shared state, model hardware and external rate limits before horizontal replication.",
            confidence=0.52,
            evidence=minimum_evidence,
        ),
        observability=_claim(None),
        backup_upgrade=_claim(None),
        failure_recovery=_claim(
            "Recovery planning should cover persistent state, generated artifacts and external integration credentials; exact procedures are deployment-specific.",
            confidence=0.50,
            evidence=minimum_evidence,
        ),
        resource_profile=_claim(
            "Resource requirements depend on workload and selected runtime/model; benchmark the intended production workload before sizing infrastructure.",
            confidence=0.50,
            evidence=["readme"],
        ),
        operational_risks=[
            "External APIs, models or runtime dependencies can change independently of this repository.",
            "Upgrades should be tested against the adopting application’s integrations and persisted state.",
        ],
        evidence=list(dict.fromkeys(evidence)),
    )


def _security(bundle: EvidenceBundle, draft: EditorialIntelligenceDraftV3) -> SecurityPrivacyV3:
    types = _evidence_types(bundle)
    has_security = "security" in types
    category = draft.primary_category.lower()
    risks: list[str] = []
    if "agent" in category:
        risks.append("Tool-enabled agents should receive least-privilege credentials and explicit boundaries for external actions.")
    if "browser" in category:
        risks.append("Browser sessions may contain authenticated state, cookies and sensitive page content.")
    if "scrap" in category or "extraction" in category:
        risks.append("Operators should verify authorization, terms and data-handling requirements for external sources.")
    if any(word in category for word in ("workflow", "self-host")):
        risks.append("Administrative surfaces and integration credentials should be protected in self-hosted deployments.")

    evidence = ["security"] if has_security else []
    return SecurityPrivacyV3(
        authentication=_claim(None),
        authorization=_claim(None),
        secrets=_claim(
            "Use the project’s supported secret/configuration mechanism and keep service credentials outside source control.",
            confidence=0.52,
            evidence=evidence or ["readme"],
        ),
        network_exposure=_claim(None),
        sandboxing=_claim(None),
        multi_tenancy=_claim(None),
        data_persisted=_claim(None),
        data_leaves_system=_claim(
            "Data can leave the deployment when configured external APIs, model providers or remote sources are used; exact flows depend on user configuration.",
            confidence=0.50,
            evidence=["readme"],
        ),
        telemetry=_claim(None),
        security_risks=risks,
        evidence=evidence,
    )


def _project_signals(bundle: EvidenceBundle) -> ProjectSignalsV3:
    stars = int(bundle.facts.get("stars") or 0)
    forks = int(bundle.facts.get("forks") or 0)
    archived = bool(bundle.facts.get("is_archived"))
    owner = str(bundle.facts.get("owner") or bundle.full_name.split("/", 1)[0])
    license_spdx = bundle.facts.get("license_spdx")
    pushed_at = bundle.facts.get("pushed_at_source")

    if archived:
        maturity = "archived/inactive in the current GitHub snapshot"
    elif stars >= 20_000:
        maturity = "established with strong public adoption signals"
    elif stars >= 5_000:
        maturity = "growing to established open-source project"
    elif stars >= 1_000:
        maturity = "growing open-source project"
    else:
        maturity = "early or niche open-source project"

    return ProjectSignalsV3(
        maturity=_claim(maturity, confidence=0.84, evidence=["repository_snapshot"]),
        governance=_claim(
            f"Maintained under GitHub owner `{owner}`; detailed governance/decision rights are not fully established by the bounded evidence pack.",
            confidence=0.62,
            evidence=["repository_snapshot", "readme"],
        ),
        licensing=_claim(
            f"GitHub reports SPDX license `{license_spdx}`; verify repository license text and dependency obligations for the intended use."
            if license_spdx
            else None,
            state="known",
            confidence=0.90,
            evidence=["repository_snapshot"] if license_spdx else [],
        ),
        adoption_signals=[f"GitHub snapshot: {stars:,} stars", f"GitHub snapshot: {forks:,} forks"],
        ecosystem=[],
        evolution=[f"Current snapshot pushed_at: {pushed_at}"] if pushed_at else [],
        evidence=["repository_snapshot", "readme"],
    )


def _complexity(value: str) -> str:
    normalized = value.strip().lower()
    return normalized if normalized in {"low", "medium", "high", "unknown"} else "unknown"


def compile_editorial_profile(
    bundle: EvidenceBundle,
    draft: EditorialIntelligenceDraftV3,
) -> RepositoryIntelligenceProfileV3:
    types = _evidence_types(bundle)
    architecture_evidence = ["readme", "repository_tree"]
    if "architecture" in types:
        architecture_evidence.append("architecture")
    if "manifest" in types:
        architecture_evidence.append("manifest")

    technology = _technology(bundle)
    codebase = _codebase(bundle)
    developer = _developer_workflow(bundle)
    deployment = _deployment(bundle, draft)
    security = _security(bundle, draft)
    signals = _project_signals(bundle)

    components = [
        ArchitectureComponent(
            name=component.name,
            responsibility=component.responsibility,
            evidence=["readme", "repository_tree"],
        )
        for component in draft.components
    ]

    architecture = ArchitectureV3(
        overview=draft.architecture_overview,
        style=_claim(draft.architecture_style, confidence=0.80, evidence=architecture_evidence),
        execution_model=_claim(draft.execution_model, confidence=0.82, evidence=architecture_evidence),
        state_model=_claim(
            "State behavior depends on the selected runtime/deployment; inspect the project’s execution modules and persistence configuration for durable-state requirements.",
            confidence=0.55,
            evidence=architecture_evidence,
        ),
        components=components,
        data_flow=draft.data_flow,
        control_flow=_claim(
            f"Control follows the project’s {draft.execution_model} model and the component responsibilities described in this profile.",
            confidence=0.66,
            evidence=architecture_evidence,
        ),
        persistence_model=deployment.persistence,
        concurrency_model=_claim(
            "Concurrency is implementation/runtime specific; verify worker, async or parallel execution settings before capacity planning.",
            confidence=0.52,
            evidence=architecture_evidence,
        ),
        isolation_model=_claim(None),
        scaling_model=deployment.scaling,
        evidence=architecture_evidence,
    )

    integration_evidence = ["readme", "repository_tree"]
    integration = IntegrationExtensionV3(
        extension_model=_claim(
            draft.extension_model,
            confidence=0.72,
            evidence=integration_evidence,
        ),
        plugin_system=_claim(None),
        apis=[],
        protocols=[],
        integrations=draft.integration_notes,
        adding_extension=_claim(
            "Start with documented public APIs and the codebase extension/provider/integration paths identified by the semantic tree map.",
            confidence=0.58,
            evidence=integration_evidence,
        ),
        evidence=integration_evidence,
    )

    decision = DecisionGuideV3(
        choose_when=draft.choose_when,
        avoid_when=draft.avoid_when,
        evaluate_first=draft.evaluate_first,
        tradeoffs=draft.tradeoffs,
        learning_curve=_complexity(draft.learning_curve),
        operational_complexity=_complexity(draft.operational_complexity),
        migration_cost=_complexity(draft.migration_cost),
        lock_in=_complexity(draft.lock_in),
        comparison_dimensions=draft.comparison_dimensions,
        evidence=["readme", "repository_tree"],
    )

    learning = LearningIntelligenceV3(
        learnings=draft.learnings,
        reading_order=codebase.start_reading,
        reusable_patterns=draft.reusable_patterns,
        reusable_components=draft.reusable_components or [component.name for component in components[:5]],
        evidence=["readme", "repository_tree"],
    )

    architecture_confidence = 0.82 if "architecture" in types else 0.72
    technology_confidence = 0.88 if "manifest" in types else 0.68
    developer_confidence = 0.82 if len(developer.evidence) >= 2 else 0.62
    deployment_confidence = 0.82 if "container" in types else 0.64

    return RepositoryIntelligenceProfileV3(
        identity=RepositoryIdentityV3(
            definition=draft.definition,
            product_type=draft.product_type,
            primary_role=draft.primary_role,
            primary_category=draft.primary_category,
            secondary_categories=draft.secondary_categories,
            interaction_model=draft.interaction_model,
            intended_scope=draft.intended_scope,
            evidence=["readme"],
        ),
        problem=ProblemIntelligenceV3(
            problem_statement=draft.problem_statement,
            pain_points=draft.pain_points,
            solution_approach=draft.solution_approach,
            why_it_matters=draft.why_it_matters,
            evidence=["readme"],
        ),
        differentiation=DifferentiationV3(
            differentiators=draft.differentiators,
            design_philosophy=draft.design_philosophy,
            unique_capabilities=draft.differentiators[:6],
            commodity_capabilities=[],
            tradeoffs_created_by_design=draft.tradeoffs_created_by_design,
            evidence=["readme"],
        ),
        audience=AudienceFitV3(
            target_users=draft.target_users,
            team_profiles=draft.team_profiles,
            skill_level=draft.skill_level,
            jobs_to_be_done=draft.jobs_to_be_done,
            best_for=draft.best_for,
            poor_fit=draft.poor_fit,
            evidence=["readme"],
        ),
        capabilities=draft.capabilities,
        limitations=draft.limitations,
        architecture=architecture,
        technology=technology,
        codebase=codebase,
        developer_workflow=developer,
        integration=integration,
        deployment_operations=deployment,
        security_privacy=security,
        project_signals=signals,
        decision=decision,
        learning=learning,
        deployment_modes=draft.deployment_modes,
        interfaces=draft.interfaces,
        taxonomy_slugs=draft.taxonomy_slugs,
        use_cases=draft.use_cases,
        relations=draft.relations,
        build_ideas=draft.build_ideas,
        evidence=[],
        section_confidence={
            "identity": 0.94,
            "problem": 0.86,
            "differentiation": 0.76,
            "audience": 0.78,
            "architecture": architecture_confidence,
            "technology": technology_confidence,
            "codebase": 0.92,
            "developer_workflow": developer_confidence,
            "integration": 0.66,
            "deployment_operations": deployment_confidence,
            "security_privacy": 0.58 if "security" in types else None,
            "project_signals": 0.88,
            "decision": 0.76,
            "learning": 0.74,
        },
        confidence=min(draft.confidence, 0.92),
    )
