import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

// Ensure 'self' is polyfilled on Node runtime for shpjs
if (typeof (globalThis as any).self === "undefined") {
  (globalThis as any).self = globalThis;
}

export async function POST(request: Request) {
  try {
    await initDatabase();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { status: "error", message: "Berkas tidak ditemukan dalam permintaan" },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();
    let featureCollections: any[] = [];

    // 1. Process Shapefile (.zip)
    if (fileName.endsWith(".zip")) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Polyfill self if needed
      if (typeof (globalThis as any).self === "undefined") {
        (globalThis as any).self = globalThis;
      }

      // Dynamic import shpjs
      const shp = (await import("shpjs")).default || (await import("shpjs"));
      const parsed = await shp(buffer);

      if (Array.isArray(parsed)) {
        featureCollections = parsed;
      } else if (parsed && parsed.type === "FeatureCollection") {
        featureCollections = [parsed];
      }
    } 
    // 2. Process GeoJSON (.geojson, .json)
    else if (fileName.endsWith(".geojson") || fileName.endsWith(".json")) {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (parsed.type === "FeatureCollection") {
        featureCollections = [parsed];
      } else if (parsed.type === "Feature") {
        featureCollections = [{ type: "FeatureCollection", features: [parsed] }];
      } else if (parsed.type && parsed.coordinates) {
        // Raw geometry
        featureCollections = [
          {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: parsed,
                properties: { name: file.name.replace(/\.[^/.]+$/, "") },
              },
            ],
          },
        ];
      }
    } else {
      return NextResponse.json(
        {
          status: "error",
          message: "Format berkas tidak didukung. Harap unggah berkas Shapefile (.zip) atau GeoJSON (.geojson/.json)",
        },
        { status: 400 }
      );
    }

    let insertedCount = 0;
    const insertedFeatures: any[] = [];

    // Flatten all features
    for (const fc of featureCollections) {
      if (!fc || !Array.isArray(fc.features)) continue;

      for (const feature of fc.features) {
        if (!feature || !feature.geometry || !feature.geometry.type) continue;

        const geomType = feature.geometry.type;
        const props = feature.properties || {};

        // Extract friendly name
        const name =
          props.name ||
          props.NAMA ||
          props.Nama ||
          props.nama ||
          props.label ||
          props.LABEL ||
          props.title ||
          props.TITLE ||
          `${geomType} #${insertedCount + 1}`;

        // Extract category
        const category =
          props.category ||
          props.KATEGORI ||
          props.kategori ||
          props.type ||
          props.TIPE ||
          "Impor Shapefile";

        // Extract description
        const description =
          props.description ||
          props.DESKRIPSI ||
          props.deskripsi ||
          props.keterangan ||
          props.KET ||
          "";

        // Assign palette color based on geometry type
        const color =
          props.color ||
          props.WARNA ||
          (geomType.includes("Point")
            ? "#ef4444"
            : geomType.includes("Line")
            ? "#3b82f6"
            : "#10b981");

        const geojsonString = JSON.stringify(feature.geometry);
        const propertiesJson = JSON.stringify(props);

        try {
          const insertRes = await sql`
            INSERT INTO spatial_crud_features (name, type, category, description, color, geojson, properties, geom)
            VALUES (
              ${String(name).trim()},
              ${geomType},
              ${String(category).trim()},
              ${String(description).trim()},
              ${color},
              ${geojsonString}::jsonb,
              ${propertiesJson}::jsonb,
              ST_SetSRID(ST_GeomFromGeoJSON(${geojsonString}), 4326)
            )
            RETURNING id, name, type, category, description, color;
          `;
          insertedCount++;
          if (insertRes[0]) {
            insertedFeatures.push(insertRes[0]);
          }
        } catch (dbErr) {
          // Fallback if ST_GeomFromGeoJSON fails on complex multipolygon
          try {
            const fallbackRes = await sql`
              INSERT INTO spatial_crud_features (name, type, category, description, color, geojson, properties)
              VALUES (
                ${String(name).trim()},
                ${geomType},
                ${String(category).trim()},
                ${String(description).trim()},
                ${color},
                ${geojsonString}::jsonb,
                ${propertiesJson}::jsonb
              )
              RETURNING id, name, type, category, description, color;
            `;
            insertedCount++;
            if (fallbackRes[0]) {
              insertedFeatures.push(fallbackRes[0]);
            }
          } catch (fallbackErr) {
            console.warn("Skipping invalid feature:", fallbackErr);
          }
        }
      }
    }

    return NextResponse.json({
      status: "success",
      message: `Berhasil mengimpor ${insertedCount} objek spasial dari berkas "${file.name}"`,
      count: insertedCount,
      data: insertedFeatures.slice(0, 10), // return sample of imported items
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal memproses berkas unggahan",
      },
      { status: 500 }
    );
  }
}
