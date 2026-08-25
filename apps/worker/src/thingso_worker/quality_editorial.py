from __future__ import annotations

import re
from difflib import SequenceMatcher
from pathlib import Path

from .ai_models import ReviewIssue
from .editorial_baseline import CATEGORY_OVERRIDES, TEMPLATES, load_seed_rows
from .editorial_use_cases import use_cases_for_category
from .evidence import EvidenceBuilder, EvidenceBundle
from .intelligence_compiler import _codebase, _developer_workflow, _technology
from .intelligence_models import (
    ArchitectureV3,
    AudienceFitV3,
    DecisionGuideV3,
    DeploymentOperationsV3,
    DifferentiationV3,
    IntegrationExtensionV3,
    IntelligenceClaim,
    LearningIntelligenceV3,
    ProblemIntelligenceV3,
    ProjectSignalsV3,
    RepositoryIdentityV3,
    RepositoryIntelligenceProfileV3,
    SecurityPrivacyV3,
)

QUALITY_PROMPT_VERSION = "manual-intelligence-v3-evidence-only-v1"
QUALITY_MODEL = "evidence-only-editorial-v1"

_HEADING = re.compile(r"^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$")
_BULLET = re.compile(r"^\s*(?:[-*+]\s+|\d+[.)]\s+)(.+)$")
_LINK = re.compile(r"!?\[([^\]]*)\]\([^)]*\)")
_HTML = re.compile(r"<[^>]+>")
_SPACE = re.compile(r"\s+")
_NON_WORD = re.compile(r"[^a-z0-9]+")


def _clean(value: str) -> str:
    text = _LINK.sub(r"\1", value)
    text = _HTML.sub(" ", text)
    text = text.replace("`", "").replace("**", "").replace("__", "")
    text = _SPACE.sub(" ", text).strip(" -:#|\t")
    return text


def _normalize(value: str) -> str:
    return _NON_WORD.sub(" ", value.lower()).strip()


def similarity(left: str, right: str) -> float:
    a = _normalize(left)
    b = _normalize(right)
    if not a or not b:
        return 0.0
    if a == b:
        return 1.0
    return SequenceMatcher(None, a, b).ratio()


def _readme(bundle: EvidenceBundle) -> str:
    for document in bundle.documents:
        if document.document_type == "readme":
            return document.sanitized.text
    return ""


def _sections(markdown: str) -> dict[str, list[str]]:
    result: dict[str, list[str]] = {"intro": []}
    current = "intro"
    in_fence = False
    for raw in markdown.splitlines():
        line = raw.rstrip()
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        heading = _HEADING.match(line)
        if heading:
            current = _normalize(_clean(heading.group(1))) or "section"
            result.setdefault(current, [])
            continue
        cleaned = _clean(line)
        if cleaned:
            result.setdefault(current, []).append(cleaned)
    return result


def _matching_sections(sections: dict[str, list[str]], keywords: tuple[str, ...]) -> list[list[str]]:
    return [
        lines
        for heading, lines in sections.items()
        if any(keyword in heading for keyword in keywords)
    ]


def _sentences(lines: list[str], *, limit: int = 6) -> list[str]:
    candidates: list[str] = []
    for line in lines:
        bullet = _BULLET.match(line)
        text = _clean(bullet.group(1) if bullet else line)
        if len(text) < 18 or text.lower().startswith(("http://", "https://")):
            continue
        for part in re.split(r"(?<=[.!?])\s+", text):
            item = _clean(part)
            if 18 <= len(item) <= 360:
                candidates.append(item)
    unique: list[str] = []
    for item in candidates:
        if not any(similarity(item, existing) >= 0.92 for existing in unique):
            unique.append(item)
        if len(unique) >= limit:
            break
    return unique


