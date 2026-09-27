import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

// PUT /api/spatial-crud/[id] — Update objek spasial
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
      group_name,
      type,
      category = "Umum",
      description = "",
      color = "#678a40",
      geojson,
      properties,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { status: "error", message: "Nama objek tidak boleh kosong" },
        { status: 400 }
      );
    }

    const finalGroupName = group_name !== undefined ? (group_name && group_name.trim() ? group_name.trim() : "Tanpa Grup") : null;

    let updated;
    if (geojson && geojson.type && geojson.coordinates) {
      const geojsonString = JSON.stringify(geojson);
      const propertiesJson = JSON.stringify(properties || {});

      try {
        updated = await sql`
          UPDATE spatial_crud_features
          SET 
            name = ${name.trim()},
            group_name = COALESCE(${finalGroupName}, group_name),
            type = COALESCE(${type}, type),
            category = ${category.trim()},
            description = ${description.trim()},
            color = ${color},
            geojson = ${geojsonString}::jsonb,
            properties = ${propertiesJson}::jsonb,
            geom = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonString}), 4326),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${numId}
          RETURNING id, name, group_name, type, category, description, color, geojson, updated_at;
        `;
      } catch (geomErr) {
        console.warn("Update fallback geom:", geomErr);
        updated = await sql`
          UPDATE spatial_crud_features
          SET 
            name = ${name.trim()},
            group_name = COALESCE(${finalGroupName}, group_name),
            type = COALESCE(${type}, type),
            category = ${category.trim()},
            description = ${description.trim()},
            color = ${color},
            geojson = ${geojsonString}::jsonb,
            properties = ${propertiesJson}::jsonb,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${numId}
          RETURNING id, name, group_name, type, category, description, color, geojson, updated_at;
        `;
      }
    } else {
      updated = await sql`
        UPDATE spatial_crud_features
        SET 
          name = ${name.trim()},
          group_name = COALESCE(${finalGroupName}, group_name),
          type = COALESCE(${type}, type),
          category = ${category.trim()},
          description = ${description.trim()},
          color = ${color},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${numId}
        RETURNING id, name, group_name, type, category, description, color, geojson, updated_at;
      `;
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Objek tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: `Objek "${name}" berhasil diperbarui`,
      data: updated[0],
    });
  } catch (error) {
    console.error("PUT /api/spatial-crud/[id] error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal memperbarui data",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/spatial-crud/[id] — Hapus objek spasial
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
      DELETE FROM spatial_crud_features
      WHERE id = ${numId}
      RETURNING id, name;
    `;

    if (!deleted || deleted.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Objek tidak ditemukan atau sudah terhapus" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: "success",
      message: `Objek "${deleted[0].name}" berhasil dihapus`,
      data: deleted[0],
    });
  } catch (error) {
    console.error("DELETE /api/spatial-crud/[id] error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal menghapus data",
      },
      { status: 500 }
    );
  }
}
