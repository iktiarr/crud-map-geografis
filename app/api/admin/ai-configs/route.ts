import { NextRequest, NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await initDatabase();
    const rows = await sql`
      SELECT id, name, api_key, model, is_active, created_at, updated_at
      FROM ai_configurations
      ORDER BY id ASC;
    `;

    const mapped = (rows || []).map((r) => {
      const key = r.api_key || "";
      let maskedKey = "";
      if (key.length > 10) {
        maskedKey = `${key.slice(0, 7)}...${key.slice(-4)}`;
      } else if (key) {
        maskedKey = "••••••••••••";
      }

      return {
        id: r.id,
        name: r.name,
        maskedKey,
        rawKey: r.api_key,
        model: r.model || "apodex/apodex-1.1-mini",
        isActive: Boolean(r.is_active),
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      items: mapped,
    });
  } catch (err: unknown) {
    console.error("AI Configs GET Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil daftar konfigurasi AI." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Data permintaan tidak valid." },
        { status: 400 }
      );
    }

    const { name, apiKey, model, isActive } = body;

    if (!name || !apiKey || !model) {
      return NextResponse.json(
        { success: false, error: "Nama label, API Key, dan Model wajib diisi." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanKey = apiKey.trim();
    const cleanModel = model.trim();

    if (!cleanKey.startsWith("sk-or-")) {
      return NextResponse.json(
        { success: false, error: "API Key OpenRouter biasanya diawali dengan 'sk-or-v1-...'" },
        { status: 400 }
      );
    }

    // Default is_active is true, keep all keys active in the pool
    const result = await sql`
      INSERT INTO ai_configurations (name, api_key, model, is_active)
      VALUES (${cleanName}, ${cleanKey}, ${cleanModel}, ${isActive !== undefined ? Boolean(isActive) : true})
      RETURNING id, name, model, is_active, created_at;
    `;

    return NextResponse.json({
      success: true,
      message: "Konfigurasi AI baru berhasil ditambahkan dan langsung aktif dalam pool acak!",
      item: result[0],
    });
  } catch (err: unknown) {
    console.error("AI Configs POST Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan konfigurasi AI." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: "ID konfigurasi wajib disertakan." },
        { status: 400 }
      );
    }

    const { id, name, apiKey, model, isActive } = body;

    if (apiKey && apiKey.trim()) {
      const cleanKey = apiKey.trim();
      await sql`
        UPDATE ai_configurations
        SET 
          name = COALESCE(${name?.trim()}, name),
          api_key = ${cleanKey},
          model = COALESCE(${model?.trim()}, model),
          is_active = COALESCE(${isActive !== undefined ? Boolean(isActive) : null}, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id};
      `;
    } else {
      await sql`
        UPDATE ai_configurations
        SET 
          name = COALESCE(${name?.trim()}, name),
          model = COALESCE(${model?.trim()}, model),
          is_active = COALESCE(${isActive !== undefined ? Boolean(isActive) : null}, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id};
      `;
    }

    return NextResponse.json({
      success: true,
      message: "Konfigurasi AI berhasil diperbarui!",
    });
  } catch (err: unknown) {
    console.error("AI Configs PUT Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal memperbarui konfigurasi AI." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await initDatabase();
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: "ID konfigurasi wajib disertakan." },
        { status: 400 }
      );
    }

    const { id, isActive } = body;
    
    if (isActive !== undefined) {
      await sql`UPDATE ai_configurations SET is_active = ${Boolean(isActive)} WHERE id = ${id};`;
    } else {
      // Toggle current status
      await sql`UPDATE ai_configurations SET is_active = NOT is_active WHERE id = ${id};`;
    }

    return NextResponse.json({
      success: true,
      message: "Status aktif konfigurasi AI berhasil diubah!",
    });
  } catch (err: unknown) {
    console.error("AI Configs PATCH Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal mengubah status konfigurasi AI." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID konfigurasi wajib disertakan." },
        { status: 400 }
      );
    }

    await sql`DELETE FROM ai_configurations WHERE id = ${id};`;

    return NextResponse.json({
      success: true,
      message: "Konfigurasi AI berhasil dihapus.",
    });
  } catch (err: unknown) {
    console.error("AI Configs DELETE Error:", err);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus konfigurasi AI." },
      { status: 500 }
    );
  }
}
