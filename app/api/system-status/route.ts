import { NextResponse } from "next/server";
import { sql, withDbTimeout, getRandomAiConfigPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbConnected = false;
  let dbError: string | null = null;
  let dbTablesCount = 0;

  // 1. Cek Koneksi Database PostgreSQL / Neon dengan Timeout 3000ms
  try {
    const result = await withDbTimeout(
      sql`
        SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public';
      `,
      3000
    );
    dbConnected = true;
    dbTablesCount = Number(result[0]?.count || 0);
  } catch (err: unknown) {
    dbConnected = false;
    dbError = err instanceof Error ? err.message : "Tidak dapat terhubung ke server database";
  }

  // 2. Cek Konfigurasi API Key AI (Database pool & .env)
  let hasAiKey = false;
  try {
    const aiPool = await getRandomAiConfigPool();
    if (aiPool && aiPool.length > 0 && aiPool[0].apiKey && aiPool[0].apiKey.trim().length > 5) {
      hasAiKey = true;
    }
  } catch {
    hasAiKey = false;
  }

  if (!hasAiKey) {
    const openRouterKey = (process.env.API_KEY_OPENROUTERAI || process.env.OPENROUTER_API_KEY || "").trim();
    const geminiKey = (process.env.GEMINI_API_KEY || "").trim();
    const openaiKey = (process.env.OPENAI_API_KEY || "").trim();
    hasAiKey = openRouterKey.length > 5 || geminiKey.length > 5 || openaiKey.length > 5;
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      type: "PostgreSQL (Neon Cloud)",
      tablesCount: dbTablesCount,
      error: dbError,
    },
    ai: {
      configured: hasAiKey,
    },
  });
}