def _items_for(sections: dict[str, list[str]], keywords: tuple[str, ...], *, limit: int = 6) -> list[str]:
    items: list[str] = []
    for lines in _matching_sections(sections, keywords):
        items.extend(_sentences(lines, limit=limit))
        if len(items) >= limit:
            break
    return _distinct(items, limit=limit)


def _paragraph_for(sections: dict[str, list[str]], keywords: tuple[str, ...]) -> str | None:
    items = _items_for(sections, keywords, limit=3)
    return " ".join(items)[:1200] if items else None


def _description(bundle: EvidenceBundle) -> str:
    description = str(bundle.facts.get("description") or "").strip().rstrip(".")
    return description or f"{bundle.full_name} is an open-source repository"


def _distinct(items: list[str], *, against: list[str] | None = None, limit: int = 8) -> list[str]:
    result: list[str] = []
    blockers = list(against or [])
    for raw in items:
        item = _clean(raw)
        if len(item) < 12:
            continue
        if any(similarity(item, existing) >= 0.84 for existing in [*blockers, *result]):
            continue
        result.append(item)
        if len(result) >= limit:
            break
    return result


def _claim(
    value: str | None = None,
    *,
    state: str = "unknown",
    confidence: float | None = None,
    evidence: list[str] | None = None,
) -> IntelligenceClaim:
    if not value:
        return IntelligenceClaim()
    return IntelligenceClaim(
        value=value,
        state=state if state in {"known", "inferred", "conflicting"} else "inferred",
        confidence=confidence,
        evidence=evidence or [],
    )


def _implementation_summary(bundle: EvidenceBundle, profile_technology, codebase) -> str:
    language = str(bundle.facts.get("primary_language") or "").strip()
    technology = [
        item.name
        for item in profile_technology.items
        if item.name and item.name != "Repository-defined runtime"
    ][:4]
    paths = [item.path for item in codebase.important_paths if item.path][:4]
    details: list[str] = []
    if language:
        details.append(f"primary language {language}")
    if technology:
        details.append("captured technology " + ", ".join(technology))
    if paths:
        details.append("visible code areas " + ", ".join(paths))
    if details:
        return "The repository implements its stated scope with " + "; ".join(details) + "."
    return (
        "The bounded evidence pack establishes the repository scope but does not establish "
        "a more specific implementation approach."
    )


def _project_signals(bundle: EvidenceBundle) -> ProjectSignalsV3:
    stars = int(bundle.facts.get("stars") or 0)
    forks = int(bundle.facts.get("forks") or 0)
    owner = str(bundle.facts.get("owner") or bundle.full_name.split("/", 1)[0])
    license_spdx = bundle.facts.get("license_spdx")
    pushed_at = bundle.facts.get("pushed_at_source")
    archived = bool(bundle.facts.get("is_archived"))

    return ProjectSignalsV3(
        maturity=_claim(
            "GitHub marks this repository as archived."
            if archived
            else None,
            state="known",
            confidence=0.98 if archived else None,
            evidence=["repository_snapshot"] if archived else [],
        ),
        governance=_claim(
            f"The current repository owner is `{owner}`; governance and decision rights are not established by this fact alone.",
            state="known",
            confidence=0.98,
            evidence=["repository_snapshot"],
        ),
        licensing=_claim(
            f"GitHub reports SPDX license `{license_spdx}`; verify the repository license text for the intended use."
            if license_spdx
            else None,
            state="known",
            confidence=0.98 if license_spdx else None,
            evidence=["repository_snapshot"] if license_spdx else [],
        ),
        adoption_signals=[
            f"GitHub snapshot: {stars:,} stars",
            f"GitHub snapshot: {forks:,} forks",
        ],
        ecosystem=[],
        evolution=[f"Current snapshot pushed_at: {pushed_at}"] if pushed_at else [],
        evidence=["repository_snapshot"],
    )


