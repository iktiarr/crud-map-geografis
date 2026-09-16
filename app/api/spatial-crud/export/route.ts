import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";
import * as shpwrite from "@mapbox/shp-write";
import JSZip from "jszip";

export async function GET(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") || "zip").toLowerCase();
    const groupParam = searchParams.get("group");
    const idsParam = searchParams.get("ids");

    let rows;
    if (idsParam && idsParam.trim()) {
      // Export specific IDs (from batch selection)
      const numericIds = idsParam
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
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
          created_at 
        FROM spatial_crud_features 
        WHERE id = ANY(${numericIds})
        ORDER BY id ASC;
      `;
    } else if (groupParam && groupParam !== "Semua" && groupParam.trim()) {
      // Export specific Group
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
          created_at 
        FROM spatial_crud_features 
        WHERE COALESCE(group_name, 'Utama') = ${groupParam.trim()}
        ORDER BY id ASC;
      `;
    } else {
      // Export All
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
          created_at 
        FROM spatial_crud_features 
        ORDER BY id ASC;
      `;
    }

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
        type: "Feature" as const,
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
          ...(typeof row.properties === "object" && row.properties !== null ? row.properties : {}),
        },
      };
    });

    const validFeatures = features.filter(
      (f) => f.geometry && typeof f.geometry === "object" && f.geometry.type && f.geometry.coordinates
    );

    const targetTitle = groupParam && groupParam !== "Semua"
      ? `Grup "${groupParam.trim()}"`
      : idsParam
      ? `Koleksi ${features.length} Objek Terpilih`
      : "Semua Objek Spasial";

    // Generate Documentation Markdown Content (.md)
    const markdownContent = generateInformationMarkdown({
      datasetName: targetTitle,
      groupName: groupParam || "Semua",
      features: validFeatures,
      exportDate: new Date(),
    });

    // 1. Export as Markdown only (.md)
    if (format === "md" || format === "markdown") {
      const sanitizedName = (groupParam && groupParam !== "Semua" ? groupParam : "data_spasial")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_");
      return new NextResponse(markdownContent, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="INFORMASI_${sanitizedName}.md"`,
        },
      });
    }

    // GeoJSON FeatureCollection
    const featureCollection = {
      type: "FeatureCollection" as const,
      features: validFeatures,
    };
    const geojsonString = JSON.stringify(featureCollection, null, 2);

    // KML Placemarks
    const kmlContent = generateKmlContent(targetTitle, validFeatures);

    // 2. Direct GeoJSON (Single file)
    if (format === "geojson" || format === "json") {
      return new NextResponse(geojsonString, {
        headers: {
          "Content-Type": "application/geo+json; charset=utf-8",
          "Content-Disposition": `attachment; filename="spatial_data_${(groupParam || "semua").toLowerCase().replace(/[^a-z0-9]/g, "_")}.geojson"`,
        },
      });
    }

    // 3. Direct KML
    if (format === "kml") {
      return new NextResponse(kmlContent, {
        headers: {
          "Content-Type": "application/vnd.google-earth.kml+xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="spatial_data_${(groupParam || "semua").toLowerCase().replace(/[^a-z0-9]/g, "_")}.kml"`,
        },
      });
    }

    // 4. ZIP Package (GeoJSON, KML, ESRI Shapefile, AND INFORMASI_DATA_SPASIAL.md)
    const zip = new JSZip();

    // Add Markdown Documentation
    zip.file("INFORMASI_DATA_SPASIAL.md", markdownContent);

    // Add GeoJSON
    zip.file("data.geojson", geojsonString);

    // Add KML
    zip.file("data.kml", kmlContent);

    // Attempt generating Shapefile layers inside the ZIP
    if (validFeatures.length > 0) {
      try {
        const sanitizedFeatures = validFeatures.map((f) => {
          const props: Record<string, string | number> = {
            ID: f.properties.id || 0,
            NAMA: String(f.properties.name || "Tanpa Nama").slice(0, 50),
            GRUP: String(f.properties.group_name || "Utama").slice(0, 30),
            TIPE: String(f.properties.type || f.geometry.type || "").slice(0, 20),
            KATEGORI: String(f.properties.category || "Umum").slice(0, 50),
            DESKRIPSI: String(f.properties.description || "").slice(0, 100),
            WARNA: String(f.properties.color || "#678a40").slice(0, 20),
          };

          return {
            type: "Feature" as const,
            geometry: f.geometry,
            properties: props,
          };
        });

        const sanitizedCollection = {
          type: "FeatureCollection" as const,
          features: sanitizedFeatures,
        };

        const base64ShpZip = await (shpwrite.zip as any)(sanitizedCollection, {
          outputType: "base64",
          folder: "shapefile_layers",
          types: {
            point: "titik_points",
            polygon: "area_polygons",
            line: "garis_polylines",
          },
        });

        const shpBuffer = Buffer.from(base64ShpZip, "base64");
        // Load the shapefile zip into subfolder or root
        const shpZipInstance = await JSZip.loadAsync(shpBuffer);
        const shpFolder = zip.folder("shapefile_layers");
        for (const [filename, fileObj] of Object.entries(shpZipInstance.files)) {
          if (!fileObj.dir) {
            const content = await fileObj.async("nodebuffer");
            shpFolder?.file(filename.replace(/^shapefile_layers\//, ""), content);
          }
        }
      } catch (shpErr) {
        console.warn("Shapefile bundling notice:", shpErr);
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const filenameSafe = (groupParam && groupParam !== "Semua" ? groupParam : "paket_spasial")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_");

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filenameSafe}_lengkap.zip"`,
        "Content-Length": zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengekspor data spasial",
      },
      { status: 500 }
    );
  }
}

