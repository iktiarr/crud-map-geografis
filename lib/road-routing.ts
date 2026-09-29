/**
 * Road Routing & Geocoding Service (Module 5)
 * Reads real-world road networks using OSRM (Open Source Routing Machine),
 * supports multi-stop waypoints (N points), and resolves street names using OpenStreetMap Nominatim.
 */

export interface WaypointItem {
  id?: string;
  name?: string;
  lat: number;
  lng: number;
  isDisconnected?: boolean; // Jika true, titik ini memutus jalur dengan titik sebelumnya (jalan lain)
  connectionType?: "sequential" | "disconnected" | "nearest_branch"; // tipe hubungan rute
  branchTargetCoord?: [number, number]; // Koordinat sambungan cabang [lat, lng]
}

export interface AlternativeRouteOption {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lng, lat]
  leafletPoints: [number, number][]; // [lat, lng]
  distanceKm: number;
  durationMin: number;
}

export interface MultiPointRouteResult {
  success: boolean;
  coordinates: [number, number][] | [number, number][][]; // [lng, lat] for GeoJSON LineString / MultiLineString
  leafletPoints: [number, number][] | [number, number][][]; // [lat, lng] for Leaflet
  distanceKm: number;
  durationMin: number;
  streetNames: string[];
  summary: string;
  legs: {
    fromName?: string;
    toName?: string;
    distanceKm: number;
    durationMin: number;
    isBranch?: boolean;
  }[];
  alternatives?: AlternativeRouteOption[];
}

export interface PresetRoadPoint {
  id: string;
  name: string;
  roadName: string;
  city: string;
  lat: number;
  lng: number;
}

export const PRESET_ROAD_POINTS: PresetRoadPoint[] = [
  // Wilayah Kuningan (Jawa Barat)
  {
    id: "kng-1",
    name: "Taman Kota Kuningan",
    roadName: "Jl. Veteran",
    city: "Kuningan",
    lat: -6.9772,
    lng: 108.4838,
  },
  {
    id: "kng-2",
    name: "Stadion Mashud Wisnusaputra",
    roadName: "Jl. Siliwangi",
    city: "Kuningan",
    lat: -6.9685,
    lng: 108.4872,
  },
  {
    id: "kng-3",
    name: "Kawasan Wisata Cigugur",
    roadName: "Jl. Raya Cigugur",
    city: "Kuningan",
    lat: -6.9856,
    lng: 108.4593,
  },
  {
    id: "kng-4",
    name: "Bundaran Cijoho",
    roadName: "Jl. R.E. Martadinata",
    city: "Kuningan",
    lat: -6.9621,
    lng: 108.4905,
  },
  {
    id: "kng-5",
    name: "Terminal Tipe A Kertawangunan",
    roadName: "Jl. Baru Lingkar Timur",
    city: "Kuningan",
    lat: -6.9798,
    lng: 108.5284,
  },
  {
    id: "kng-6",
    name: "Gedung Perundingan Linggarjati",
    roadName: "Jl. Linggajati",
    city: "Kuningan",
    lat: -6.8775,
    lng: 108.4756,
  },

  // Wilayah Bandung
  {
    id: "bdg-1",
    name: "Gedung Sate Bandung",
    roadName: "Jl. Diponegoro",
    city: "Bandung",
    lat: -6.9024,
    lng: 107.6186,
  },
  {
    id: "bdg-2",
    name: "Alun-Alun Kota Bandung",
    roadName: "Jl. Asia Afrika",
    city: "Bandung",
    lat: -6.9218,
    lng: 107.6074,
  },
  {
    id: "bdg-3",
    name: "Institut Teknologi Bandung (ITB)",
    roadName: "Jl. Ganesa",
    city: "Bandung",
    lat: -6.8915,
    lng: 107.6107,
  },

  // Wilayah Jakarta
  {
    id: "jkt-1",
    name: "Monumen Nasional (Monas)",
    roadName: "Jl. Medan Merdeka Barat",
    city: "Jakarta",
    lat: -6.1754,
    lng: 106.8272,
  },
  {
    id: "jkt-2",
    name: "Bundaran HI",
    roadName: "Jl. M.H. Thamrin",
    city: "Jakarta",
    lat: -6.1950,
    lng: 106.8231,
  },
  {
    id: "jkt-3",
    name: "Gelora Bung Karno (GBK)",
    roadName: "Jl. Jenderal Sudirman",
    city: "Jakarta",
    lat: -6.2185,
    lng: 106.8018,
  },
];



