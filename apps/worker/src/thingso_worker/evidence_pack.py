from __future__ import annotations

from pathlib import PurePosixPath

from .github_client import GitHubClient
from .models import SourceDocument
from .normalization import make_source_document

MAX_TREE_LINES = 700
# Five selected files keeps the curated-100 refresh within the proven Actions API budget.
# Evidence Pack v3 improves depth by reserving diversity for likely runtime/source entrypoints
# before lower-value documentation/evolution fallbacks.
MAX_SELECTED_FILES = 5

_MANIFESTS = {
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "requirements-dev.txt",
    "setup.py",
    "setup.cfg",
    "cargo.toml",
    "go.mod",
    "pom.xml",
    "build.gradle",
    "build.gradle.kts",
    "gemfile",
    "composer.json",
    "mix.exs",
    "pnpm-workspace.yaml",
    "turbo.json",
    "nx.json",
}
_CONTAINER_FILES = {
    "dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "compose.yml",
    "compose.yaml",
}
_CONFIG_FILES = {
    ".env.example",
    ".env.sample",
    "makefile",
    "taskfile.yml",
    "taskfile.yaml",
    "tox.ini",
}
_CI_FILES = {
    ".travis.yml",
    "appveyor.yml",
    "azure-pipelines.yml",
}
_PROJECT_DOCS = {
    "contributing.md",
    "security.md",
    "architecture.md",
    "development.md",
    "developing.md",
    "deployment.md",
    "install.md",
    "installation.md",
}
_EVOLUTION_DOCS = {
    "changelog.md",
    "changes.md",
    "history.md",
    "roadmap.md",
    "releases.md",
}
_SOURCE_ENTRYPOINT_NAMES = {
    "main.py",
    "app.py",
    "server.py",
    "cli.py",
    "__main__.py",
    "index.ts",
    "index.tsx",
    "index.js",
    "index.jsx",
    "main.ts",
    "main.js",
    "main.go",
    "main.rs",
}
_RUNTIME_ROOTS = {
    "src",
    "app",
    "apps",
    "lib",
    "cmd",
    "server",
    "backend",
    "frontend",
    "api",
    "packages",
}
_CORE_SOURCE_NAMES = {
    "engine.py",
    "graph.py",
    "orchestrator.py",
    "pipeline.py",
    "router.py",
    "runtime.py",
    "workflow.py",
}


def _is_source_entrypoint(path: str) -> bool:
    lower = path.lower()
    pure = PurePosixPath(lower)
    name = pure.name
    depth = len(pure.parts)
    if name in _SOURCE_ENTRYPOINT_NAMES and depth <= 4:
        return depth == 1 or pure.parts[0] in _RUNTIME_ROOTS
    if name not in _CORE_SOURCE_NAMES or depth > 5:
        return False
    if depth > 1 and pure.parts[0] not in _RUNTIME_ROOTS:
        return False
    return depth == 1 or any(
        part in {"src", "lib", "core", "graph", "graphs", "agent", "agents", "runtime"}
        for part in pure.parts[:-1]
    )


def _document_type(path: str) -> str:
    lower = path.lower()
    name = PurePosixPath(lower).name
    if name in _MANIFESTS:
        return "manifest"
    if name in _CONTAINER_FILES:
        return "container"
    if name in {"contributing.md", "development.md", "developing.md"}:
        return "contributing"
    if name == "security.md":
        return "security"
    if "architecture" in name:
        return "architecture"
    if lower.startswith(".github/workflows/") or name in _CI_FILES:
        return "ci"
    if name in _CONFIG_FILES:
        return "configuration"
    if name in _EVOLUTION_DOCS:
        return "changelog"
    if _is_source_entrypoint(path):
        return "source_entrypoint"
    return "documentation"


