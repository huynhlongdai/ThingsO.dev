from __future__ import annotations

import copy
import re
from dataclasses import dataclass, field

from .evidence import EvidenceBuilder

DEPTH_MODEL = "evidence-depth-editorial-v1"
DEPTH_PROMPT_VERSION = "manual-intelligence-v3-evidence-depth-v1"
DEPTH_REVIEW_MODEL = "deterministic-evidence-depth-review-v1"

_HEADING = re.compile(r"^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$")
_LINK = re.compile(r"!?\[([^\]]*)\]\([^)]*\)")
_HTML = re.compile(r"<[^>]+>")
_SPACE = re.compile(r"\s+")
_NON_WORD = re.compile(r"[^a-z0-9]+")
_SENTENCE_SPLIT = re.compile(r"(?<=[.!?])\s+")

_ARCHITECTURE_KEYS = (
    "architecture",
    "system design",
    "internals",
    "execution model",
    "implementation details",
    "framework",
)
_COMPONENT_CUES = (
    "agent",
    "analyst",
    "team",
    "manager",
    "service",
    "component",
    "worker",
    "server",
    "client",
    "module",
    "pipeline",
    "engine",
    "gateway",
    "controller",
    "scheduler",
    "trader",
    "risk",
)
_PERSISTENCE_KEYS = (
    "persistence",
    "checkpoint",
    "recovery",
    "state management",
    "storage",
)
_LIMITATION_CUES = (
    "not intended",
    "research purposes",
    "not suitable",
    "not recommended",
    "do not use",
    "should not be used",
    "performance may vary",
)
_POOR_FIT_CUES = (
    "not intended",
    "not suitable",
    "do not use",
    "should not be used",
)


@dataclass
class MarkdownSection:
    level: int
    title: str
    key: str
    ancestors: tuple[str, ...]
    lines: list[str] = field(default_factory=list)


def _clean(value: str) -> str:
    text = _LINK.sub(r"\1", value)
    text = _HTML.sub(" ", text)
    text = text.replace("`", "").replace("**", "").replace("__", "")
    text = text.lstrip("> ")
    return _SPACE.sub(" ", text).strip(" -:#|\t")


def _normalize(value: str) -> str:
    return _NON_WORD.sub(" ", value.lower()).strip()


def _sentences(lines: list[str], *, limit: int = 4) -> list[str]:
    result: list[str] = []
    for raw in lines:
        text = _clean(raw)
        if len(text) < 18:
            continue
        for part in _SENTENCE_SPLIT.split(text):
            sentence = _clean(part)
            if not 18 <= len(sentence) <= 600:
                continue
            if sentence not in result:
                result.append(sentence)
            if len(result) >= limit:
                return result
    return result


def parse_markdown_sections(markdown: str) -> list[MarkdownSection]:
    sections: list[MarkdownSection] = []
    stack: list[tuple[int, str]] = []
    current: MarkdownSection | None = None
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
            level = len(heading.group(1))
            title = _clean(heading.group(2))
            key = _normalize(title)
            while stack and stack[-1][0] >= level:
                stack.pop()
            current = MarkdownSection(
                level=level,
                title=title,
                key=key,
                ancestors=tuple(item[1] for item in stack),
            )
            sections.append(current)
            stack.append((level, key))
            continue

        cleaned = _clean(line)
        if current is not None and cleaned:
            current.lines.append(cleaned)

    return sections


def _matches(value: str, keywords: tuple[str, ...]) -> bool:
    return any(keyword in value for keyword in keywords)


def _paragraph(section: MarkdownSection, *, limit: int = 3) -> str | None:
    sentences = _sentences(section.lines, limit=limit)
    if not sentences:
        return None
    return " ".join(sentences)[:1600]


def _dedupe(items: list[str], *, limit: int) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for item in items:
        cleaned = _clean(item)
        key = _normalize(cleaned)
        if len(cleaned) < 12 or not key or key in seen:
            continue
        seen.add(key)
        result.append(cleaned)
        if len(result) >= limit:
            break
    return result


def _explicit_limitations(markdown: str) -> list[str]:
    lines: list[str] = []
    in_fence = False
    for raw in markdown.splitlines():
        line = raw.rstrip()
        if line.lstrip().startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence or _HEADING.match(line):
            continue
        cleaned = _clean(line)
        if cleaned:
            lines.append(cleaned)

    matches: list[str] = []
    for sentence in _sentences(lines, limit=200):
        normalized = _normalize(sentence)
        if _matches(normalized, _LIMITATION_CUES):
            matches.append(sentence)
    return _dedupe(matches, limit=8)


def _known_claim(value: str, *, confidence: float = 0.9) -> dict[str, object]:
    return {
        "value": value,
        "state": "known",
        "confidence": confidence,
        "evidence": ["readme"],
    }