/**
 * Cari koordinat terdekat pada suatu jalur rute (untuk membentuk cabang persimpangan huruf T)
 */
export function findNearestCoordinateOnPath(
  targetLat: number,
  targetLng: number,
  pathCoords: [number, number][] // [lat, lng]
): [number, number] {
  if (pathCoords.length === 0) return [targetLat, targetLng];
  let minDistance = Infinity;
  let nearestPoint: [number, number] = pathCoords[0];

  for (let i = 0; i < pathCoords.length - 1; i++) {
    const p1 = pathCoords[i];
    const p2 = pathCoords[i + 1];

    // Cek titik puncak vertex p1
    const d1 = calculateHaversine(targetLat, targetLng, p1[0], p1[1]);
    if (d1 < minDistance) {
      minDistance = d1;
      nearestPoint = p1;
    }

    // Cek proyeksi ortogonal tegak lurus pada ruas garis p1 -> p2
    const dx = p2[1] - p1[1];
    const dy = p2[0] - p1[0];
    if (dx !== 0 || dy !== 0) {
      const t = Math.max(
        0,
        Math.min(1, ((targetLng - p1[1]) * dx + (targetLat - p1[0]) * dy) / (dx * dx + dy * dy))
      );
      const projLat = p1[0] + t * dy;
      const projLng = p1[1] + t * dx;
      const dProj = calculateHaversine(targetLat, targetLng, projLat, projLng);
      if (dProj < minDistance) {
        minDistance = dProj;
        nearestPoint = [projLat, projLng];
      }
    }
  }

  // Cek titik puncak vertex terakhir
  const pLast = pathCoords[pathCoords.length - 1];
  const dLast = calculateHaversine(targetLat, targetLng, pLast[0], pLast[1]);
  if (dLast < minDistance) {
    nearestPoint = pLast;
  }

  return nearestPoint;
}

/**
 * Helper untuk query OSRM pada 1 segmen rute jalan
 */
