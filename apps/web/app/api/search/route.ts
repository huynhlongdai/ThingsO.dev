import { NextRequest, NextResponse } from "next/server";
import { recordSearchQuery } from "@/lib/data";
import { searchRepositoriesV3 } from "@/lib/search-v3";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 200);
  const category = (request.nextUrl.searchParams.get("category") ?? "").trim();
  const healthValue = request.nextUrl.searchParams.get("health");
  const requestedHealth = healthValue ? Number(healthValue) : null;
  const minHealth = requestedHealth !== null && Number.isFinite(requestedHealth)
    ? requestedHealth
    : null;
  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? 30);
  const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 30;
  const results = await searchRepositoriesV3(query, limit, { category, minHealth });

  if (query) {
    try {
      await recordSearchQuery(query, results.length, request.cookies.get("thingso_session")?.value);
    } catch {
      // Search analytics are best effort.
    }
  }

  return NextResponse.json({
    query,
    filters: {
      category: category || null,
      minHealth,
    },
    count: results.length,
    results,
  });
}
