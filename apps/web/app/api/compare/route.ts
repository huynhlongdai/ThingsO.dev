import { NextRequest, NextResponse } from "next/server";
import { getCompareRepositories } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const repositories = (request.nextUrl.searchParams.get("repos") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 4);
  const results = await getCompareRepositories(repositories);
  return NextResponse.json({ repositories, count: results.length, results });
}
