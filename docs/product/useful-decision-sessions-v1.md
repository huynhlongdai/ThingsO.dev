# Useful Decision Sessions v1

Status: **frozen for curated-100 product measurement**.

ThingsO measures whether discovery leads to meaningful software decisions, not merely page views.

## North-star behavior

A **Useful Decision Session (UDS)** is an anonymous browser session with at least two distinct meaningful decision actions.

Meaningful actions include opening a repository from search or a reviewed use case, initiating or using comparison, attempting a blueprint, expanding repository evidence, or opening a reviewed build path. Feedback is measured separately and does not by itself make a session useful.

## Privacy contract

The browser creates a random UUID in `sessionStorage`. It expires with the browser session/tab lifecycle and is not an account identifier.

ThingsO decision events do **not** store:

- IP addresses;
- user-agent strings;
- email/account identifiers;
- browser fingerprints;
- arbitrary metadata/payload JSON;
- search query text in the decision-event table.

Repository names, use-case slugs, product surface and readiness stage are public/bounded product context only.

## Signals kept separate

- Cloudflare Web Analytics: aggregate traffic/website telemetry.
- `search_queries`: normalized search demand and zero-result measurement.
- `decision_events`: anonymous decision-funnel behavior.
- `feedback`: explicit product feedback.

These sources must not be silently joined into a user profile.

## Funnel metrics

The server-side metrics contract includes:

- anonymous sessions;
- Useful Decision Sessions and UDS rate;
- search/use-case result opens;
- compare initiation;
- compare-to-repository opens;
- blueprint attempts;
- evidence expansions;
- feedback submissions;
- zero-result rate from search demand.

Readiness distribution and stale-profile rate remain product/data-quality metrics and should be computed from current repository intelligence rather than user tracking.

## Reliability rule

Analytics is non-blocking. Failure to create a session or POST an event must never stop navigation, comparison, evidence reading, blueprint access or feedback.

Any material expansion of collected context requires a new version of this privacy/measurement contract.
