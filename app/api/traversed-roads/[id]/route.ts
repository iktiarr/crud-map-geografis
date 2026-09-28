import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/traversed-roads/[id] — Ambil rute jalan spesifik
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id } = await context.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
      return NextResponse.json(
        { status: "error", message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const rows = await sql`
      SELECT 
        id, 
        name, 
        COALESCE(NULLIF(folder_name, ''), 'Tanpa Folder') as folder_name,
        origin_name, 
        origin_lat, 
        origin_lng, 
        destination_name, 
        destination_lat, 
        destination_lng, 
        waypoints,
        distance_km, 
        duration_min, 
        color, 
        weight, 
        opacity, 
        line_style, 
        travel_mode, 
        category, 
        description, 
        geojson, 
        ST_AsGeoJSON(geom) as geom_geojson, 
        created_at, 
        updated_at
      FROM traversed_roads
      WHERE id = ${numId}
      LIMIT 1;
    `;

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Data jalan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      data: rows[0],
    });
  } catch (error) {
    console.error("GET /api/traversed-roads/[id] error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengambil data rute",
      },
      { status: 500 }
    );
  }
}

// PUT /api/traversed-roads/[id] — Update kustomisasi rute jalan (warna, ketebalan, nama, folder, deskripsi)
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id } = await context.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
      return NextResponse.json(
        { status: "error", message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      folder_name,
      color,
      weight,
      opacity,
      line_style,
      category,
      description,
    } = body;

    const finalFolder = folder_name !== undefined ? (folder_name && folder_name.trim() ? folder_name.trim() : "Tanpa Folder") : null;

    const updated = await sql`
      UPDATE traversed_roads
      SET 
        name = COALESCE(${name !== undefined ? name.trim() : null}, name),
        folder_name = COALESCE(${finalFolder}, folder_name),
        color = COALESCE(${color}, color),
        weight = COALESCE(${weight !== undefined ? Number(weight) : null}, weight),
        opacity = COALESCE(${opacity !== undefined ? Number(opacity) : null}, opacity),
        line_style = COALESCE(${line_style}, line_style),
        category = COALESCE(${category !== undefined ? category.trim() : null}, category),
        description = COALESCE(${description !== undefined ? description.trim() : null}, description),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${numId}
      RETURNING 
        id, 
        name, 
        folder_name,
        color, 
        weight, 
        opacity, 
        line_style, 
        category, 
        description, 
        updated_at;
    `;

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Data jalan tidak ditemukan untuk diperbarui" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: `Rute jalan "${updated[0].name}" berhasil diperbarui`,
      data: updated[0],
    });
  } catch (error) {
    console.error("PUT /api/traversed-roads/[id] error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal memperbarui rute jalan",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/traversed-roads/[id] — Hapus rute jalan yang pernah dilalui
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id } = await context.params;
    const numId = parseInt(id, 10);

    if (isNaN(numId)) {
      return NextResponse.json(
        { status: "error", message: "ID tidak valid" },
        { status: 400 }
      );
    }

    const deleted = await sql`
      DELETE FROM traversed_roads
      WHERE id = ${numId}
      RETURNING id, name;
    `;

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Data jalan tidak ditemukan atau sudah dihapus" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: `Rute "${deleted[0].name}" berhasil dihapus dari database`,
      data: deleted[0],
    });
  } catch (error) {
    console.error("DELETE /api/traversed-roads/[id] error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal menghapus rute jalan",
      },
      { status: 500 }
    );
  }
}