async function queryOsrmSingleSegment(
  points: { lat: number; lng: number; name?: string }[],
  mode: "driving" | "bike" | "foot" = "driving"
): Promise<{
  coords: [number, number][];
  leafletPoints: [number, number][];
  distanceKm: number;
  durationMin: number;
  streetNames: string[];
  legs: MultiPointRouteResult["legs"];
  alternatives?: AlternativeRouteOption[];
}> {
  if (points.length < 2) {
    return {
      coords: [],
      leafletPoints: [],
      distanceKm: 0,
      durationMin: 0,
      streetNames: [],
      legs: [],
    };
  }

  const profile = mode === "foot" ? "foot" : mode === "bike" ? "bicycle" : "driving";
  const coordsParam = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coordsParam}?overview=full&geometries=geojson&steps=true&alternatives=true`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const coords = route.geometry.coordinates as [number, number][]; // [lng, lat]
      const distanceKm = Number((route.distance / 1000).toFixed(2));
      const durationMin = Math.round(route.duration / 60) || 1;

      const streetNamesSet = new Set<string>();
      const legs: MultiPointRouteResult["legs"] = [];

      if (route.legs && Array.isArray(route.legs)) {
        route.legs.forEach((leg: { distance: number; duration: number; steps?: { name?: string }[] }, idx: number) => {
          legs.push({
            fromName: points[idx]?.name || `Titik ${idx + 1}`,
            toName: points[idx + 1]?.name || `Titik ${idx + 2}`,
            distanceKm: Number((leg.distance / 1000).toFixed(2)),
            durationMin: Math.round(leg.duration / 60) || 1,
          });

          if (leg.steps) {
            leg.steps.forEach((s) => {
              if (s.name && s.name.trim() !== "") {
                streetNamesSet.add(s.name.trim());
              }
            });
          }
        });
      }

      const streetNames = Array.from(streetNamesSet);
      const leafletPoints: [number, number][] = coords.map((c) => [c[1], c[0]]);

      const alternatives: AlternativeRouteOption[] = [];
      if (data.routes.length > 1) {
        data.routes.slice(1).forEach((altRoute: { geometry: { coordinates: [number, number][] }; distance: number; duration: number; legs?: { steps?: { name?: string }[] }[] }, aIdx: number) => {
          const altCoords = altRoute.geometry.coordinates;
          const altLeafletPoints: [number, number][] = altCoords.map((c) => [c[1], c[0]]);
          const altDist = Number((altRoute.distance / 1000).toFixed(2));
          const altDur = Math.round(altRoute.duration / 60) || 1;
          const altNames = new Set<string>();
          if (altRoute.legs) {
            altRoute.legs.forEach((l) => {
              if (l.steps) {
                l.steps.forEach((s) => {
                  if (s.name && s.name.trim()) altNames.add(s.name.trim());
                });
              }
            });
          }
          const altTitle =
            altNames.size > 0
              ? Array.from(altNames).slice(0, 2).join(" ➔ ")
              : `Jalur Alternatif ${aIdx + 1}`;

          alternatives.push({
            id: `alt-${aIdx + 1}`,
            name: altTitle,
            coordinates: altCoords,
            leafletPoints: altLeafletPoints,
            distanceKm: altDist,
            durationMin: altDur,
          });
        });
      }

      return {
        coords,
        leafletPoints,
        distanceKm,
        durationMin,
        streetNames,
        legs,
        alternatives,
      };
    }

    throw new Error("No route found in OSRM response");
  } catch (err) {
    console.warn("OSRM single segment routing fallback:", err);
    const fallbackLeafletPoints: [number, number][] = [];
    let totalDist = 0;
    const legs: MultiPointRouteResult["legs"] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const segmentPoints = generateInterpolatedPath(p1.lat, p1.lng, p2.lat, p2.lng, 10);
      const segDist = calculateHaversine(p1.lat, p1.lng, p2.lat, p2.lng);
      totalDist += segDist;

      legs.push({
        fromName: p1.name || `Titik ${i + 1}`,
        toName: p2.name || `Titik ${i + 2}`,
        distanceKm: Number(segDist.toFixed(2)),
        durationMin: Math.max(1, Math.round((segDist / 35) * 60)),
      });

      if (i === 0) {
        fallbackLeafletPoints.push(...segmentPoints);
      } else {
        fallbackLeafletPoints.push(...segmentPoints.slice(1));
      }
    }

    return {
      coords: fallbackLeafletPoints.map((c) => [c[1], c[0]]),
      leafletPoints: fallbackLeafletPoints,
      distanceKm: Number(totalDist.toFixed(2)),
      durationMin: Math.max(1, Math.round((totalDist / 35) * 60)),
      streetNames: [],
      legs,
    };
  }
}

/**
 * Multi-point road route calculation
 * Mendukung titik sambung berurutan, titik rute terpisah (buat jalan lain), dan cabang ke rute terdekat (persimpangan huruf T)
 */
export async function calculateMultiPointRoadRoute(
  waypoints: WaypointItem[],
  mode: "driving" | "bike" | "foot" = "driving"
): Promise<MultiPointRouteResult> {
  if (waypoints.length < 2) {
    return {
      success: false,
      coordinates: [],
      leafletPoints: [],
      distanceKm: 0,
      durationMin: 0,
      streetNames: [],
      summary: "Memerlukan minimal 2 titik untuk perutean jalan",
      legs: [],
    };
  }

  // Cek apakah ada titik yang dipisah (jalan lain) atau cabang rute terdekat
  const hasBranchOrDisconnect = waypoints.some(
    (w, idx) =>
      idx > 0 &&
      (w.isDisconnected ||
        w.connectionType === "disconnected" ||
        w.connectionType === "nearest_branch")
  );

  // Jika semua titik normal berurutan, jalankan query OSRM tunggal
  if (!hasBranchOrDisconnect) {
    try {
      const res = await queryOsrmSingleSegment(waypoints, mode);
      return {
        success: true,
        coordinates: res.coords,
        leafletPoints: res.leafletPoints,
        distanceKm: res.distanceKm,
        durationMin: res.durationMin,
        streetNames: res.streetNames,
        summary:
          res.streetNames.length > 0
            ? res.streetNames.slice(0, 3).join(" ➔ ")
            : `${waypoints.length} Titik Terhubung`,
        legs: res.legs,
        alternatives: res.alternatives,
      };
    } catch (err) {
      console.error("Gagal kalkulasi rute normal:", err);
    }
  }

  // Multi-segment & Branching (Pisah Rute / Cabang Huruf T)
  try {
    interface SegmentPlan {
      points: WaypointItem[];
      isBranch?: boolean;
    }

    const segmentPlans: SegmentPlan[] = [];
    let currentGroup: WaypointItem[] = [waypoints[0]];

    for (let i = 1; i < waypoints.length; i++) {
      const wp = waypoints[i];
      const isDisc = wp.connectionType === "disconnected" || wp.isDisconnected;
      const isBranch = wp.connectionType === "nearest_branch";

      if (isBranch) {
        if (currentGroup.length >= 2) {
          segmentPlans.push({ points: [...currentGroup] });
        }
        // Tandai segmen cabang
        segmentPlans.push({ points: [wp], isBranch: true });
        currentGroup = [wp];
      } else if (isDisc) {
        if (currentGroup.length >= 2) {
          segmentPlans.push({ points: [...currentGroup] });
        }
        // Titik ini memulai jalan lain / segmen baru
        currentGroup = [wp];
      } else {
        currentGroup.push(wp);
      }
    }

    if (currentGroup.length >= 2) {
      segmentPlans.push({ points: [...currentGroup] });
    }

    const calculatedSegments: {
      coords: [number, number][];
      leafletPoints: [number, number][];
      distanceKm: number;
      durationMin: number;
      streetNames: string[];
      legs: MultiPointRouteResult["legs"];
    }[] = [];

    const accumulatedLeafletPoints: [number, number][] = [];

    for (let sIdx = 0; sIdx < segmentPlans.length; sIdx++) {
      const plan = segmentPlans[sIdx];

      if (plan.isBranch) {
        // Cabang Huruf T: hubungkan titik target ke koordinat terdekat pada rute yang sudah dihitung
        const targetWp = plan.points[0];
        let branchOrigin: [number, number] = [waypoints[0].lat, waypoints[0].lng];

        if (accumulatedLeafletPoints.length > 0) {
          branchOrigin = findNearestCoordinateOnPath(
            targetWp.lat,
            targetWp.lng,
            accumulatedLeafletPoints
          );
        }

        const branchPoints = [
          {
            id: `junction-${sIdx}`,
            name: "Simpang Rute Terdekat",
            lat: branchOrigin[0],
            lng: branchOrigin[1],
          },
          targetWp,
        ];

        const segRes = await queryOsrmSingleSegment(branchPoints, mode);
        if (segRes.leafletPoints.length >= 2) {
          accumulatedLeafletPoints.push(...segRes.leafletPoints);
          calculatedSegments.push({
            ...segRes,
            legs: segRes.legs.map((l) => ({ ...l, isBranch: true })),
          });
        }
      } else if (plan.points.length >= 2) {
        const segRes = await queryOsrmSingleSegment(plan.points, mode);
        if (segRes.leafletPoints.length >= 2) {
          accumulatedLeafletPoints.push(...segRes.leafletPoints);
          calculatedSegments.push(segRes);
        }
      }
    }

    if (calculatedSegments.length === 0) {
      return {
        success: false,
        coordinates: [],
        leafletPoints: [],
        distanceKm: 0,
        durationMin: 0,
        streetNames: [],
        summary: "Tidak ada segmen rute jalan yang valid",
        legs: [],
      };
    }

    let totalDist = 0;
    let totalDur = 0;
    const combinedStreetNames = new Set<string>();
    const combinedLegs: MultiPointRouteResult["legs"] = [];

    calculatedSegments.forEach((seg) => {
      totalDist += seg.distanceKm;
      totalDur += seg.durationMin;
      seg.streetNames.forEach((n) => combinedStreetNames.add(n));
      combinedLegs.push(...seg.legs);
    });

    const isSingleSeg = calculatedSegments.length === 1;
    const finalCoordinates = isSingleSeg
      ? calculatedSegments[0].coords
      : calculatedSegments.map((s) => s.coords);
    const finalLeafletPoints = isSingleSeg
      ? calculatedSegments[0].leafletPoints
      : calculatedSegments.map((s) => s.leafletPoints);

    return {
      success: true,
      coordinates: finalCoordinates,
      leafletPoints: finalLeafletPoints,
      distanceKm: Number(totalDist.toFixed(2)),
      durationMin: totalDur,
      streetNames: Array.from(combinedStreetNames),
      summary: `${waypoints.length} Titik (${calculatedSegments.length} Jalur & Cabang)`,
      legs: combinedLegs,
    };
  } catch (err) {
    console.error("Gagal kalkulasi multi-segment/branching:", err);
    return {
      success: false,
      coordinates: [],
      leafletPoints: [],
      distanceKm: 0,
      durationMin: 0,
      streetNames: [],
      summary: "Gagal menghitung jalur rute",
      legs: [],
    };
  }
}

/**
 * Legacy 2-point calculation (wraps multi-point)
 */
export async function calculateRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  mode: "driving" | "bike" | "foot" = "driving"
) {
  return calculateMultiPointRoadRoute(
    [
      { lat: startLat, lng: startLng },
      { lat: endLat, lng: endLng },
    ],
    mode
  );
}

/**
 * Reverse Geocode: resolve street/road name for a given coordinate
 */
export async function reverseGeocodeRoadName(lat: number, lng: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Accept-Language": "id,en",
        "User-Agent": "GeospatialStudioRoadRouter/1.0",
      },
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const road =
        addr.road ||
        addr.pedestrian ||
        addr.street ||
        addr.neighbourhood ||
        addr.suburb ||
        data.display_name?.split(",")[0];
      if (road) return road;
    }
  } catch (e) {
    console.warn("Reverse geocode notice:", e);
  }

  return `Titik (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}



