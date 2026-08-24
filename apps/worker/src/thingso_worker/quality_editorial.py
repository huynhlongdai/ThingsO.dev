from __future__ import annotations

import re
from difflib import SequenceMatcher
from pathlib import Path

from .editorial_baseline import generate_editorial_draft, load_seed_rows
from .editorial_use_cases import use_cases_for_category
from .evidence import EvidenceBuilder, EvidenceBundle
from .intelligence_compiler import compile_editorial_profile
from .intelligence_models import RepositoryIntelligenceProfileV3

QUALITY_PROMPT_VERSION = "manual-intelligence-v3-quality-v2"
QUALITY_MODEL = "evidence-editorial-quality-v2"

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
    matched: list[list[str]] = []
    for heading, lines in sections.items():
        if any(keyword in heading for keyword in keywords):
            matched.append(lines)
    return matched


def _sentences(lines: list[str], *, limit: int = 6) -> list[str]:
    candidates: list[str] = []
    for line in lines:
        bullet = _BULLET.match(line)
        text = _clean(bullet.group(1) if bullet else line)
        if len(text) < 18 or text.lower().startswith(("http://", "https://")):
            continue
        parts = re.split(r"(?<=[.!?])\s+", text)
        for part in parts:
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
    unique: list[str] = []
    for item in items:
        if not any(similarity(item, existing) >= 0.92 for existing in unique):
            unique.append(item)
        if len(unique) >= limit:
            break
    return unique


def _paragraph_for(sections: dict[str, list[str]], keywords: tuple[str, ...]) -> str | None:
    items = _items_for(sections, keywords, limit=3)
    if not items:
        return None
    return " ".join(items)[:1200]


def _intro(sections: dict[str, list[str]]) -> str | None:
    items = _sentences(sections.get("intro", []), limit=3)
    if not items:
        return None
    return " ".join(items)[:1200]


def _description(bundle: EvidenceBundle) -> str:
    description = str(bundle.facts.get("description") or "").strip().rstrip(".")
    if description:
        return description
    return f"{bundle.full_name} is an open-source repository"


def _implementation_signal(profile: RepositoryIntelligenceProfileV3, bundle: EvidenceBundle) -> str:
    language = str(bundle.facts.get("primary_language") or "").strip()
    tech = [item.name for item in profile.technology.items if item.name][:4]
    paths = [item.path for item in profile.codebase.important_paths if item.path][:3]
    parts: list[str] = []
    if language:
        parts.append(f"primary language {language}")
    if tech:
        parts.append("captured technology " + ", ".join(tech))
    if paths:
        parts.append("important paths " + ", ".join(paths))
    if not parts:
        types = sorted({document.document_type for document in bundle.documents})
        parts.append("captured evidence types " + ", ".join(types[:6]))
    return "Current implementation evidence: " + "; ".join(parts) + "."


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


