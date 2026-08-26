import { NextRequest, NextResponse } from "next/server";
import {
  decisionEventTypes,
  decisionSurfaces,
  readinessStages,
  recordDecisionEvent,
  type DecisionEventType,
  type DecisionReadinessStage,
  type DecisionSurface,
} from "@/lib/decision-analytics";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T) ? value as T : null;
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const anonymousSessionId = optionalText(input.anonymousSessionId, 80);
  const eventType = oneOf<DecisionEventType>(input.eventType, decisionEventTypes);
  const sourceSurface = oneOf<DecisionSurface>(input.sourceSurface, decisionSurfaces);
  const readinessStage = input.readinessStage === undefined || input.readinessStage === null
    ? null
    : oneOf<DecisionReadinessStage>(input.readinessStage, readinessStages);

  if (!anonymousSessionId || !uuidPattern.test(anonymousSessionId) || !eventType || !sourceSurface) {
    return NextResponse.json({ error: "Invalid session, event type or source surface" }, { status: 400 });
  }
  if (input.readinessStage !== undefined && input.readinessStage !== null && !readinessStage) {
    return NextResponse.json({ error: "Invalid readiness stage" }, { status: 400 });
  }

  await recordDecisionEvent({
    anonymousSessionId,
    eventType,
    sourceSurface,
    repositoryFullName: optionalText(input.repositoryFullName, 180),
    useCaseSlug: optionalText(input.useCaseSlug, 120),
    readinessStage,
  });
  return NextResponse.json({ accepted: true }, { status: 202 });
}
