# Project Health Score — v1

Version: `health-v1`

The ThingsO Project Health Score is deterministic evidence about project health. It is **not** a universal software-quality score and must not be used as a substitute for use-case fit, security review or license/legal analysis.

## Weighting

| Dimension | Weight |
|---|---:|
| Maintenance | 25% |
| Adoption | 15% |
| Community | 15% |
| Documentation | 15% |
| Release / operations | 10% |
| License clarity | 5% |
| Maturity | 10% |
| Metadata completeness | 5% |

## Signals

- Maintenance: recency of the latest source push; archived repositories receive zero maintenance points.
- Adoption: log-normalized stars and forks so extremely popular repositories do not dominate linearly.
- Community: contributors, subscribers and forks when available.
- Documentation: README presence, description and project homepage.
- Operations: release count and latest release recency.
- License clarity: detected SPDX metadata. Missing or ambiguous metadata lowers clarity; ThingsO does not infer legal suitability.
- Maturity: project age, capped at three years. This measures history, not activity.
- Metadata: description, primary language and default branch completeness.

## Important limitations

Different project types have different healthy activity patterns. `health-v1` intentionally starts with transparent global rules so ThingsO can benchmark and audit behavior. Category-aware normalization may become `health-v2` after sufficient historical data exists.

The score must always be shown with its component breakdown and version in APIs/data. Fit to a user query is a separate signal.
