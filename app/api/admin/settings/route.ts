import { NextRequest, NextResponse } from "next/server";
import { 
  getSystemSetting, 
  setSystemSetting, 
  getEffectiveOpenRouterModel,
  initDatabase 
} from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDatabase();
    const rawKey = await getSystemSetting("openrouter_api_key", "");
    const envKey = (process.env.API_KEY_OPENROUTERAI || "").trim();
    const activeModel = await getEffectiveOpenRouterModel();

    const activeSource = rawKey ? "database" : envKey ? "env" : "none";
    const effectiveKey = rawKey || envKey;

    let maskedKey = "";
    if (effectiveKey) {
      if (effectiveKey.length > 10) {
        maskedKey = `${effectiveKey.slice(0, 7)}...${effectiveKey.slice(-4)}`;
      } else {
        maskedKey = "••••••••••••";
      }
    }

    return NextResponse.json({
      success: true,
      hasKey: Boolean(effectiveKey),
      maskedKey,
      activeModel,
      activeSource,
      hasCustomDbKey: Boolean(rawKey),
      suggestedModels: [
        {
          id: "apodex/apodex-1.1-mini",
          name: "Apodex 1.1 Mini (Free)",
          badge: "Rekomendasi Utama",
          type: "free",
        },
        {
          id: "google/gemini-2.0-flash-thinking-exp:free",
          name: "Google Gemini 2.0 Flash Thinking",
          badge: "Cepat & Cerdas",
          type: "free",
        },
        {
          id: "meta-llama/llama-3.3-70b-instruct:free",
          name: "Meta Llama 3.3 70B Instruct",
          badge: "Model Besar 70B",
          type: "free",
        },
        {
          id: "qwen/qwen-2.5-72b-instruct:free",
          name: "Qwen 2.5 72B Instruct",
          badge: "Fasih Geospasial",
          type: "free",
        },
        {
          id: "deepseek/deepseek-r1:free",
          name: "DeepSeek R1",
          badge: "Penalaran Akurat",
          type: "free",
        },
      ],
    });
  } catch (err: unknown) {
    console.error("Admin Settings GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memuat pengaturan API Key & Model." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Data permintaan tidak valid." },
        { status: 400 }
      );
    }

    const { apiKey, model, action } = body as { 
      apiKey?: string; 
      model?: string; 
      action?: string 
    };

    if (action === "reset") {
      await setSystemSetting("openrouter_api_key", "");
      await setSystemSetting("openrouter_model", "apodex/apodex-1.1-mini");
      return NextResponse.json({
        success: true,
        message: "Pengaturan database direset. Model default: apodex/apodex-1.1-mini.",
      });
    }

    if (model && model.trim()) {
      await setSystemSetting("openrouter_model", model.trim());
    }

    if (apiKey !== undefined && apiKey !== null) {
      const cleanKey = apiKey.trim();
      if (cleanKey) {
        if (!cleanKey.startsWith("sk-or-")) {
          return NextResponse.json(
            {
              success: false,
              error: "Format OpenRouter API Key tidak valid. Kunci biasanya diawali dengan 'sk-or-v1-...'.",
            },
            { status: 400 }
          );
        }
        await setSystemSetting("openrouter_api_key", cleanKey);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Konfigurasi API Key & Model AI berhasil disimpan ke database!",
    });
  } catch (err: unknown) {
    console.error("Admin Settings POST Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memproses penyimpanan konfigurasi." },
      { status: 500 }
    );
  }
}