def _deployment(bundle: EvidenceBundle, technology) -> DeploymentOperationsV3:
    types = {document.document_type for document in bundle.documents}
    has_container = "container" in types
    required_services = [
        item.name
        for item in technology.items
        if item.category in {"database", "cache/queue", "runtime"}
        and item.name != "Repository-defined runtime"
    ][:12]

    configuration = _claim(
        "Captured configuration evidence is present; inspect the repository-specific files for exact runtime keys and defaults."
        if "configuration" in types
        else None,
        state="known",
        confidence=0.86,
        evidence=["configuration"] if "configuration" in types else [],
    )
    return DeploymentOperationsV3(
        minimum_deployment=_claim(
            "Captured container configuration establishes a container-based build or deployment path."
            if has_container
            else None,
            state="known",
            confidence=0.90,
            evidence=["container"] if has_container else [],
        ),
        production_topology=IntelligenceClaim(),
        required_services=required_services,
        persistence=IntelligenceClaim(),
        configuration=configuration,
        scaling=IntelligenceClaim(),
        observability=IntelligenceClaim(),
        backup_upgrade=IntelligenceClaim(),
        failure_recovery=IntelligenceClaim(),
        resource_profile=IntelligenceClaim(),
        operational_risks=[],
        evidence=[item for item in ("container" if has_container else None, "configuration" if "configuration" in types else None) if item],
    )


def _security(bundle: EvidenceBundle) -> SecurityPrivacyV3:
    has_security = any(document.document_type == "security" for document in bundle.documents)
    return SecurityPrivacyV3(
        evidence=["security"] if has_security else [],
    )