/**
 * Haversine formula calculation (km)
 */
export function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Fallback curved interpolation between two coordinates
 */
function generateInterpolatedPath(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  numPoints = 12
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = lat1 + (lat2 - lat1) * t;
    const lng = lng1 + (lng2 - lng1) * t;
    points.push([lat, lng]);
  }
  return points;
}

/**
 * Calculate the best insertion index for a new point among existing waypoints.
 * Finds the segment (between waypoints[i] and waypoints[i+1]) closest to the given coordinates.
 */
export function findBestInsertionIndex(
  clickLat: number,
  clickLng: number,
  waypoints: { lat: number; lng: number }[]
): number {
  if (waypoints.length <= 1) return waypoints.length;
  if (waypoints.length === 2) return 1;

  let bestIndex = 1;
  let minDistanceSq = Infinity;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const vLat = waypoints[i].lat;
    const vLng = waypoints[i].lng;
    const wLat = waypoints[i + 1].lat;
    const wLng = waypoints[i + 1].lng;

    const l2 = (vLat - wLat) ** 2 + (vLng - wLng) ** 2;
    let distSq: number;

    if (l2 === 0) {
      distSq = (clickLat - vLat) ** 2 + (clickLng - vLng) ** 2;
    } else {
      let t = ((clickLat - vLat) * (wLat - vLat) + (clickLng - vLng) * (wLng - vLng)) / l2;
      t = Math.max(0, Math.min(1, t));
      const projLat = vLat + t * (wLat - vLat);
      const projLng = vLng + t * (wLng - vLng);
      distSq = (clickLat - projLat) ** 2 + (clickLng - projLng) ** 2;
    }

    if (distSq < minDistanceSq) {
      minDistanceSq = distSq;
      bestIndex = i + 1;
    }
  }

  return bestIndex;
}