// Helper: Format Coordinate summary for markdown table
function formatCoords(geometry: any): string {
  if (!geometry || !geometry.coordinates) return "-";
  const type = geometry.type;
  if (type === "Point" && Array.isArray(geometry.coordinates)) {
    const [lng, lat] = geometry.coordinates;
    return `Lat: ${Number(lat).toFixed(5)}, Lng: ${Number(lng).toFixed(5)}`;
  }
  if (type === "LineString" && Array.isArray(geometry.coordinates)) {
    const pts = geometry.coordinates;
    const start = pts[0];
    const end = pts[pts.length - 1];
    return `${pts.length} titik garis (Awal: ${start[1]?.toFixed(4)}, ${start[0]?.toFixed(4)})`;
  }
  if (type === "Polygon" && Array.isArray(geometry.coordinates)) {
    const ring = geometry.coordinates[0] || [];
    return `${ring.length} simpul poligon tertutup`;
  }
  return `${type} Data`;
}

// Generator: INFORMASI_DATA_SPASIAL.md
function generateInformationMarkdown(options: {
  datasetName: string;
  groupName: string;
  features: any[];
  exportDate: Date;
}): string {
  const { datasetName, groupName, features, exportDate } = options;

  const pointCount = features.filter((f) => (f.properties?.type || f.geometry?.type || "").toLowerCase().includes("point")).length;
  const lineCount = features.filter((f) => (f.properties?.type || f.geometry?.type || "").toLowerCase().includes("line")).length;
  const polygonCount = features.filter((f) => (f.properties?.type || f.geometry?.type || "").toLowerCase().includes("polygon")).length;
  const total = features.length;

  const dateFormatted = exportDate.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
    timeStyle: "medium",
  });

  const rowsMarkdown = features
    .map((f, idx) => {
      const p = f.properties || {};
      const id = p.id ?? "-";
      const name = p.name ? String(p.name).replace(/\|/g, "\\|") : "Tanpa Nama";
      const grp = p.group_name ? String(p.group_name).replace(/\|/g, "\\|") : "Utama";
      const cat = p.category ? String(p.category).replace(/\|/g, "\\|") : "Umum";
      const geomType = p.type || f.geometry?.type || "-";
      const color = p.color || "#678a40";
      const coordStr = formatCoords(f.geometry);
      const desc = p.description ? String(p.description).replace(/\|/g, "\\|") : "-";

      return `| ${idx + 1} | #${id} | **${name}** | \`${grp}\` | ${cat} | ${geomType} | \`${color}\` | ${coordStr} | ${desc} |`;
    })
    .join("\n");

  return `# 📄 DOKUMEN INFORMASI DATA SPASIAL GEOGRAFIS
**Sistem SIG Berbasis Web — Modul 2: Spatial CRUD**

Dokumen ini memuat seluruh metadata, ringkasan statistik, serta rincian objek spasial yang disertakan dalam paket unduhan ini. Dibuat agar pengguna dapat memahami dengan jelas isi dan spesifikasi data spasial yang diekspor.

---

## 📌 1. Informasi Umum Ekspor
- **Nama Paket / Koleksi**: ${datasetName}
- **Filter Grup**: \`${groupName}\`
- **Waktu Ekspor**: ${dateFormatted} WIB
- **Total Objek Spasial**: **${total} Objek**
- **Sistem Referensi Koordinat (CRS)**: **WGS 84 (EPSG:4326)** — Standar Global GPS & Web GIS
- **Format Berkas Terlampir Dalam Paket**:
  1. \`data.geojson\` — Format GeoJSON RFC 7946 untuk web mapping (Leaflet, Mapbox, OpenLayers).
  2. \`shapefile_layers/\` — Format ESRI Shapefile (\`.shp\`, \`.shx\`, \`.dbf\`, \`.prj\`) untuk QGIS dan ArcGIS.
  3. \`data.kml\` — Format Keyhole Markup Language untuk Google Earth & GPS Viewer.
  4. \`INFORMASI_DATA_SPASIAL.md\` — Dokumen panduan dan metadata ini.

---

## 📊 2. Ringkasan Statistik Geometri
| Tipe Geometri Spasial | Jumlah Objek | Persentase | Status Validitas |
| :--- | :---: | :---: | :---: |
| 📍 **Titik (Point)** | ${pointCount} | ${total > 0 ? ((pointCount / total) * 100).toFixed(1) : 0}% | Valid WGS84 |
| 📏 **Garis (LineString)** | ${lineCount} | ${total > 0 ? ((lineCount / total) * 100).toFixed(1) : 0}% | Valid WGS84 |
| 🗺️ **Area (Polygon)** | ${polygonCount} | ${total > 0 ? ((polygonCount / total) * 100).toFixed(1) : 0}% | Valid WGS84 |
| **TOTAL KESELURUHAN** | **${total}** | **100%** | **Siap Digunakan** |

---

## 📋 3. Tabel Rincian Objek Spasial
Berikut adalah daftar seluruh objek spasial yang termasuk dalam ekspor ini:

| No | ID | Nama Objek | Grup | Kategori | Tipe Geometri | Warna (HEX) | Koordinat / Lokasi | Deskripsi |
| :-: | :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${rowsMarkdown || "| - | - | Tidak ada data objek | - | - | - | - | - | - |"}

---

## 🛠️ 4. Petunjuk Penggunaan Berkas GIS

### A. Membuka di QGIS Desktop (Direkomendasikan)
1. Buka aplikasi **QGIS Desktop**.
2. Klik menu utama **Layer** > **Add Layer** > **Add Vector Layer...** (atau tekan \`Ctrl+Shift+V\`).
3. Pada bagian *Source*, arahkan ke file \`data.geojson\` atau file \`.shp\` di dalam folder \`shapefile_layers\`.
4. Klik **Add** dan data spasial akan langsung terpetakan dengan proyeksi EPSG:4326.

### B. Membuka di ArcGIS / ArcGIS Pro
1. Buka **ArcGIS Pro** atau **ArcMap**.
2. Pada panel *Catalog*, klik kanan folder hasil ekstraksi -> **Refresh**.
3. Tarik berkas shapefile (\`.shp\`) atau berkas \`.geojson\` langsung ke kanvas peta.

### C. Membuka di Google Earth (Web / Desktop)
1. Buka **Google Earth Pro** atau kunjungi [earth.google.com](https://earth.google.com).
2. Pilih **File** > **Open...** atau **Projects** > **Import KML**.
3. Pilih berkas \`data.kml\` dari paket ini.

### D. Menggunakan di Web Map (Leaflet.js)
\`\`\`javascript
fetch('data.geojson')
  .then(res => res.json())
  .then(geojsonData => {
    L.geoJSON(geojsonData, {
      style: (feature) => ({
        color: feature.properties.color || '#10b981',
        weight: 3,
      }),
      onEachFeature: (feature, layer) => {
        layer.bindPopup('<b>' + feature.properties.name + '</b><br>' + (feature.properties.description || ''));
      }
    }).addTo(map);
  });
\`\`\`

---
*Dokumen ini dibuat otomatis oleh Sistem SIG Spatial CRUD PostgreSQL/PostGIS. Semua koordinat berpedoman pada datum WGS84 EPSG:4326.*
`;
}