def _semantic_profile(bundle: EvidenceBundle, category: str) -> RepositoryIntelligenceProfileV3:
    canonical_category = CATEGORY_OVERRIDES.get(bundle.full_name, category)
    description = _description(bundle)
    sections = _sections(_readme(bundle))

    technology = _technology(bundle)
    technology = technology.model_copy(
        update={
            "items": [
                item for item in technology.items if item.name != "Repository-defined runtime"
            ]
        }
    )
    codebase = _codebase(bundle)
    developer = _developer_workflow(bundle)
    if not developer.commands:
        developer = developer.model_copy(update={"local_setup": IntelligenceClaim()})

    explicit_problem = _paragraph_for(sections, ("problem", "motivation", "challenge", "pain point"))
    problem_statement = explicit_problem or f"Repository-stated scope for {bundle.full_name}: {description}."
    pain_points = _distinct(
        _items_for(sections, ("pain point", "challenge", "problem"), limit=8),
        against=[problem_statement],
        limit=6,
    )
    solution = _paragraph_for(sections, ("how it works", "how it work", "approach", "workflow"))
    if not solution or similarity(solution, problem_statement) >= 0.80:
        solution = _implementation_summary(bundle, technology, codebase)
    why = _paragraph_for(sections, ("why use", "why choose", "motivation", "benefit"))
    if why and similarity(why, problem_statement) >= 0.80:
        why = None

    differentiators = _distinct(
        _items_for(
            sections,
            ("why choose", "why use", "advantages", "advantage", "different", "comparison", "versus", " vs "),
            limit=8,
        ),
        limit=6,
    )
    unique_capabilities = _distinct(
        _items_for(sections, ("unique", "differentiator", "why choose"), limit=8),
        against=differentiators,
        limit=6,
    )
    design_philosophy = _distinct(
        _items_for(sections, ("design principle", "design philosophy", "principle", "philosophy"), limit=6),
        limit=6,
    )
    tradeoffs = _distinct(
        _items_for(sections, ("trade off", "tradeoff", "limitation", "caveat", "known issue"), limit=8),
        against=pain_points,
        limit=8,
    )
    capabilities = _distinct(
        _items_for(sections, ("features", "key features", "capabilities", "what it does", "what can"), limit=16),
        against=[*differentiators, *unique_capabilities],
        limit=16,
    )
    limitations = _distinct(
        _items_for(sections, ("limitations", "limitation", "caveat", "known issue"), limit=12),
        limit=12,
    )

    target_users = _distinct(
        _items_for(sections, ("who should use", "who is this for", "target audience", "audience", "for whom"), limit=10),
        limit=10,
    )
    jobs = _distinct(
        _items_for(sections, ("use cases", "use case", "when to use", "applications"), limit=12),
        limit=12,
    )
    poor_fit = _distinct(
        _items_for(sections, ("when not", "not for", "not suitable", "avoid when"), limit=8),
        limit=8,
    )

    architecture_overview = _paragraph_for(
        sections,
        ("architecture", "system design", "internals", "execution model"),
    )
    architecture_evidence = ["readme", "repository_tree"] if architecture_overview else ["repository_tree"]
    data_flow = _distinct(
        _items_for(sections, ("data flow", "execution flow", "control flow"), limit=10),
        limit=10,
    )
    architecture = ArchitectureV3(
        overview=architecture_overview
        or "Architecture details are not established from the current bounded evidence pack.",
        style=IntelligenceClaim(),
        execution_model=IntelligenceClaim(),
        state_model=IntelligenceClaim(),
        components=[],
        data_flow=data_flow,
        control_flow=IntelligenceClaim(),
        persistence_model=IntelligenceClaim(),
        concurrency_model=IntelligenceClaim(),
        isolation_model=IntelligenceClaim(),
        scaling_model=IntelligenceClaim(),
        evidence=architecture_evidence,
    )

    extension_text = _paragraph_for(
        sections,
        ("extensions", "extension", "plugins", "plugin", "customization", "providers"),
    )
    integrations = _distinct(
        _items_for(sections, ("integrations", "integration"), limit=12),
        limit=12,
    )
    integration = IntegrationExtensionV3(
        extension_model=_claim(
            extension_text,
            state="inferred",
            confidence=0.78 if extension_text else None,
            evidence=["readme"] if extension_text else [],
        ),
        integrations=integrations,
        evidence=["readme", "repository_tree"] if extension_text or integrations else ["repository_tree"],
    )

    deployment = _deployment(bundle, technology)
    security = _security(bundle)
    project_signals = _project_signals(bundle)

    choose_when = jobs[:8]
    evaluate_first = _distinct(
        _items_for(sections, ("requirements", "prerequisites", "before you start", "considerations"), limit=8),
        limit=8,
    )
    decision = DecisionGuideV3(
        choose_when=choose_when,
        avoid_when=poor_fit,
        evaluate_first=evaluate_first,
        tradeoffs=tradeoffs,
        evidence=["readme"] if choose_when or poor_fit or evaluate_first or tradeoffs else [],
    )
    learning = LearningIntelligenceV3(
        reading_order=codebase.start_reading,
        evidence=["repository_tree"] if codebase.start_reading else [],
    )

    identity_definition = f"{bundle.full_name}: {description}."
    identity = RepositoryIdentityV3(
        definition=identity_definition[:900],
        product_type="Open-source repository",
        primary_role=description[:240],
        primary_category=canonical_category,
        secondary_categories=[category] if category != canonical_category else [],
        interaction_model=None,
        intended_scope=description[:300],
        evidence=["repository_snapshot", "readme"],
    )
    problem = ProblemIntelligenceV3(
        problem_statement=problem_statement[:1600],
        pain_points=pain_points,
        solution_approach=solution[:1600],
        why_it_matters=why[:1200] if why else None,
        evidence=["readme", "repository_snapshot"],
    )
    differentiation = DifferentiationV3(
        differentiators=differentiators,
        design_philosophy=design_philosophy,
        unique_capabilities=unique_capabilities,
        commodity_capabilities=[],
        tradeoffs_created_by_design=tradeoffs,
        evidence=["readme"] if differentiators or unique_capabilities or design_philosophy or tradeoffs else [],
    )
    audience = AudienceFitV3(
        target_users=target_users,
        team_profiles=[],
        skill_level=None,
        jobs_to_be_done=jobs,
        best_for=jobs[:8],
        poor_fit=poor_fit,
        evidence=["readme"] if target_users or jobs or poor_fit else [],
    )

    types = {document.document_type for document in bundle.documents}
    section_confidence: dict[str, float | None] = {
        "identity": 0.96 if bundle.facts.get("description") else 0.70,
        "problem": 0.88 if explicit_problem else 0.68,
        "differentiation": 0.84 if differentiators or unique_capabilities else None,
        "audience": 0.82 if target_users or jobs else None,
        "architecture": 0.84 if architecture_overview else None,
        "technology": 0.94 if technology.items else None,
        "codebase": 0.94 if codebase.important_paths else 0.70,
        "developer_workflow": 0.90 if developer.commands else (0.78 if "ci" in types else None),
        "integration": 0.80 if extension_text or integrations else None,
        "deployment_operations": 0.90 if "container" in types else (0.78 if "configuration" in types else None),
        "security_privacy": None,
        "project_signals": 0.98,
        "decision": 0.78 if choose_when or poor_fit or evaluate_first or tradeoffs else None,
        "learning": 0.90 if codebase.start_reading else None,
    }
    supported = [value for value in section_confidence.values() if value is not None]
    confidence = sum(supported) / len(supported) if supported else 0.60

    deployment_modes = ["container"] if "container" in types else []
    return RepositoryIntelligenceProfileV3(
        identity=identity,
        problem=problem,
        differentiation=differentiation,
        audience=audience,
        capabilities=capabilities,
        limitations=limitations,
        architecture=architecture,
        technology=technology,
        codebase=codebase,
        developer_workflow=developer,
        integration=integration,
        deployment_operations=deployment,
        security_privacy=security,
        project_signals=project_signals,
        decision=decision,
        learning=learning,
        deployment_modes=deployment_modes,
        interfaces=[],
        taxonomy_slugs=[canonical_category],
        use_cases=use_cases_for_category(canonical_category),
        relations=[],
        build_ideas=[],
        evidence=[],
        section_confidence=section_confidence,
        confidence=min(max(confidence, 0.0), 1.0),
    )


