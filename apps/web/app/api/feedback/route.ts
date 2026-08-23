import { NextRequest, NextResponse } from "next/server";
import { recordFeedback } from "@/lib/data";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const entityType = typeof input.entityType === "string" ? input.entityType.trim() : "";
  const entityId = typeof input.entityId === "string" ? input.entityId.trim() : "";
  const feedbackType = typeof input.feedbackType === "string" ? input.feedbackType.trim() : "";
  if (!entityType || !uuidPattern.test(entityId) || !feedbackType) {
    return NextResponse.json({ error: "entityType, UUID entityId and feedbackType are required" }, { status: 400 });
  }
  const payload = input.payload && typeof input.payload === "object" && !Array.isArray(input.payload)
    ? input.payload as Record<string, unknown>
    : {};
  await recordFeedback({
    entityType,
    entityId,
    feedbackType,
    payload,
    sessionId: request.cookies.get("thingso_session")?.value,
  });
  return NextResponse.json({ accepted: true }, { status: 202 });
}
