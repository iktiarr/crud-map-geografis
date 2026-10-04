/**
 * Route & Folder Multi-Format Export Engine (Module 5)
 * Supports:
 * 1. PNG / JPEG (Minimalist HD Graphic with Soft White Background, Pure Route Lines & Clean Pins)
 * 2. SVG (Vector Graphic)
 * 3. GeoJSON (.geojson)
 * 4. JSON (.json)
 * 5. GPX (.gpx) for Strava, Garmin, GPS devices
 * 6. KML (.kml) for Google Earth & Google My Maps
 * 7. CSV (.csv) for Spreadsheet & Coordinates table
 */

import { TraversedRoadRecord, parseRouteGeoJSON } from "@/app/distance-routing/tipe";

export type ExportFormat = "png" | "jpeg" | "svg" | "geojson" | "json" | "gpx" | "kml" | "csv";

export interface ExportOption {
  id: ExportFormat;
  label: string;
  extension: string;
  category: "image" | "spatial" | "data";
  description: string;
  iconName: string;
}

export const EXPORT_FORMAT_OPTIONS: ExportOption[] = [
  {
    id: "png",
    label: "PNG (Gambar Rute HD)",
    extension: ".png",
    category: "image",
    description: "Grafik rute bersih berlatar putih lembut, tajam dan rapi tanpa distorsi.",
    iconName: "Image",
  },
  {
    id: "jpeg",
    label: "JPEG (Foto Rute Kompak)",
    extension: ".jpg",
    category: "image",
    description: "Format foto gambar rute terkompresi dengan ukuran file ringan.",
    iconName: "Image",
  },
  {
    id: "svg",
    label: "SVG (Grafis Vektor)",
    extension: ".svg",
    category: "image",
    description: "Vektor grafis rute tajam tanpa pecah untuk dokumen & desain grafis.",
    iconName: "FileCode",
  },
  {
    id: "geojson",
    label: "GeoJSON (.geojson)",
    extension: ".geojson",
    category: "spatial",
    description: "Format standar internasional GIS (QGIS, ArcGIS, Mapbox, Leaflet).",
    iconName: "Globe",
  },
  {
    id: "gpx",
    label: "GPX Track (.gpx)",
    extension: ".gpx",
    category: "spatial",
    description: "GPS Exchange Format untuk Garmin, Strava, OsmAnd, dan navigasi GPS.",
    iconName: "Navigation",
  },
  {
    id: "kml",
    label: "Google Earth KML (.kml)",
    extension: ".kml",
    category: "spatial",
    description: "Format visual spasial untuk Google Earth, Google Maps, dan My Maps.",
    iconName: "MapPin",
  },
  {
    id: "csv",
    label: "Tabel Koordinat CSV (.csv)",
    extension: ".csv",
    category: "data",
    description: "Tabel spreadsheet berisi nomor titik, koordinat Lat/Lng, dan nama jalan.",
    iconName: "Table",
  },
  {
    id: "json",
    label: "Data JSON Mentah (.json)",
    extension: ".json",
    category: "data",
    description: "Struktur data lengkap rute dengan atribut warna, gaya, dan metadata.",
    iconName: "Code",
  },
];

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-]/g, "_").toLowerCase();
}

const COPYRIGHT_TEXT = "build by Maps Global Studio with Iktiar ramadani";

/**
 * 1. Export as GeoJSON FeatureCollection
 */
export function exportAsGeoJSON(routes: TraversedRoadRecord[], title: string) {
  const features = routes.map((r) => {
    const parsedGeo = parseRouteGeoJSON(r.geojson);
    return {
      type: "Feature",
      id: r.id,
      properties: {
        id: r.id,
        name: r.name,
        folder: r.folder_name || "Tanpa Folder",
        color: r.color || "#22c55e",
        line_style: r.line_style || "solid",
        weight: r.weight || 4,
        distance_km: r.distance_km,
        duration_min: r.duration_min,
        created_at: r.created_at,
        updated_at: r.updated_at,
        copyright: COPYRIGHT_TEXT,
      },
      geometry: parsedGeo || {
        type: "LineString",
        coordinates: [],
      },
    };
  });

  const fc = {
    type: "FeatureCollection",
    name: title,
    copyright: COPYRIGHT_TEXT,
    attribution: COPYRIGHT_TEXT,
    features,
  };

  const blob = new Blob([JSON.stringify(fc, null, 2)], {
    type: "application/geo+json;charset=utf-8",
  });
  triggerDownload(blob, `${sanitizeFilename(title)}.geojson`);
}

