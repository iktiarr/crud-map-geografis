import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

// GET /api/spatial-crud — Ambil semua data objek spasial (opsional filter per group)
export async function GET(request: Request) {
  try {
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const groupFilter = searchParams.get("group");

    let rows;
    if (groupFilter && groupFilter !== "Semua" && groupFilter.trim() !== "") {
      rows = await sql`
        SELECT 
          id, 
          name, 
          COALESCE(group_name, 'Utama') as group_name,
          type, 
          category, 
          description, 
          color, 
          geojson, 
          properties,
          ST_AsGeoJSON(geom) as geom_geojson,
          created_at, 
          updated_at 
        FROM spatial_crud_features 
        WHERE COALESCE(group_name, 'Utama') = ${groupFilter.trim()}
        ORDER BY id DESC;
      `;
    } else {
      rows = await sql`
        SELECT 
          id, 
          name, 
          COALESCE(group_name, 'Utama') as group_name,
          type, 
          category, 
          description, 
          color, 
          geojson, 
          properties,
          ST_AsGeoJSON(geom) as geom_geojson,
          created_at, 
          updated_at 
        FROM spatial_crud_features 
        ORDER BY id DESC;
      `;
    }

    // Ambil daftar semua grup yang ada di database (fitur + tabel grup)
    const groupRows = await sql`
      SELECT DISTINCT group_name 
      FROM spatial_crud_features 
      WHERE group_name IS NOT NULL AND group_name != ''
      UNION
      SELECT name as group_name 
      FROM spatial_groups
      ORDER BY group_name ASC;
    `;
    const distinctGroups = groupRows.map((r) => r.group_name).filter(Boolean);

    const features = rows.map((row) => {
      // Prioritize geom_geojson if available, otherwise use stored geojson
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
          group_name: row.group_name || "Utama",
          type: row.type,
          category: row.category || "Umum",
          description: row.description || "",
          color: row.color || "#678a40",
          created_at: row.created_at,
          updated_at: row.updated_at,
          ...(typeof row.properties === "object" && row.properties !== null ? row.properties : {}),
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
      groups: distinctGroups,
      data: rows,
      geojson: featureCollection,
    });
  } catch (error) {
    console.error("GET /api/spatial-crud error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengambil data spasial",
      },
      { status: 500 }
    );
  }
}

// POST /api/spatial-crud — Tambah objek spasial baru
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();

    const {
      name,
      group_name = "Utama",
      type = "Point",
      category = "Umum",
      description = "",
      color = "#678a40",
      geojson,
      properties = {},
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { status: "error", message: "Nama objek wajib diisi" },
        { status: 400 }
      );
    }

    if (!geojson || !geojson.type || !geojson.coordinates) {
      return NextResponse.json(
        { status: "error", message: "Geometri GeoJSON tidak valid" },
        { status: 400 }
      );
    }

    const finalGroup = group_name && group_name.trim() ? group_name.trim() : "Utama";
    const geojsonString = JSON.stringify(geojson);
    const propertiesJson = JSON.stringify(properties || {});

    // Try inserting with ST_GeomFromGeoJSON, fallback to geometry null if parsing fails
    let result;
    try {
      result = await sql`
        INSERT INTO spatial_crud_features (name, group_name, type, category, description, color, geojson, properties, geom)
        VALUES (
          ${name.trim()},
          ${finalGroup},
          ${type},
          ${category.trim()},
          ${description.trim()},
          ${color},
          ${geojsonString}::jsonb,
          ${propertiesJson}::jsonb,
          ST_SetSRID(ST_GeomFromGeoJSON(${geojsonString}), 4326)
        )
        RETURNING id, name, group_name, type, category, description, color, geojson, created_at;
      `;
    } catch (geomError) {
      console.warn("ST_GeomFromGeoJSON fallback to null geom:", geomError);
      result = await sql`
        INSERT INTO spatial_crud_features (name, group_name, type, category, description, color, geojson, properties)
        VALUES (
          ${name.trim()},
          ${finalGroup},
          ${type},
          ${category.trim()},
          ${description.trim()},
          ${color},
          ${geojsonString}::jsonb,
          ${propertiesJson}::jsonb
        )
        RETURNING id, name, group_name, type, category, description, color, geojson, created_at;
      `;
    }

    const newFeature = result[0];

    return NextResponse.json({
      status: "success",
      message: `Objek "${name}" berhasil disimpan ke dalam grup "${finalGroup}"`,
      data: newFeature,
    });
  } catch (error) {
    console.error("POST /api/spatial-crud error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal menyimpan objek spasial",
      },
      { status: 500 }
    );
  }
}
