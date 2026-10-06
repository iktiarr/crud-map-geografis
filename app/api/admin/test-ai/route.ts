import { NextRequest, NextResponse } from "next/server";
import { getEffectiveOpenRouterKey, getEffectiveOpenRouterModel } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let apiKey = (body.apiKey || "").trim();
    let model = (body.model || "").trim();

    if (!apiKey) {
      apiKey = await getEffectiveOpenRouterKey();
    }

    if (!model) {
      model = await getEffectiveOpenRouterModel();
    }

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "API Key belum diisi. Masukkan API Key terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    const testPrompt = "Jawab hanya 1 kata: 'OK'";
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://crud-map-geografis.local",
          "X-Title": "Global Maps Studio - AI Model Tester",
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: "user", content: testPrompt }],
          max_tokens: 10,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const data = await res.json().catch(() => null);
        const reply = data?.choices?.[0]?.message?.content?.trim() || "OK";
        return NextResponse.json({
          success: true,
          status: "ready",
          model,
          latencyMs,
          message: `Model "${model}" aktif & berhasil merespons dalam ${latencyMs}ms!`,
          sampleReply: reply,
        });
      } else {
        const errData = await res.json().catch(() => null);
        const errMessage = errData?.error?.message || res.statusText || `HTTP ${res.status}`;
        return NextResponse.json({
          success: false,
          status: "error",
          model,
          latencyMs,
          error: `OpenRouter Error (${res.status}): ${errMessage}`,
        });
      }
    } catch {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        success: false,
        status: "timeout",
        model,
        latencyMs,
        error: `Waktu tunggu habis (>12s) saat menguji model "${model}". Periksa koneksi internet atau nama model.`,
      });
    }
  } catch (err: unknown) {
    console.error("Test AI Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal melakukan pengujian koneksi AI." },
      { status: 500 }
    );
  }
}