def _priority(path: str) -> tuple[int, int, str] | None:
    lower = path.lower()
    pure = PurePosixPath(lower)
    name = pure.name
    depth = len(pure.parts)

    if name in _MANIFESTS:
        return (10 if depth == 1 else 18, depth, lower)
    if name in _CONTAINER_FILES:
        return (12 if depth == 1 else 20, depth, lower)
    if _is_source_entrypoint(path):
        # Runtime/source evidence is the biggest V3 depth improvement. Rank nested
        # entrypoints ahead of project docs/evolution so the five-file budget cannot
        # be consumed before at least one likely execution path is considered.
        return (14 if depth == 1 else 19, depth, lower)
    if name in _CONFIG_FILES:
        return (22, depth, lower)
    if name in _PROJECT_DOCS:
        return (24 if depth <= 2 else 30, depth, lower)
    if name in _EVOLUTION_DOCS:
        return (26 if depth <= 2 else 32, depth, lower)
    if name in _CI_FILES:
        return (27, depth, lower)
    if lower.startswith(".github/workflows/") and lower.endswith((".yml", ".yaml")):
        return (28, depth, lower)
    if lower.startswith("docs/") and any(
        keyword in name
        for keyword in (
            "architecture",
            "getting-started",
            "quickstart",
            "installation",
            "deployment",
            "development",
            "contributing",
            "internals",
            "concepts",
        )
    ):
        return (34, depth, lower)
    return None


def _selection_group(path: str) -> str:
    document_type = _document_type(path)
    if document_type == "manifest":
        return "manifest"
    if document_type in {"container", "configuration"}:
        return "runtime"
    if document_type in {"contributing", "security"}:
        return "project-process"
    if document_type == "ci":
        return "ci"
    if document_type == "source_entrypoint":
        return "source"
    if document_type == "changelog":
        return "evolution"
    return "docs"


def select_evidence_paths(tree: list[dict[str, object]]) -> list[str]:
    candidates: list[tuple[tuple[int, int, str], str]] = []
    seen: set[str] = set()
    for item in tree:
        if item.get("type") != "blob":
            continue
        path = str(item.get("path") or "")
        if not path or path.lower().endswith(("readme.md", "readme.rst", "readme.txt")):
            continue
        score = _priority(path)
        if score is None or path in seen:
            continue
        seen.add(path)
        candidates.append((score, path))
    candidates.sort(key=lambda item: item[0])

    selected: list[str] = []
    used_groups: set[str] = set()
    for _, path in candidates:
        group = _selection_group(path)
        if group in used_groups:
            continue
        selected.append(path)
        used_groups.add(group)
        if len(selected) >= MAX_SELECTED_FILES:
            return selected

    for _, path in candidates:
        if path in selected:
            continue
        selected.append(path)
        if len(selected) >= MAX_SELECTED_FILES:
            break
    return selected


def _tree_text(tree: list[dict[str, object]]) -> str:
    paths: list[str] = []
    for item in tree:
        path = str(item.get("path") or "")
        if not path:
            continue
        depth = path.count("/") + 1
        if depth <= 5:
            suffix = "/" if item.get("type") == "tree" else ""
            paths.append(f"{path}{suffix}")
        if len(paths) >= MAX_TREE_LINES:
            break
    return "\n".join(paths)


def collect_evidence_pack(
    client: GitHubClient,
    full_name: str,
    *,
    default_branch: str,
) -> list[SourceDocument]:
    tree = client.get_tree(full_name, default_branch)
    documents: list[SourceDocument] = []

    tree_text = _tree_text(tree)
    if tree_text:
        documents.append(
            make_source_document(
                text=tree_text,
                source_url=f"https://github.com/{full_name}/tree/{default_branch}",
                ref=default_branch,
                document_type="repository_tree",
            )
        )

    for path in select_evidence_paths(tree):
        result = client.get_text_file(full_name, path, ref=default_branch)
        if not result:
            continue
        text, source_url, ref = result
        documents.append(
            make_source_document(
                text=text,
                source_url=source_url,
                ref=ref,
                document_type=_document_type(path),
            )
        )

    return documents