def _template_values() -> set[str]:
    values: set[str] = set()
    for template in TEMPLATES.values():
        scalar_values = (
            template.primary_role,
            template.problem,
            template.solution,
            template.architecture_style,
            template.execution_model,
            template.extension_model,
        )
        sequence_values = (
            template.users,
            template.jobs,
            template.best_for,
            template.poor_fit,
            template.capabilities,
            template.limitations,
            template.data_flow,
            template.tradeoffs,
        )
        values.update(_normalize(item) for item in scalar_values if item)
        for sequence in sequence_values:
            values.update(_normalize(item) for item in sequence if item)
    return {value for value in values if value}


_TEMPLATE_VALUES = _template_values()


def _semantic_strings(profile: RepositoryIntelligenceProfileV3) -> list[str]:
    strings = [
        profile.identity.primary_role,
        profile.problem.problem_statement,
        profile.problem.solution_approach,
        *profile.problem.pain_points,
        *profile.differentiation.differentiators,
        *profile.differentiation.design_philosophy,
        *profile.differentiation.unique_capabilities,
        *profile.differentiation.tradeoffs_created_by_design,
        *profile.audience.target_users,
        *profile.audience.jobs_to_be_done,
        *profile.audience.best_for,
        *profile.audience.poor_fit,
        *profile.capabilities,
        *profile.limitations,
        *profile.architecture.data_flow,
        *profile.integration.integrations,
        *profile.decision.choose_when,
        *profile.decision.avoid_when,
        *profile.decision.tradeoffs,
    ]
    for claim in (
        profile.architecture.style,
        profile.architecture.execution_model,
        profile.architecture.state_model,
        profile.integration.extension_model,
    ):
        if claim.value:
            strings.append(claim.value)
    return [item for item in strings if item]