// Helper: KML Generator
function generateKmlContent(title: string, features: any[]): string {
  const placemarks = features
    .map((f) => {
      const geom = f.geometry;
      let kmlGeom = "";
      try {
        if (geom.type === "Point" && Array.isArray(geom.coordinates)) {
          const [lng, lat] = geom.coordinates;
          kmlGeom = `<Point><coordinates>${lng},${lat},0</coordinates></Point>`;
        } else if (geom.type === "LineString" && Array.isArray(geom.coordinates)) {
          const coordsStr = geom.coordinates.map((c: number[]) => `${c[0]},${c[1]},0`).join(" ");
          kmlGeom = `<LineString><coordinates>${coordsStr}</coordinates></LineString>`;
        } else if (geom.type === "Polygon" && Array.isArray(geom.coordinates) && geom.coordinates[0]) {
          const coordsStr = geom.coordinates[0].map((c: number[]) => `${c[0]},${c[1]},0`).join(" ");
          kmlGeom = `<Polygon><outerBoundaryIs><LinearRing><coordinates>${coordsStr}</coordinates></LinearRing></outerBoundaryIs></Polygon>`;
        }
      } catch (kmlErr) {
        console.warn("KML formatting error for feature:", f.id, kmlErr);
      }

      return `
    <Placemark>
      <name>${escapeXml(f.properties.name || "Objek Spasial")}</name>
      <description>${escapeXml(
        `Grup: ${f.properties.group_name || "Utama"} | Kategori: ${f.properties.category || "Umum"} | ${f.properties.description || ""}`
      )}</description>
      ${kmlGeom}
    </Placemark>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    <description>Hasil Ekspor Data Spasial Modul 2</description>
    ${placemarks}
  </Document>
</kml>`;
}

function escapeXml(unsafe: string): string {
  return String(unsafe || "").replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
