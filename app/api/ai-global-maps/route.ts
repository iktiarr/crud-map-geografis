import { NextRequest, NextResponse } from "next/server";
import { 
  buildModul1SystemPrompt, 
  parseCoordinates, 
  findLocalReference,
  type MapContextLive 
} from "@/contexts/modul-1";
import { getRandomAiConfigPool } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pool = await getRandomAiConfigPool();
    if (pool && pool.length > 0 && pool[0].model) {
      return NextResponse.json({
        success: true,
        model: pool[0].model,
        name: pool[0].name || "OpenRouter AI",
        count: pool.length,
      });
    }
  } catch (err) {
    console.warn("Notice reading AI config GET:", err);
  }

  return NextResponse.json({
    success: true,
    model: "apodex/apodex-1.1-mini",
    name: "OpenRouter AI",
    count: 0,
  });
}

export async function POST(req: NextRequest) {
  try {

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Format request tidak valid." },
        { status: 400 }
      );
    }

    const { message, context } = body as {
      message?: string;
      context?: MapContextLive;
    };

    const userMessage = (message || "").trim();
    if (!userMessage) {
      return NextResponse.json(
        { success: false, error: "Pesan atau pertanyaan pencarian wajib diisi." },
        { status: 400 }
      );
    }

    // 1. Cek jika input adalah koordinat angka langsung
    const directCoords = parseCoordinates(userMessage);
    if (directCoords) {
      return NextResponse.json({
        success: true,
        reply: `Koordinat terdeteksi: Latitude ${directCoords.lat}, Longitude ${directCoords.lng}. Peta diarahkan ke titik tersebut.`,
        action: {
          type: "fly_to",
          param: `${directCoords.lat},${directCoords.lng},16`,
          label: `Titik (${directCoords.lat}, ${directCoords.lng})`,
          raw: `[ACTION:fly_to:${directCoords.lat},${directCoords.lng},16:Titik Koordinat]`,
        },
      });
    }

    // 2. Cek apakah ada di basis data referensi lokal Modul 1
    const localRef = findLocalReference(userMessage);
    if (localRef) {
      return NextResponse.json({
        success: true,
        reply: `${localRef.name} berada di koordinat Latitude ${localRef.lat}, Longitude ${localRef.lng}. ${localRef.description}`,
        action: {
          type: "fly_to",
          param: `${localRef.lat},${localRef.lng},${localRef.zoom}`,
          label: localRef.name,
          raw: `[ACTION:fly_to:${localRef.lat},${localRef.lng},${localRef.zoom}:${localRef.name}]`,
        },
      });
    }

    if (userMessage.length > 1200) {
      return NextResponse.json(
        { success: false, error: "Pesan terlalu panjang (maksimum 1200 karakter)." },
        { status: 400 }
      );
    }

    const aiPool = await getRandomAiConfigPool();
    if (!aiPool || aiPool.length === 0 || !aiPool[0].apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Belum ada API Key OpenRouter yang aktif. Silakan tambahkan di Portal Admin (/admin).",
        },
        { status: 500 }
      );
    }

    const contextSummary = `DATA LIVE PETA GLOBAL:
- Basemap Aktif: ${context?.activeBasemap || "Google Satelit Hybrid"}
- Koordinat Tengah Peta Saat Ini: Latitude ${context?.centerLat ?? -6.2088}, Longitude ${context?.centerLng ?? 106.8456} (Zoom: ${context?.zoom ?? 11})
- Koordinat GPS Pengguna: ${
      context?.userLocation
        ? `Latitude ${context.userLocation.lat}, Longitude ${context.userLocation.lng} (GPS Terdeteksi Aktif)`
        : "Belum terdeteksi / Belum diberi izin GPS"
    }
- Koordinat Kursor Pengguna: ${
      context?.cursorCoords ? `Lat ${context.cursorCoords.lat}, Lng ${context.cursorCoords.lng}` : "Tidak aktif"
    }`;

    const systemPrompt = buildModul1SystemPrompt(context);

    let lastError = "Gagal memproses permintaan ke OpenRouter.";
    let successfulReply: string | null = null;
    let usedModel = "";
    let usedConfigName = "";

    // Coba secara berurutan dari pool yang sudah diacak (Load balancing + Failover)
    for (const config of aiPool) {
      const apiKey = config.apiKey;
      const model = config.model || "apodex/apodex-1.1-mini";

      if (!apiKey) continue;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 16000);

        const openRouterPayload = {
          model,
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `${contextSummary}\n\nPERTANYAAN / PERINTAH PENGGUNA:\n"${userMessage}"`,
            },
          ],
          temperature: 0.2,
          max_tokens: 600,
        };

        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": "https://crud-map-geografis.local",
            "X-Title": "Global Maps Studio - Modul 1",
          },
          body: JSON.stringify(openRouterPayload),
          signal: controller.signal,
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          const replyText = data?.choices?.[0]?.message?.content?.trim() || "";
          if (replyText) {
            successfulReply = replyText;
            usedModel = model;
            usedConfigName = config.name;
            break; // Berhasil!
          }
        } else if (res) {
          const errData = await res.json().catch(() => null);
          lastError = errData?.error?.message || `OpenRouter HTTP ${res.status}`;
          console.warn(`[AI Failover] Model ${model} (${config.name}) gagal (${res.status}): ${lastError}. Mencoba konfigurasi berikutnya di pool...`);
        }
      } catch (poolErr) {
        console.warn(`[AI Failover] Model ${model} timeout/error:`, poolErr);
      }
    }

    if (!successfulReply) {
      return NextResponse.json(
        { success: false, error: `Semua model AI dalam pool gagal: ${lastError}` },
        { status: 502 }
      );
    }

    // Extract action tag if present
    const actionMatch = successfulReply.match(/\[ACTION:(fly_to|set_basemap|locate_user|reset_indonesia):([^:]+):([^\]]+)\]/i);
    let actionObj = null;
    let cleanReply = successfulReply;

    if (actionMatch) {
      cleanReply = successfulReply.replace(actionMatch[0], "").trim();
      actionObj = {
        type: actionMatch[1],
        param: actionMatch[2],
        label: actionMatch[3],
        raw: actionMatch[0],
      };
    }

    // Bersihkan semua tanda bintang markdown (**) atau (*) agar jawaban bersih tanpa bug tampilan
    cleanReply = cleanReply
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/_{2,}/g, "")
      .trim();

    return NextResponse.json({
      success: true,
      reply: cleanReply,
      rawReply: successfulReply,
      action: actionObj,
      usedModel,
      usedConfigName,
    });
  } catch (error: unknown) {
    console.error("AI Global Maps API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan pada asisten AI Global Maps.",
      },
      { status: 500 }
    );
  }
}