def _is_unknown_claim(raw: object) -> bool:
    if not isinstance(raw, dict):
        return True
    return not str(raw.get("value") or "").strip() or raw.get("state") == "unknown"


def enhance_profile_from_markdown(profile: dict[str, object], markdown: str) -> dict[str, object]:
    if not markdown.strip():
        return profile

    result = copy.deepcopy(profile)
    sections = parse_markdown_sections(markdown)
    architecture_roots = [section for section in sections if _matches(section.key, _ARCHITECTURE_KEYS)]

    architecture = dict(result.get("architecture") or {})
    existing_overview = str(architecture.get("overview") or "")
    overview_missing = not existing_overview or "not established" in existing_overview.lower()
    root_overview = next((text for section in architecture_roots if (text := _paragraph(section))), None)
    if overview_missing and root_overview:
        architecture["overview"] = root_overview

    components = list(architecture.get("components") or [])
    if not components and architecture_roots:
        component_items: list[dict[str, object]] = []
        root_keys = {section.key for section in architecture_roots}
        for section in sections:
            if not any(ancestor in root_keys for ancestor in section.ancestors):
                continue
            if not _matches(section.key, _COMPONENT_CUES):
                continue
            responsibility = _paragraph(section, limit=2)
            if not responsibility:
                continue
            component_items.append(
                {
                    "name": section.title[:120],
                    "responsibility": responsibility[:600],
                    "evidence": ["readme"],
                }
            )
            if len(component_items) >= 10:
                break
        if component_items:
            architecture["components"] = component_items
            components = component_items

    persistence_section = next(
        (section for section in sections if _matches(section.key, _PERSISTENCE_KEYS) and _paragraph(section)),
        None,
    )
    persistence_text = _paragraph(persistence_section) if persistence_section else None
    if persistence_text and _is_unknown_claim(architecture.get("persistence_model")):
        architecture["persistence_model"] = _known_claim(persistence_text)

    architecture_evidence = list(architecture.get("evidence") or [])
    if (root_overview or components or persistence_text) and "readme" not in architecture_evidence:
        architecture_evidence.append("readme")
    architecture["evidence"] = architecture_evidence
    result["architecture"] = architecture

    if persistence_text:
        deployment = dict(result.get("deployment_operations") or {})
        if _is_unknown_claim(deployment.get("failure_recovery")) and (
            "recovery" in persistence_section.key or "checkpoint" in persistence_section.key
        ):
            deployment["failure_recovery"] = _known_claim(persistence_text, confidence=0.86)
        result["deployment_operations"] = deployment

    derived_capabilities: list[str] = []
    if root_overview:
        derived_capabilities.extend(_sentences([root_overview], limit=4))
    for component in components:
        if not isinstance(component, dict):
            continue
        name = str(component.get("name") or "").strip()
        responsibility = str(component.get("responsibility") or "").strip()
        if name and responsibility:
            derived_capabilities.append(f"{name}: {responsibility}")
    result["capabilities"] = _dedupe(
        [*list(result.get("capabilities") or []), *derived_capabilities],
        limit=24,
    )

    limitations = _explicit_limitations(markdown)
    if limitations:
        result["limitations"] = _dedupe(
            [*list(result.get("limitations") or []), *limitations],
            limit=20,
        )
        poor_fit = [
            item
            for item in limitations
            if _matches(_normalize(item), _POOR_FIT_CUES)
        ]
        if poor_fit:
            audience = dict(result.get("audience") or {})
            audience["poor_fit"] = _dedupe(
                [*list(audience.get("poor_fit") or []), *poor_fit],
                limit=12,
            )
            result["audience"] = audience

            decision = dict(result.get("decision") or {})
            decision["avoid_when"] = _dedupe(
                [*list(decision.get("avoid_when") or []), *poor_fit],
                limit=16,
            )
            result["decision"] = decision

    section_confidence = dict(result.get("section_confidence") or {})
    architecture_depth = bool(root_overview) + bool(components) + bool(persistence_text)
    if architecture_depth:
        depth_confidence = 0.76 + 0.05 * architecture_depth
        current = section_confidence.get("architecture")
        current_value = float(current) if isinstance(current, (int, float)) else 0.0
        section_confidence["architecture"] = round(max(current_value, min(depth_confidence, 0.91)), 4)
    result["section_confidence"] = section_confidence

    return result


def enhance_quality_entry(database_url: str, entry: dict[str, object]) -> dict[str, object]:
    full_name = str(entry.get("full_name") or "")
    raw_profile = entry.get("profile")
    if not full_name or not isinstance(raw_profile, dict):
        return entry

    bundle = EvidenceBuilder(database_url, max_source_chars=36_000).load_by_full_name(full_name)
    readme = next(
        (
            document.sanitized.text
            for document in bundle.documents
            if document.document_type == "readme"
        ),
        "",
    )
    return {
        "full_name": full_name,
        "profile": enhance_profile_from_markdown(dict(raw_profile), readme),
    }