def _semantic_profile(bundle: EvidenceBundle, category: str) -> RepositoryIntelligenceProfileV3:
    description = _description(bundle)
    draft = generate_editorial_draft(
        full_name=bundle.full_name,
        category=category,
        description=description,
    )
    draft.use_cases = use_cases_for_category(category)
    base = compile_editorial_profile(bundle, draft)

    sections = _sections(_readme(bundle))
    explicit_problem = _paragraph_for(sections, ("problem", "motivation", "challenge", "pain point"))
    pain_candidates = _items_for(sections, ("problem", "challenge", "pain point", "limitation"), limit=8)
    problem_statement = explicit_problem or f"Repository-stated scope: {description}."
    pain_points = _distinct(pain_candidates, against=[problem_statement], limit=6)

    solution = _paragraph_for(sections, ("how it works", "how it work", "overview", "approach", "workflow"))
    if not solution:
        solution = _intro(sections)
    if not solution or similarity(solution, problem_statement) >= 0.80:
        signal = _implementation_signal(base, bundle)
        solution = f"The current repository evidence implements the stated scope with {signal.removeprefix('Current implementation evidence: ').rstrip('.')} ."
        solution = solution.replace("  ", " ").replace(" .", ".")

    why = _paragraph_for(sections, ("why use", "why choose", "why ", "motivation", "benefit"))
    if why and similarity(why, problem_statement) >= 0.80:
        why = None

    explicit_diff = _items_for(
        sections,
        ("why choose", "why use", "advantages", "advantage", "different", "comparison", "versus", " vs "),
        limit=6,
    )
    repo_characteristics = _distinct(
        [
            *explicit_diff,
            f"Repository-stated scope: {description}.",
            _implementation_signal(base, bundle),
        ],
        limit=6,
    )
    while len(repo_characteristics) < 2:
        repo_characteristics.append(
            f"Current evidence pack for {bundle.full_name} contains {len(bundle.documents)} captured source documents."
        )

    unique_capabilities = _distinct(
        _items_for(sections, ("unique", "why choose", "advantages", "differentiator"), limit=6),
        against=repo_characteristics,
        limit=6,
    )
    design_philosophy = _distinct(
        _items_for(sections, ("design principle", "design philosophy", "principle", "philosophy"), limit=6),
        limit=6,
    )
    design_tradeoffs = _distinct(
        _items_for(sections, ("trade off", "tradeoff", "limitation", "caveat", "known issue"), limit=6),
        against=pain_points,
        limit=6,
    )

    feature_items = _distinct(
        _items_for(sections, ("features", "feature", "capabilities", "what it does", "what can"), limit=12),
        limit=12,
    )
    limitation_items = _distinct(
        _items_for(sections, ("limitations", "limitation", "caveat", "known issue"), limit=10),
        limit=10,
    )

    problem = base.problem.model_copy(
        update={
            "problem_statement": problem_statement,
            "pain_points": pain_points,
            "solution_approach": solution,
            "why_it_matters": why,
            "evidence": ["readme", "repository_snapshot"],
        }
    )
    differentiation = base.differentiation.model_copy(
        update={
            "differentiators": repo_characteristics,
            "design_philosophy": design_philosophy,
            "unique_capabilities": unique_capabilities,
            "tradeoffs_created_by_design": design_tradeoffs,
            "evidence": ["readme", "repository_snapshot"],
        }
    )

    problem_confidence = 0.88 if explicit_problem else 0.72
    differentiation_confidence = 0.84 if explicit_diff else 0.66
    section_confidence = dict(base.section_confidence)
    section_confidence.update(
        {
            "problem": problem_confidence,
            "differentiation": differentiation_confidence,
            "audience": min(section_confidence.get("audience") or 0.62, 0.62),
            "decision": min(section_confidence.get("decision") or 0.64, 0.64),
        }
    )

    capabilities = feature_items if len(feature_items) >= 3 else base.capabilities
    limitations = limitation_items if len(limitation_items) >= 2 else base.limitations

    return base.model_copy(
        update={
            "problem": problem,
            "differentiation": differentiation,
            "capabilities": capabilities,
            "limitations": limitations,
            "section_confidence": section_confidence,
            "confidence": 0.74,
        }
    )


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
    ):
        for i, left in enumerate(items):
            for j, right in enumerate(items[i + 1 :], start=i + 1):
                if similarity(left, right) >= 0.90:
                    issues.append(f"{field_name}[{i}]/{field_name}[{j}] are duplicates")

    forbidden = (
        "its curated role in the thingso catalog",
        "exact implementation differentiation is verified",
    )
    for item in [
        *profile.differentiation.differentiators,
        *profile.differentiation.unique_capabilities,
    ]:
        normalized = item.lower()
        if any(phrase in normalized for phrase in forbidden):
            issues.append("category-template boilerplate leaked into repository differentiation")

    return list(dict.fromkeys(issues))


def generate_quality_entries(database_url: str, seed_path: str | Path) -> list[dict[str, object]]:
    builder = EvidenceBuilder(database_url, max_source_chars=36_000)
    entries: list[dict[str, object]] = []
    failures: list[str] = []

    for row in load_seed_rows(seed_path):
        full_name = row["full_name"]
        bundle = builder.load_by_full_name(full_name)
        profile = _semantic_profile(bundle, row["category"])
        issues = quality_issues(profile)
        if issues:
            failures.append(f"{full_name}: {'; '.join(issues)}")
            continue
        entries.append(
            {
                "full_name": full_name,
                "profile": profile.model_dump(mode="json"),
            }
        )

    if failures:
        raise ValueError("Repository intelligence quality gate failed:\n" + "\n".join(failures))
    if len(entries) != 100:
        raise ValueError(f"Expected 100 quality profiles, generated {len(entries)}")
    return entries
