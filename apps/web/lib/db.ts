import { Pool, type QueryResultRow } from "pg";

type GlobalDatabase = typeof globalThis & { __thingsoPool?: Pool };

const globalDatabase = globalThis as GlobalDatabase;

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!globalDatabase.__thingsoPool) {
    globalDatabase.__thingsoPool = new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 8),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
      application_name: "thingso-web",
    });
  }
  return globalDatabase.__thingsoPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, [...values]);
  return result.rows;
}

export async function databaseHealthcheck(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  try {
    const rows = await query<{ ok: number }>("SELECT 1 AS ok");
    return rows[0]?.ok === 1;
  } catch {
    return false;
  }
}
