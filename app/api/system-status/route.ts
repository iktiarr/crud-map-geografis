import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbConnected = false;
  let dbError: string | null = null;
  let dbTablesCount = 0;

  // 1. Cek Koneksi Database PostgreSQL / Neon
  try {
    const result = await sql`
      SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public';
    `;
    dbConnected = true;
    dbTablesCount = Number(result[0]?.count || 0);
  } catch (err: unknown) {
    dbConnected = false;
    dbError = err instanceof Error ? err.message : "Tidak dapat terhubung ke server database";
  }

  // 2. Cek Konfigurasi API Key AI
  const openRouterKey = process.env.API_KEY_OPENROUTERAI || process.env.OPENROUTER_API_KEY || "";
  const geminiKey = process.env.GEMINI_API_KEY || "";
  const openaiKey = process.env.OPENAI_API_KEY || "";

  const hasAiKey =
    openRouterKey.trim().length > 10 ||
    geminiKey.trim().length > 10 ||
    openaiKey.trim().length > 10;

  const aiProvider = openRouterKey
    ? "OpenRouter AI (DeepSeek / Llama)"
    : geminiKey
    ? "Google Gemini AI"
    : openaiKey
    ? "OpenAI"
    : "Belum Dikonfigurasi";

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
      provider: aiProvider,
    },
  });
}