/**
 * 2. Export as JSON
 */
export function exportAsJSON(routes: TraversedRoadRecord[], title: string) {
  const payload = {
    title,
    copyright: COPYRIGHT_TEXT,
    exported_at: new Date().toISOString(),
    total_routes: routes.length,
    routes: routes.map((r) => ({
      ...r,
      copyright: COPYRIGHT_TEXT,
      geojson: parseRouteGeoJSON(r.geojson),
    })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  triggerDownload(blob, `${sanitizeFilename(title)}.json`);
}

/**
 * 3. Export as GPX (GPS Exchange Format)
 */
export function exportAsGPX(routes: TraversedRoadRecord[], title: string) {
  let gpx = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${COPYRIGHT_TEXT} -->
<gpx version="1.1" creator="${COPYRIGHT_TEXT}" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(title)}</name>
    <desc>${COPYRIGHT_TEXT}</desc>
    <author>
      <name>Maps Global Studio with Iktiar ramadani</name>
    </author>
    <copyright author="Maps Global Studio with Iktiar ramadani">
      <year>${new Date().getFullYear()}</year>
      <license>${COPYRIGHT_TEXT}</license>
    </copyright>
    <time>${new Date().toISOString()}</time>
  </metadata>
`;

  routes.forEach((r) => {
    const geo = parseRouteGeoJSON(r.geojson);
    gpx += `  <trk>\n    <name>${escapeXml(r.name)}</name>\n    <desc>Folder: ${escapeXml(
      r.folder_name || "Tanpa Folder"
    )}, Jarak: ${r.distance_km || 0} km - ${COPYRIGHT_TEXT}</desc>\n    <trkseg>\n`;

    if (geo && geo.type === "LineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((c) => {
        if (Array.isArray(c) && c.length >= 2) {
          gpx += `      <trkpt lat="${c[1]}" lon="${c[0]}"></trkpt>\n`;
        }
      });
    } else if (geo && geo.type === "MultiLineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((line) => {
        if (Array.isArray(line)) {
          line.forEach((c) => {
            if (Array.isArray(c) && c.length >= 2) {
              gpx += `      <trkpt lat="${c[1]}" lon="${c[0]}"></trkpt>\n`;
            }
          });
        }
      });
    }

    gpx += `    </trkseg>\n  </trk>\n`;
  });

  gpx += `</gpx>`;

  const blob = new Blob([gpx], { type: "application/gpx+xml;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(title)}.gpx`);
}

/**
 * 4. Export as KML (Google Earth)
 */
export function exportAsKML(routes: TraversedRoadRecord[], title: string) {
  let kml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${COPYRIGHT_TEXT} -->
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${escapeXml(title)}</name>
    <description>${COPYRIGHT_TEXT}</description>
    <ExtendedData>
      <Data name="copyright">
        <value>${COPYRIGHT_TEXT}</value>
      </Data>
    </ExtendedData>
`;

  routes.forEach((r, idx) => {
    const geo = parseRouteGeoJSON(r.geojson);
    const hexColor = (r.color || "#22c55e").replace("#", "");
    const kmlColor = `ff${hexColor.slice(4, 6)}${hexColor.slice(2, 4)}${hexColor.slice(0, 2)}`;

    kml += `    <Style id="route_style_${idx}">
      <LineStyle>
        <color>${kmlColor}</color>
        <width>${r.weight || 4}</width>
      </LineStyle>
    </Style>
    <Placemark>
      <name>${escapeXml(r.name)}</name>
      <description>Folder: ${escapeXml(r.folder_name || "Tanpa Folder")}, Jarak: ${
      r.distance_km || 0
    } km, Waktu: ${r.duration_min || 0} menit - ${COPYRIGHT_TEXT}</description>
      <styleUrl>#route_style_${idx}</styleUrl>
`;

    let coordString = "";
    if (geo && geo.type === "LineString" && Array.isArray(geo.coordinates)) {
      coordString = geo.coordinates.map((c: any) => `${c[0]},${c[1]},0`).join(" ");
    } else if (geo && geo.type === "MultiLineString" && Array.isArray(geo.coordinates)) {
      const allCoords: string[] = [];
      geo.coordinates.forEach((line: any) => {
        if (Array.isArray(line)) {
          allCoords.push(...line.map((c: any) => `${c[0]},${c[1]},0`));
        }
      });
      coordString = allCoords.join(" ");
    }

    kml += `      <LineString>
        <extrude>1</extrude>
        <tessellate>1</tessellate>
        <coordinates>${coordString}</coordinates>
      </LineString>
    </Placemark>
`;
  });

  kml += `  </Document>\n</kml>`;

  const blob = new Blob([kml], { type: "application/vnd.google-earth.kml+xml;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(title)}.kml`);
}

