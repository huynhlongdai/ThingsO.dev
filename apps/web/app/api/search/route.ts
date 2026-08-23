import { NextRequest, NextResponse } from "next/server";
import { recordSearchQuery, searchRepositories } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 30);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 30;
  const results = await searchRepositories(query, limit);
  if (query) {
    try {
      await recordSearchQuery(query, results.length, request.cookies.get("thingso_session")?.value);
    } catch {
      // Search analytics are best effort.
    }
  }
  return NextResponse.json({ query, count: results.length, results });
}
