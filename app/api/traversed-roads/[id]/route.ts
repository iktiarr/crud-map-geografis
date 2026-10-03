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
        COALESCE(marker_style, 'numbers') as marker_style,
        COALESCE(connection_mode, 'sequential') as connection_mode,
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
      marker_style,
      connection_mode,
      travel_mode,
      category,
      description,
      geojson,
    } = body;

    const finalFolder = folder_name !== undefined ? (folder_name && folder_name.trim() ? folder_name.trim() : "Tanpa Folder") : null;
    const geojsonString = geojson !== undefined ? JSON.stringify(geojson) : null;
    const waypointsJson = waypoints !== undefined ? JSON.stringify(waypoints) : null;

    let updated;
    try {
      if (geojson && geojson.coordinates && Array.isArray(geojson.coordinates) && geojson.coordinates.length >= 2) {
        updated = await sql`
          UPDATE traversed_roads
          SET 
            name = COALESCE(${name !== undefined ? name.trim() : null}, name),
            folder_name = COALESCE(${finalFolder}, folder_name),
            origin_name = COALESCE(${origin_name !== undefined ? origin_name.trim() : null}, origin_name),
            origin_lat = COALESCE(${origin_lat !== undefined ? Number(origin_lat) : null}, origin_lat),
            origin_lng = COALESCE(${origin_lng !== undefined ? Number(origin_lng) : null}, origin_lng),
            destination_name = COALESCE(${destination_name !== undefined ? destination_name.trim() : null}, destination_name),
            destination_lat = COALESCE(${destination_lat !== undefined ? Number(destination_lat) : null}, destination_lat),
            destination_lng = COALESCE(${destination_lng !== undefined ? Number(destination_lng) : null}, destination_lng),
            waypoints = COALESCE(${waypointsJson}::jsonb, waypoints),
            distance_km = COALESCE(${distance_km !== undefined ? Number(distance_km) : null}, distance_km),
            duration_min = COALESCE(${duration_min !== undefined ? Number(duration_min) : null}, duration_min),
            color = COALESCE(${color}, color),
            weight = COALESCE(${weight !== undefined ? Number(weight) : null}, weight),
            opacity = COALESCE(${opacity !== undefined ? Number(opacity) : null}, opacity),
            line_style = COALESCE(${line_style}, line_style),
            marker_style = COALESCE(${marker_style}, marker_style),
            connection_mode = COALESCE(${connection_mode}, connection_mode),
            travel_mode = COALESCE(${travel_mode}, travel_mode),
            category = COALESCE(${category !== undefined ? category.trim() : null}, category),
            description = COALESCE(${description !== undefined ? description.trim() : null}, description),
            geojson = COALESCE(${geojsonString}::jsonb, geojson),
            geom = ST_SetSRID(ST_GeomFromGeoJSON(${geojsonString}), 4326),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${numId}
          RETURNING *;
        `;
      } else {
        updated = await sql`
          UPDATE traversed_roads
          SET 
            name = COALESCE(${name !== undefined ? name.trim() : null}, name),
            folder_name = COALESCE(${finalFolder}, folder_name),
            origin_name = COALESCE(${origin_name !== undefined ? origin_name.trim() : null}, origin_name),
            origin_lat = COALESCE(${origin_lat !== undefined ? Number(origin_lat) : null}, origin_lat),
            origin_lng = COALESCE(${origin_lng !== undefined ? Number(origin_lng) : null}, origin_lng),
            destination_name = COALESCE(${destination_name !== undefined ? destination_name.trim() : null}, destination_name),
            destination_lat = COALESCE(${destination_lat !== undefined ? Number(destination_lat) : null}, destination_lat),
            destination_lng = COALESCE(${destination_lng !== undefined ? Number(destination_lng) : null}, destination_lng),
            waypoints = COALESCE(${waypointsJson}::jsonb, waypoints),
            distance_km = COALESCE(${distance_km !== undefined ? Number(distance_km) : null}, distance_km),
            duration_min = COALESCE(${duration_min !== undefined ? Number(duration_min) : null}, duration_min),
            color = COALESCE(${color}, color),
            weight = COALESCE(${weight !== undefined ? Number(weight) : null}, weight),
            opacity = COALESCE(${opacity !== undefined ? Number(opacity) : null}, opacity),
            line_style = COALESCE(${line_style}, line_style),
            marker_style = COALESCE(${marker_style}, marker_style),
            connection_mode = COALESCE(${connection_mode}, connection_mode),
            travel_mode = COALESCE(${travel_mode}, travel_mode),
            category = COALESCE(${category !== undefined ? category.trim() : null}, category),
            description = COALESCE(${description !== undefined ? description.trim() : null}, description),
            geojson = COALESCE(${geojsonString}::jsonb, geojson),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${numId}
          RETURNING *;
        `;
      }
    } catch (sqlErr) {
      console.warn("Update fallback without geom:", sqlErr);
      updated = await sql`
        UPDATE traversed_roads
        SET 
          name = COALESCE(${name !== undefined ? name.trim() : null}, name),
          folder_name = COALESCE(${finalFolder}, folder_name),
          origin_name = COALESCE(${origin_name !== undefined ? origin_name.trim() : null}, origin_name),
          origin_lat = COALESCE(${origin_lat !== undefined ? Number(origin_lat) : null}, origin_lat),
          origin_lng = COALESCE(${origin_lng !== undefined ? Number(origin_lng) : null}, origin_lng),
          destination_name = COALESCE(${destination_name !== undefined ? destination_name.trim() : null}, destination_name),
          destination_lat = COALESCE(${destination_lat !== undefined ? Number(destination_lat) : null}, destination_lat),
          destination_lng = COALESCE(${destination_lng !== undefined ? Number(destination_lng) : null}, destination_lng),
          waypoints = COALESCE(${waypointsJson}::jsonb, waypoints),
          distance_km = COALESCE(${distance_km !== undefined ? Number(distance_km) : null}, distance_km),
          duration_min = COALESCE(${duration_min !== undefined ? Number(duration_min) : null}, duration_min),
          color = COALESCE(${color}, color),
          weight = COALESCE(${weight !== undefined ? Number(weight) : null}, weight),
          opacity = COALESCE(${opacity !== undefined ? Number(opacity) : null}, opacity),
          line_style = COALESCE(${line_style}, line_style),
          marker_style = COALESCE(${marker_style}, marker_style),
          connection_mode = COALESCE(${connection_mode}, connection_mode),
          travel_mode = COALESCE(${travel_mode}, travel_mode),
          category = COALESCE(${category !== undefined ? category.trim() : null}, category),
          description = COALESCE(${description !== undefined ? description.trim() : null}, description),
          geojson = COALESCE(${geojsonString}::jsonb, geojson),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${numId}
        RETURNING *;
      `;
    }


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