/**
 * 5. Export as CSV Table
 */
export function exportAsCSV(routes: TraversedRoadRecord[], title: string) {
  const rows: string[] = [
    `# ${COPYRIGHT_TEXT}`,
    "Rute ID,Nama Rute,Folder,No Titik,Nama Titik / Jalan,Latitude,Longitude,Jarak Rute (km),Waktu Tempuh (menit),Warna Garis,Gaya Garis,Copyright",
  ];

  routes.forEach((r) => {
    const geo = parseRouteGeoJSON(r.geojson);
    const waypoints = (r as any).waypoints || [];

    if (waypoints.length > 0) {
      waypoints.forEach((wp: any, wIdx: number) => {
        rows.push(
          `"${r.id}","${escapeCsv(r.name)}","${escapeCsv(r.folder_name || "Tanpa Folder")}",${
            wIdx + 1
          },"${escapeCsv(wp.name || `Titik ${wIdx + 1}`)}",${wp.lat},${wp.lng},${r.distance_km || 0},${
            r.duration_min || 0
          },"${r.color || "#22c55e"}","${r.line_style || "solid"}","${COPYRIGHT_TEXT}"`
        );
      });
    } else if (geo && geo.type === "LineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((c: any, cIdx: number) => {
        rows.push(
          `"${r.id}","${escapeCsv(r.name)}","${escapeCsv(r.folder_name || "Tanpa Folder")}",${
            cIdx + 1
          },"Koordinat ${cIdx + 1}",${c[1]},${c[0]},${r.distance_km || 0},${r.duration_min || 0},"${
            r.color || "#22c55e"
          }","${r.line_style || "solid"}","${COPYRIGHT_TEXT}"`
        );
      });
    }
  });

  rows.push(`"${COPYRIGHT_TEXT}",,,,,,,,,,`);

  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(title)}.csv`);
}

/**
 * Web Mercator Projection Formulas for Exact Aspect Ratio
 */
function lngToMercatorX(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom) * 256;
}

function latToMercatorY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(Math.PI / 4 + rad / 2)) / Math.PI) / 2) * Math.pow(2, zoom) * 256
  );
}

/**
 * 6. Export as SVG Vector Graphic (Minimalist, Clean Soft White Background with 3-Level Bold Copyright)
 */
export function exportAsSVG(routes: TraversedRoadRecord[], title: string) {
  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;
  let hasCoords = false;

  routes.forEach((r) => {
    const geo = parseRouteGeoJSON(r.geojson);
    const checkPt = (lat: number, lng: number) => {
      hasCoords = true;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    };

    if (geo?.type === "LineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((c: any) => checkPt(c[1], c[0]));
    } else if (geo?.type === "MultiLineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((line: any) =>
        line.forEach((c: any) => checkPt(c[1], c[0]))
      );
    }
  });

  if (!hasCoords) {
    minLat = -7.3;
    maxLat = -7.2;
    minLng = 112.7;
    maxLng = 112.8;
  }

  const zoom = 12;
  const xMin = lngToMercatorX(minLng, zoom);
  const xMax = lngToMercatorX(maxLng, zoom);
  const yMin = latToMercatorY(maxLat, zoom);
  const yMax = latToMercatorY(minLat, zoom);

  const mercWidth = Math.max(xMax - xMin, 100);
  const mercHeight = Math.max(yMax - yMin, 100);

  const paddingX = 80;
  const paddingTop = 140;
  const paddingBottom = 140;
  const targetWidth = 1920;
  const scale = (targetWidth - paddingX * 2) / mercWidth;
  const targetHeight = Math.round(mercHeight * scale + paddingTop + paddingBottom);

  const project = (lat: number, lng: number): [number, number] => {
    const px = (lngToMercatorX(lng, zoom) - xMin) * scale + paddingX;
    const py = (latToMercatorY(lat, zoom) - yMin) * scale + paddingTop;
    return [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
  };

  let svgPaths = "";
  routes.forEach((r) => {
    const geo = parseRouteGeoJSON(r.geojson);
    const color = r.color || "#22c55e";
    const weight = Math.max(12, (r.weight || 4) * 2.5);
    const dash =
      r.line_style === "dashed"
        ? 'stroke-dasharray="24,14"'
        : r.line_style === "dotted"
        ? 'stroke-dasharray="8,14"'
        : "";

    if (geo?.type === "LineString" && Array.isArray(geo.coordinates)) {
      const d = geo.coordinates
        .map((c: any, i: number) => {
          const [x, y] = project(c[1], c[0]);
          return `${i === 0 ? "M" : "L"} ${x} ${y}`;
        })
        .join(" ");
      svgPaths += `    <path d="${d}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" ${dash} />\n`;
    } else if (geo?.type === "MultiLineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((line: any) => {
        const d = line
          .map((c: any, i: number) => {
            const [x, y] = project(c[1], c[0]);
            return `${i === 0 ? "M" : "L"} ${x} ${y}`;
          })
          .join(" ");
        svgPaths += `    <path d="${d}" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linecap="round" stroke-linejoin="round" ${dash} />\n`;
      });
    }
  });

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<!-- ${COPYRIGHT_TEXT} -->
<svg width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${targetWidth} ${targetHeight}" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc;">
  <!-- Clean soft white background -->
  <rect width="${targetWidth}" height="${targetHeight}" fill="#f8fafc"/>

  <!-- 1. Copyright Atas (Header Jelas & Tebal) -->
  <text x="50%" y="75" text-anchor="middle" fill="#0f172a" font-size="38" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="0.5">${COPYRIGHT_TEXT}</text>

  <!-- 2. Copyright Tengah (Watermark Buram Besar) -->
  <g transform="translate(${targetWidth / 2}, ${targetHeight / 2}) rotate(-18)">
    <text x="0" y="0" text-anchor="middle" fill="rgba(15, 23, 42, 0.16)" font-size="70" font-family="system-ui, -apple-system, sans-serif" font-weight="900" letter-spacing="1">${COPYRIGHT_TEXT}</text>
  </g>

  <!-- Route Polyline Paths -->
  <g id="routes">
${svgPaths}
  </g>

  <!-- 3. Copyright Bawah (Footer Jelas & Tebal) -->
  <text x="50%" y="${targetHeight - 55}" text-anchor="middle" fill="#0f172a" font-size="34" font-family="system-ui, -apple-system, sans-serif" font-weight="800" letter-spacing="0.5">${COPYRIGHT_TEXT}</text>
</svg>`;

  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  triggerDownload(blob, `${sanitizeFilename(title)}.svg`);
}

