"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type {
  DecisionEventType,
  DecisionReadinessStage,
  DecisionSurface,
} from "@/lib/decision-analytics";

const SESSION_KEY = "thingso_decision_session_v1";

type EventContext = {
  eventType: DecisionEventType;
  sourceSurface: DecisionSurface;
  repositoryFullName?: string | null;
  useCaseSlug?: string | null;
  readinessStage?: DecisionReadinessStage | null;
};

export function getDecisionSessionId(): string | null {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return null;
  }
}

export function recordDecisionClientEvent(context: EventContext): void {
  const anonymousSessionId = getDecisionSessionId();
  if (!anonymousSessionId) return;
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymousSessionId, ...context }),
    keepalive: true,
  }).catch(() => {
    // Product analytics must never block a decision action.
  });
}

export function DecisionLink({
  href,
  children,
  className,
  eventType,
  sourceSurface,
  repositoryFullName,
  useCaseSlug,
  readinessStage,
  title,
}: EventContext & {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      title={title}
      data-decision-tracked="true"
      onClick={() => recordDecisionClientEvent({
        eventType,
        sourceSurface,
        repositoryFullName,
        useCaseSlug,
        readinessStage,
      })}
    >
      {children}
    </Link>
  );
}

export function DecisionDetails({
  children,
  className,
  eventType,
  sourceSurface,
  repositoryFullName,
  useCaseSlug,
  readinessStage,
}: EventContext & { children: ReactNode; className?: string }) {
  return (
    <details
      className={className}
      data-decision-tracked="true"
      onToggle={(event) => {
        if (event.currentTarget.open) {
          recordDecisionClientEvent({
            eventType,
            sourceSurface,
            repositoryFullName,
            useCaseSlug,
            readinessStage,
          });
        }
      }}
    >
      {children}
    </details>
  );
}
