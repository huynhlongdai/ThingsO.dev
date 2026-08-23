import { NextResponse } from "next/server";
import { databaseHealthcheck, isDatabaseConfigured } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = isDatabaseConfigured();
  const database = configured ? await databaseHealthcheck() : false;
  return NextResponse.json(
    {
      status: configured && database ? "ok" : "degraded",
      database: { configured, reachable: database },
      timestamp: new Date().toISOString(),
    },
    { status: configured && database ? 200 : 503 },
  );
}