/**
 * 7. Export as PNG / JPEG Image (Clean Soft White Background, Bold Route Lines with 3-Level Prominent Copyright)
 */
export async function exportAsMapImage(
  routes: TraversedRoadRecord[],
  title: string,
  format: "png" | "jpeg" = "png"
): Promise<void> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Gagal menginisialisasi Canvas rendering");

  // 1. Hitung Bounding Box Geografis
  let minLat = 90,
    maxLat = -90,
    minLng = 180,
    maxLng = -180;
  let hasCoords = false;

  routes.forEach((r) => {
    const geo = parseRouteGeoJSON(r.geojson);
    const checkPt = (lat: number, lng: number) => {
      hasCoords = true;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    };

    if (geo?.type === "LineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((c: any) => checkPt(c[1], c[0]));
    } else if (geo?.type === "MultiLineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((line: any) =>
        line.forEach((c: any) => checkPt(c[1], c[0]))
      );
    }
  });

  if (!hasCoords) {
    minLat = -7.3;
    maxLat = -7.2;
    minLng = 112.7;
    maxLng = 112.8;
  }

  // Margin padding geografis 15% di sekeliling rute
  const dLat = maxLat - minLat;
  const dLng = maxLng - minLng;
  const padLat = Math.max(0.006, dLat * 0.15);
  const padLng = Math.max(0.006, dLng * 0.15);

  const boundedMinLat = Math.max(-85, minLat - padLat);
  const boundedMaxLat = Math.min(85, maxLat + padLat);
  const boundedMinLng = Math.max(-180, minLng - padLng);
  const boundedMaxLng = Math.min(180, maxLng + padLng);

  const zoom = 14;
  const worldXMin = lngToMercatorX(boundedMinLng, zoom);
  const worldXMax = lngToMercatorX(boundedMaxLng, zoom);
  const worldYMin = latToMercatorY(boundedMaxLat, zoom);
  const worldYMax = latToMercatorY(boundedMinLat, zoom);

  const naturalWidth = Math.max(100, Math.round(worldXMax - worldXMin));
  const naturalHeight = Math.max(100, Math.round(worldYMax - worldYMin));

  const targetWidth = 1920;
  const renderScale = Math.min(3.0, Math.max(0.6, targetWidth / naturalWidth));
  const canvasWidth = Math.round(naturalWidth * renderScale);
  
  // Padding atas dan bawah ekstra untuk copyright agar sangat lega dan terbaca
  const extraTopPadding = Math.max(140, Math.round(canvasWidth * 0.08));
  const extraBottomPadding = Math.max(140, Math.round(canvasWidth * 0.08));
  const canvasHeight = Math.round(naturalHeight * renderScale) + extraTopPadding + extraBottomPadding;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  // 2. Latar Belakang Warna Putih Soft yang Bersih & Rapi
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Ukuran font proporsional terhadap lebar canvas (terbaca sangat jelas pada 1920px)
  const headerFontSize = Math.max(34, Math.round(canvasWidth * 0.021));
  const watermarkFontSize = Math.max(54, Math.round(canvasWidth * 0.038));
  const footerFontSize = Math.max(30, Math.round(canvasWidth * 0.019));

  // 3. Copyright Bagian Atas (Header Jelas & Tebal)
  ctx.save();
  ctx.fillStyle = "#0f172a";
  ctx.font = `bold ${headerFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(COPYRIGHT_TEXT, canvasWidth / 2, Math.round(extraTopPadding * 0.5));
  ctx.restore();

  // 4. Copyright Bagian Tengah (Watermark Buram Besar)
  ctx.save();
  ctx.translate(canvasWidth / 2, canvasHeight / 2);
  ctx.rotate((-18 * Math.PI) / 180);
  ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
  ctx.font = `bold ${watermarkFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(COPYRIGHT_TEXT, 0, 0);
  ctx.restore();

  // Fungsi Proyeksi Geografis ke Piksel Canvas (Bebas Distorsi)
  const project = (lat: number, lng: number): [number, number] => {
    const wx = lngToMercatorX(lng, zoom);
    const wy = latToMercatorY(lat, zoom);
    const px = (wx - worldXMin) * renderScale;
    const py = (wy - worldYMin) * renderScale + extraTopPadding;
    return [px, py];
  };

  // 5. Gambar Garis Rute Halus, Tebal & Tajam (Murni Garis Saja)
  const baseWeight = Math.max(12, Math.round(canvasWidth * 0.007));

  routes.forEach((r) => {
    const geo = parseRouteGeoJSON(r.geojson);
    const color = r.color || "#22c55e";

    const drawPathCoords = (coords: any[]) => {
      if (coords.length < 2) return;
      ctx.beginPath();
      coords.forEach((c: any, i: number) => {
        const [x, y] = project(c[1], c[0]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
    };

    // Lapisan 1: Shadow Halus di Belakang Garis
    ctx.save();
    ctx.strokeStyle = "rgba(0, 0, 0, 0.10)";
    ctx.lineWidth = baseWeight + 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "rgba(0, 0, 0, 0.18)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;

    if (geo?.type === "LineString" && Array.isArray(geo.coordinates)) {
      drawPathCoords(geo.coordinates);
      ctx.stroke();
    } else if (geo?.type === "MultiLineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((line: any) => {
        drawPathCoords(line);
        ctx.stroke();
      });
    }
    ctx.restore();

    // Lapisan 2: Garis Rute Utama Berwarna Tebal & Jelas
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = baseWeight;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (r.line_style === "dashed") {
      ctx.setLineDash([26, 16]);
    } else if (r.line_style === "dotted") {
      ctx.setLineDash([8, 14]);
    }

    if (geo?.type === "LineString" && Array.isArray(geo.coordinates)) {
      drawPathCoords(geo.coordinates);
      ctx.stroke();
    } else if (geo?.type === "MultiLineString" && Array.isArray(geo.coordinates)) {
      geo.coordinates.forEach((line: any) => {
        drawPathCoords(line);
        ctx.stroke();
      });
    }
    ctx.restore();
  });

  // 6. Copyright Bagian Bawah (Footer Jelas & Tebal)
  ctx.save();
  ctx.fillStyle = "#0f172a";
  ctx.font = `bold ${footerFontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    COPYRIGHT_TEXT,
    canvasWidth / 2,
    canvasHeight - Math.round(extraBottomPadding * 0.45)
  );
  ctx.restore();

  // 7. Convert to File Blob and Download
  const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
  const ext = format === "jpeg" ? ".jpg" : ".png";

  canvas.toBlob(
    (blob) => {
      if (blob) {
        triggerDownload(blob, `${sanitizeFilename(title)}${ext}`);
      }
    },
    mimeType,
    0.95
  );
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function escapeCsv(str: string): string {
  return str.replace(/"/g, '""');
}
