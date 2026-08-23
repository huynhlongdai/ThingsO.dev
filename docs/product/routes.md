# ThingsO V1 Route Contract

## Public routes

| Route | Purpose | Indexable by default |
|---|---|---|
| `/` | Intent-search homepage | Yes |
| `/search?q=` | Interactive search results | No |
| `/discover` | Curated discovery | Conditional |
| `/categories/{slug}` | Capability/category browse | Quality-gated |
| `/use-cases/{slug}` | Use-case decision page | Quality-gated |
| `/repos/{owner}/{name}` | Repository intelligence | Quality-gated |
| `/compare?repos=` | Interactive comparison | No; stable editorial comparisons may get canonical routes later |
| `/ideas` | Reviewed Build Ideas index | Conditional |
| `/ideas/{slug}` | Build Idea detail | Quality-gated |
| `/about/methodology` | Score/provenance methodology | Yes |

## API prefix

`/api/v1`

Initial endpoints:

- `GET /api/v1/search`
- `GET /api/v1/repositories/{owner}/{name}`
- `GET /api/v1/repositories/{owner}/{name}/alternatives`
- `GET /api/v1/categories/{slug}`
- `GET /api/v1/use-cases/{slug}`
- `GET /api/v1/build-ideas/{slug}`
- `POST /api/v1/feedback`

Admin endpoints live under `/api/v1/admin/*` and require server-side authorization.

## Canonical policy

- Repository canonical URL uses current canonical GitHub owner/name.
- Historical renamed paths must redirect to canonical where identity can be proven.
- Search/filter URLs are product surfaces, not programmatic SEO pages.
- No page becomes indexable solely because it exists in the database.
