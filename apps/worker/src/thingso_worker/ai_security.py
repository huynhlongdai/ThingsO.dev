from __future__ import annotations

import re
from dataclasses import dataclass


_INJECTION_PATTERNS = (
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"ignore\s+(the\s+)?system\s+(message|prompt)", re.IGNORECASE),
    re.compile(r"reveal\s+(the\s+)?(system|developer)\s+(message|prompt)", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(chatgpt|an?\s+ai|the\s+system)", re.IGNORECASE),
    re.compile(r"<\s*/?\s*(system|assistant|developer)\s*>", re.IGNORECASE),
    re.compile(r"BEGIN\s+(SYSTEM|DEVELOPER)\s+PROMPT", re.IGNORECASE),
)


@dataclass(frozen=True)
class SanitizedEvidence:
    text: str
    suspicious: bool
    matched_rules: tuple[str, ...]
    original_chars: int
    retained_chars: int


def sanitize_untrusted_text(text: str, *, max_chars: int = 24000) -> SanitizedEvidence:
    """Bound and annotate untrusted repository text before it enters an LLM prompt.

    The source is evidence, never an instruction channel. Suspicious lines are retained as
    quoted evidence but prefixed so the model cannot mistake them for ThingsO instructions.
    """
    if max_chars < 1000:
        raise ValueError("max_chars must be at least 1000")

    normalized = text.replace("\x00", "").replace("\r\n", "\n").replace("\r", "\n")
    matched: list[str] = []
    safe_lines: list[str] = []

    for line in normalized.splitlines():
        line_suspicious = False
        for pattern in _INJECTION_PATTERNS:
            if pattern.search(line):
                line_suspicious = True
                matched.append(pattern.pattern)
        if line_suspicious:
            safe_lines.append(f"[UNTRUSTED-INSTRUCTION-LIKE-TEXT] {line}")
        else:
            safe_lines.append(line)

    safe_text = "\n".join(safe_lines).strip()
    if len(safe_text) > max_chars:
        safe_text = safe_text[:max_chars].rstrip() + "\n[TRUNCATED BY THINGSO]"

    unique_rules = tuple(dict.fromkeys(matched))
    return SanitizedEvidence(
        text=safe_text,
        suspicious=bool(unique_rules),
        matched_rules=unique_rules,
        original_chars=len(normalized),
        retained_chars=len(safe_text),
    )
