import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/traversed-roads — Ambil semua jalan yang pernah dilalui
export async function GET(request: Request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const folderFilter = searchParams.get("folder");

    let rows;
    if (folderFilter && folderFilter !== "Semua" && folderFilter.trim() !== "") {
      rows = await sql`
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
        WHERE COALESCE(NULLIF(folder_name, ''), 'Tanpa Folder') = ${folderFilter.trim()}
        ORDER BY id DESC;
      `;
    } else {
      rows = await sql`
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
        ORDER BY id DESC;
      `;
    }

    // Ambil daftar folder
    const folderRows = await sql`
      SELECT DISTINCT folder_name 
      FROM traversed_roads 
      WHERE folder_name IS NOT NULL AND folder_name != '' AND folder_name != 'Tanpa Folder'
      UNION
      SELECT name as folder_name
      FROM traversed_road_folders
      ORDER BY folder_name ASC;
    `;
    const distinctFolders = folderRows.map((r) => r.folder_name).filter(Boolean);

    const features = rows.map((row) => {
      let geometry = null;
      if (row.geom_geojson) {
        try {
          geometry = typeof row.geom_geojson === "string" ? JSON.parse(row.geom_geojson) : row.geom_geojson;
        } catch {
          geometry = row.geojson;
        }
      } else {
        geometry = row.geojson;
      }

      return {
        type: "Feature",
        id: row.id,
        geometry,
        properties: {
          id: row.id,
          name: row.name,
          folder_name: row.folder_name || "Tanpa Folder",
          origin_name: row.origin_name,
          origin_lat: row.origin_lat,
          origin_lng: row.origin_lng,
          destination_name: row.destination_name,
          destination_lat: row.destination_lat,
          destination_lng: row.destination_lng,
          waypoints: row.waypoints || [],
          distance_km: row.distance_km,
          duration_min: row.duration_min,
          color: row.color || "#2563eb",
          weight: row.weight || 6,
          opacity: row.opacity !== null ? row.opacity : 0.9,
          line_style: row.line_style || "solid",
          travel_mode: row.travel_mode || "driving",
          category: row.category || "Jalan Terhubung",
          description: row.description || "",
          created_at: row.created_at,
          updated_at: row.updated_at,
        },
      };
    });

    const featureCollection = {
      type: "FeatureCollection",
      features,
    };

    return NextResponse.json({
      status: "success",
      total: rows.length,
      folders: distinctFolders,
      data: rows,
      geojson: featureCollection,
    });
  } catch (error) {
    console.error("GET /api/traversed-roads error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengambil data jalan yang dilalui",
      },
      { status: 500 }
    );
  }
}

// POST /api/traversed-roads — Simpan pemetaan jalan baru
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();

    const {
      name,
      folder_name = "Utama",
      origin_name = "Titik Awal",
      origin_lat,
      origin_lng,
      destination_name = "Titik Tujuan",
      destination_lat,
      destination_lng,
      waypoints = [],
      distance_km = 0,
      duration_min = 0,
      color = "#2563eb",
      weight = 6,
      opacity = 0.9,
      line_style = "solid",
      travel_mode = "driving",
      category = "Jalan Terhubung",
      description = "",
      geojson,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { status: "error", message: "Nama jalan/rute wajib diisi" },
        { status: 400 }
      );
    }

    if (origin_lat === undefined || origin_lng === undefined || destination_lat === undefined || destination_lng === undefined) {
      return NextResponse.json(
        { status: "error", message: "Koordinat titik asal dan tujuan wajib diisi" },
        { status: 400 }
      );
    }

    if (!geojson || !geojson.type || !geojson.coordinates) {
      return NextResponse.json(
        { status: "error", message: "Geometri jalur GeoJSON tidak valid" },
        { status: 400 }
      );
    }

    const finalFolder = folder_name && folder_name.trim() ? folder_name.trim() : "Tanpa Folder";
    const geojsonString = JSON.stringify(geojson);
    const waypointsJson = JSON.stringify(waypoints || []);

    let result;
    try {
      result = await sql`
        INSERT INTO traversed_roads (
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
          travel_mode, 
          category, 
          description, 
          geojson, 
          geom
        )
        VALUES (
          ${name.trim()},
          ${finalFolder},
          ${origin_name.trim()},
          ${Number(origin_lat)},
          ${Number(origin_lng)},
          ${destination_name.trim()},
          ${Number(destination_lat)},
          ${Number(destination_lng)},
          ${waypointsJson}::jsonb,
          ${Number(distance_km)},
          ${Number(duration_min)},
          ${color},
          ${Number(weight)},
          ${Number(opacity)},
          ${line_style},
          ${travel_mode},
          ${category.trim()},
          ${description.trim()},
          ${geojsonString}::jsonb,
          ST_SetSRID(ST_GeomFromGeoJSON(${geojsonString}), 4326)
        )
        RETURNING 
          id, 
          name, 
          folder_name,
          origin_name, 
          destination_name, 
          distance_km, 
          duration_min, 
          color, 
          weight, 
          opacity, 
          line_style, 
          travel_mode, 
          category, 
          created_at;
      `;
    } catch (geomError) {
      console.warn("ST_GeomFromGeoJSON fallback for traversed_roads:", geomError);
      result = await sql`
        INSERT INTO traversed_roads (
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
          travel_mode, 
          category, 
          description, 
          geojson
        )
        VALUES (
          ${name.trim()},
          ${finalFolder},
          ${origin_name.trim()},
          ${Number(origin_lat)},
          ${Number(origin_lng)},
          ${destination_name.trim()},
          ${Number(destination_lat)},
          ${Number(destination_lng)},
          ${waypointsJson}::jsonb,
          ${Number(distance_km)},
          ${Number(duration_min)},
          ${color},
          ${Number(weight)},
          ${Number(opacity)},
          ${line_style},
          ${travel_mode},
          ${category.trim()},
          ${description.trim()},
          ${geojsonString}::jsonb
        )
        RETURNING 
          id, 
          name, 
          folder_name,
          origin_name, 
          destination_name, 
          distance_km, 
          duration_min, 
          color, 
          weight, 
          opacity, 
          line_style, 
          travel_mode, 
          category, 
          created_at;
      `;
    }

    return NextResponse.json({
      status: "success",
      message: `Pemetaan rute jalan "${name}" berhasil disimpan ke folder "${finalFolder}"`,
      data: result[0],
    });
  } catch (error) {
    console.error("POST /api/traversed-roads error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal menyimpan rute jalan",
      },
      { status: 500 }
    );
  }
}
