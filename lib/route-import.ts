/**
 * Route Import Parser & Processor (Module 5)
 * Supports:
 * - GeoJSON (.json, .geojson)
 * - GPX (.gpx) from Strava, Garmin, Komoot, OsmAnd, Google My Maps
 * - KML (.kml) from Google Earth & Google My Maps
 * - CSV / TXT (Lat, Lng pairs)
 * - Google Location History JSON
 * 
 * Provides two processing modes:
 * 1. "snap_roads" (Sesuaikan dengan jalan yang ada - via OSRM / OpenStreetMap)
 * 2. "keep_original" (Biarkan seperti awal - preserve exact raw geometry)
 */

export interface ImportedTrackPoint {
  lat: number;
  lng: number;
  name?: string;
}

export interface ParseImportResult {
  success: boolean;
  points: ImportedTrackPoint[];
  fileName: string;
  fileType: "geojson" | "gpx" | "kml" | "csv" | "unknown";
  error?: string;
  totalRawPoints: number;
}

/**
 * Parsing file teks GeoJSON, GPX, KML, atau CSV menjadi array koordinat [lat, lng]
 */
export function parseRouteFile(content: string, fileName: string): ParseImportResult {
  const lowerName = fileName.toLowerCase();
  const trimmed = content.trim();

  try {
    // 1. Coba JSON / GeoJSON
    if (
      lowerName.endsWith(".json") ||
      lowerName.endsWith(".geojson") ||
      trimmed.startsWith("{") ||
      trimmed.startsWith("[")
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        const points: ImportedTrackPoint[] = [];

        const extractFromCoords = (coords: unknown) => {
          if (!Array.isArray(coords)) return;
          if (typeof coords[0] === "number" && typeof coords[1] === "number") {
            // Standar GeoJSON adalah [lng, lat]
            const lng = Number(coords[0]);
            const lat = Number(coords[1]);
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              points.push({ lat, lng });
            }
          } else {
            coords.forEach(extractFromCoords);
          }
        };

        if (Array.isArray(parsed)) {
          // Format Array of Objects [{lat, lng}] atau Array of Coordinates [[lng, lat]]
          for (let i = 0; i < parsed.length; i++) {
            const item = parsed[i];
            if (item && typeof item === "object") {
              if ("lat" in item && "lng" in item) {
                const lat = Number((item as any).lat);
                const lng = Number((item as any).lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                  points.push({ lat, lng, name: (item as any).name || `Titik ${i + 1}` });
                }
              } else if ("latitude" in item && "longitude" in item) {
                const lat = Number((item as any).latitude);
                const lng = Number((item as any).longitude);
                if (!isNaN(lat) && !isNaN(lng)) {
                  points.push({ lat, lng, name: (item as any).name || `Titik ${i + 1}` });
                }
              } else if ("latitudeE7" in item && "longitudeE7" in item) {
                // Google Takeout Location History format
                const lat = Number((item as any).latitudeE7) / 1e7;
                const lng = Number((item as any).longitudeE7) / 1e7;
                if (!isNaN(lat) && !isNaN(lng)) {
                  points.push({ lat, lng, name: `GPS ${i + 1}` });
                }
              } else if (Array.isArray(item) && item.length >= 2) {
                extractFromCoords(item);
              }
            }
          }
        } else if (parsed.type === "FeatureCollection" && Array.isArray(parsed.features)) {
          for (const feature of parsed.features) {
            if (feature.geometry?.coordinates) {
              extractFromCoords(feature.geometry.coordinates);
            }
          }
        } else if (parsed.type === "Feature" && parsed.geometry?.coordinates) {
          extractFromCoords(parsed.geometry.coordinates);
        } else if (parsed.coordinates) {
          extractFromCoords(parsed.coordinates);
        } else if (Array.isArray(parsed.locations)) {
          // Google Takeout format
          parsed.locations.forEach((loc: any, idx: number) => {
            const lat = Number(loc.latitudeE7) / 1e7;
            const lng = Number(loc.longitudeE7) / 1e7;
            if (!isNaN(lat) && !isNaN(lng)) {
              points.push({ lat, lng, name: `Lokasi ${idx + 1}` });
            }
          });
        }

        if (points.length > 0) {
          return {
            success: true,
            points,
            fileName,
            fileType: "geojson",
            totalRawPoints: points.length,
          };
        }
      } catch {
        // Lanjut ke parser berikutnya jika bukan JSON valid
      }
    }

    // 2. Coba GPX (XML & Regex)
    if (lowerName.endsWith(".gpx") || trimmed.includes("<gpx") || trimmed.includes("<trkpt") || trimmed.includes("<wpt")) {
      const points: ImportedTrackPoint[] = [];

      // A. Coba DOMParser
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(trimmed, "application/xml");
        const parseError = xmlDoc.querySelector("parsererror");
        if (!parseError) {
          const ptElements = xmlDoc.querySelectorAll("trkpt, rtept, wpt");
          ptElements.forEach((el, idx) => {
            const lat = parseFloat(el.getAttribute("lat") || "");
            const lon = parseFloat(el.getAttribute("lon") || "");
            const nameEl = el.querySelector("name");
            const name = nameEl?.textContent || `Titik ${idx + 1}`;
            if (!isNaN(lat) && !isNaN(lon)) {
              points.push({ lat, lng: lon, name });
            }
          });
        }
      } catch {
        // Fallback ke regex
      }

      // B. Fallback Regex jika DOMParser gagal karena namespace atau XML karakter kotor
      if (points.length === 0) {
        const gpxRegex = /<(?:[a-zA-Z0-9]+:)?(?:trkpt|rtept|wpt)[^>]*lat=["']([-0-9.]+)["'][^>]*lon=["']([-0-9.]+)["']/gi;
        let match;
        while ((match = gpxRegex.exec(trimmed)) !== null) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            points.push({ lat, lng, name: `Titik ${points.length + 1}` });
          }
        }
        // Cek juga urutan lon sebelum lat
        if (points.length === 0) {
          const gpxRevRegex = /<(?:[a-zA-Z0-9]+:)?(?:trkpt|rtept|wpt)[^>]*lon=["']([-0-9.]+)["'][^>]*lat=["']([-0-9.]+)["']/gi;
          while ((match = gpxRevRegex.exec(trimmed)) !== null) {
            const lng = parseFloat(match[1]);
            const lat = parseFloat(match[2]);
            if (!isNaN(lat) && !isNaN(lng)) {
              points.push({ lat, lng, name: `Titik ${points.length + 1}` });
            }
          }
        }
      }

      if (points.length > 0) {
        return {
          success: true,
          points,
          fileName,
          fileType: "gpx",
          totalRawPoints: points.length,
        };
      }
    }

    // 3. Coba KML (Google Earth / Google My Maps)
    if (lowerName.endsWith(".kml") || trimmed.includes("<kml") || trimmed.includes("<coordinates>")) {
      const points: ImportedTrackPoint[] = [];

      // A. Coba DOMParser
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(trimmed, "application/xml");
        const coordElements = xmlDoc.querySelectorAll("coordinates");
        coordElements.forEach((el) => {
          const text = el.textContent || "";
          const lines = text.trim().split(/\s+/);
          lines.forEach((line) => {
            const parts = line.split(",");
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                points.push({ lat, lng });
              }
            }
          });
        });
      } catch {
        // Fallback regex
      }

      // B. Fallback Regex KML
      if (points.length === 0) {
        const kmlCoordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/gi;
        let coordMatch;
        while ((coordMatch = kmlCoordRegex.exec(trimmed)) !== null) {
          const rawBlock = coordMatch[1].trim();
          const tuples = rawBlock.split(/\s+/);
          tuples.forEach((tuple) => {
            const parts = tuple.split(",");
            if (parts.length >= 2) {
              const lng = parseFloat(parts[0]);
              const lat = parseFloat(parts[1]);
              if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                points.push({ lat, lng });
              }
            }
          });
        }
      }

      if (points.length > 0) {
        return {
          success: true,
          points,
          fileName,
          fileType: "kml",
          totalRawPoints: points.length,
        };
      }
    }

    // 4. Coba CSV / Baris Angka Koordinat (lat, lng atau lng, lat)
    const lines = trimmed.split(/[\r\n]+/);
    if (lines.length >= 2) {
      const points: ImportedTrackPoint[] = [];
      for (const line of lines) {
        const clean = line.trim();
        if (!clean || clean.startsWith("#") || clean.toLowerCase().includes("latitude")) continue;
        const parts = clean.split(/[,;\t]+/);
        if (parts.length >= 2) {
          const val1 = parseFloat(parts[0]);
          const val2 = parseFloat(parts[1]);
          if (!isNaN(val1) && !isNaN(val2)) {
            // Indonesia: Lat berkisar -11 s/d 6, Lng berkisar 95 s/d 141
            let lat = val1;
            let lng = val2;
            if (Math.abs(val1) > 90 && Math.abs(val2) <= 90) {
              // Terbalik [lng, lat]
              lng = val1;
              lat = val2;
            }
            if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
              points.push({ lat, lng, name: `Titik ${points.length + 1}` });
            }
          }
        }
      }

      if (points.length > 0) {
        return {
          success: true,
          points,
          fileName,
          fileType: "csv",
          totalRawPoints: points.length,
        };
      }
    }

    return {
      success: false,
      points: [],
      fileName,
      fileType: "unknown",
      error: "Format file tidak dikenali. Pastikan file berisi data rute GeoJSON, GPX, KML, atau CSV koordinat yang valid.",
      totalRawPoints: 0,
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      success: false,
      points: [],
      fileName,
      fileType: "unknown",
      error: `Gagal membaca file: ${error?.message || "Kesalahan format file"}`,
      totalRawPoints: 0,
    };
  }
}

/**
 * Downsampling / Decimation koordinat agar jumlah titik efisien untuk OSRM snapping
 * Mengambil titik awal, titik akhir, dan titik-titik sampel berjarak seragam
 */
export function downsamplePoints(points: ImportedTrackPoint[], maxPoints: number = 25): ImportedTrackPoint[] {
  if (points.length <= maxPoints) return points;

  const result: ImportedTrackPoint[] = [];
  result.push(points[0]); // Titik awal selalu diikutsertakan

  const step = (points.length - 1) / (maxPoints - 1);
  for (let i = 1; i < maxPoints - 1; i++) {
    const index = Math.round(i * step);
    if (index > 0 && index < points.length - 1) {
      result.push(points[index]);
    }
  }

  result.push(points[points.length - 1]); // Titik akhir selalu diikutsertakan
  return result;
}
