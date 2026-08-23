# ADR-001 — Web Deployment

Status: Accepted for V1

## Context

ThingsO needs a server-rendered Next.js application, public API/BFF routes, simple operational visibility, and an easy path to background-worker/database connectivity. The launch dataset is expected to be hundreds to low-thousands of repositories, not internet scale.

## Options

1. Railway-hosted Next.js behind Cloudflare.
2. Cloudflare Workers/OpenNext from day one.
3. Kubernetes/container platform from day one.

## Decision

Deploy the web application as a standard Node.js Next.js service on Railway (or an equivalent simple container/runtime) behind Cloudflare DNS/WAF/CDN. Keep the application portable so an edge deployment can be evaluated later.

## Consequences

- Fastest path to a conventional Next.js runtime and Postgres connectivity.
- Cloudflare handles TLS, WAF and caching policy at the edge.
- The project avoids early edge-runtime compatibility constraints.
- A deployment adapter/revisit may be required if traffic patterns later justify edge compute.

## Revisit trigger

Revisit when edge latency, geographic traffic, cost, or runtime scaling shows a measurable benefit that outweighs migration complexity.