def quality_issues(profile: RepositoryIntelligenceProfileV3) -> list[str]:
    issues: list[str] = []
    problem = profile.problem.problem_statement
    for index, pain in enumerate(profile.problem.pain_points):
        if similarity(problem, pain) >= 0.80:
            issues.append(f"problem/pain_points[{index}] are near-duplicates")

    for i, left in enumerate(profile.differentiation.differentiators):
        for j, right in enumerate(profile.differentiation.unique_capabilities):
            if similarity(left, right) >= 0.80:
                issues.append(f"differentiators[{i}]/unique_capabilities[{j}] are near-duplicates")

    for field_name, items in (
        ("differentiators", profile.differentiation.differentiators),
        ("unique_capabilities", profile.differentiation.unique_capabilities),
        ("pain_points", profile.problem.pain_points),
        ("capabilities", profile.capabilities),
        ("limitations", profile.limitations),
    ):
        for i, left in enumerate(items):
            for j, right in enumerate(items[i + 1 :], start=i + 1):
                if similarity(left, right) >= 0.90:
                    issues.append(f"{field_name}[{i}]/{field_name}[{j}] are duplicates")

    for item in _semantic_strings(profile):
        if _normalize(item) in _TEMPLATE_VALUES:
            issues.append("category-template semantic text leaked into public repository profile")
            break

    return list(dict.fromkeys(issues))


def evidence_only_review_issues(
    bundle: EvidenceBundle,
    profile: RepositoryIntelligenceProfileV3,
) -> list[ReviewIssue]:
    issues: list[ReviewIssue] = []
    doc_types = {document.document_type for document in bundle.documents}
    if "readme" not in doc_types:
        issues.append(ReviewIssue(severity="high", field="evidence", message="README evidence is missing."))
    if "repository_tree" not in doc_types:
        issues.append(ReviewIssue(severity="high", field="evidence", message="Repository tree evidence is missing."))
    if len(bundle.documents) < 3:
        issues.append(
            ReviewIssue(
                severity="high",
                field="evidence",
                message="Evidence-only V3 requires README, tree, and at least one additional technical document.",
            )
        )

    for message in quality_issues(profile):
        issues.append(ReviewIssue(severity="high", field="semantic_quality", message=message))

    if not profile.identity.definition or not profile.problem.problem_statement or not profile.problem.solution_approach:
        issues.append(
            ReviewIssue(
                severity="high",
                field="semantic_quality",
                message="Identity, repository scope/problem, and solution/implementation summary must remain present.",
            )
        )
    return issues


def generate_quality_entry(
    database_url: str,
    full_name: str,
    category: str,
    *,
    builder: EvidenceBuilder | None = None,
) -> dict[str, object]:
    evidence_builder = builder or EvidenceBuilder(database_url, max_source_chars=36_000)
    bundle = evidence_builder.load_by_full_name(full_name)
    profile = _semantic_profile(bundle, category)
    issues = quality_issues(profile)
    if issues:
        raise ValueError(f"{full_name}: {'; '.join(issues)}")
    return {"full_name": full_name, "profile": profile.model_dump(mode="json")}


def generate_quality_entries(database_url: str, seed_path: str | Path) -> list[dict[str, object]]:
    builder = EvidenceBuilder(database_url, max_source_chars=36_000)
    entries: list[dict[str, object]] = []
    failures: list[str] = []

    for row in load_seed_rows(seed_path):
        full_name = row["full_name"]
        try:
            entries.append(
                generate_quality_entry(
                    database_url,
                    full_name,
                    row["category"],
                    builder=builder,
                )
            )
        except ValueError as exc:
            failures.append(str(exc))

    if failures:
        raise ValueError("Repository intelligence evidence-only gate failed:\n" + "\n".join(failures))
    if len(entries) != 100:
        raise ValueError(f"Expected 100 evidence-only profiles, generated {len(entries)}")
    return entries
