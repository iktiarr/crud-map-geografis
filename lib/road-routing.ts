/**
 * Road Routing & Geocoding Service (Module 5)
 * Reads real-world road networks using OSRM (Open Source Routing Machine),
 * supports multi-stop waypoints (N points), multi-server fallback, batch querying,
 * and resolves street names using OpenStreetMap Nominatim.
 */

export interface WaypointItem {
  id?: string;
  name?: string;
  lat: number;
  lng: number;
  isDisconnected?: boolean; // Jika true, titik ini memutus jalur dengan titik sebelumnya (jalan lain)
  connectionType?: "sequential" | "disconnected" | "nearest_branch" | "direct_snap"; // tipe hubungan rute
  branchTargetCoord?: [number, number]; // Koordinat sambungan cabang [lat, lng]
}

export type ConnectionMode =
  | "sequential"
  | "nearest"
  | "direct_line"
  | "loop_closed"
  | "smart_direct";

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

// OSRM Server Mirrors untuk keandalan maksimal dan bebas rate-limit
const OSRM_SERVERS = [
  "https://router.project-osrm.org/route/v1/driving",
  "https://routing.openstreetmap.de/routed-car/route/v1/driving",
  "https://routing.openstreetmap.de/routed-bike/route/v1/driving",
];

const osrmSegmentCache = new Map<
  string,
  {
    coords: [number, number][];
    leafletPoints: [number, number][];
    distanceKm: number;
    durationMin: number;
    streetNames: string[];
    legs: MultiPointRouteResult["legs"];
  }
>();

export function clearOsrmCache() {
  osrmSegmentCache.clear();
}

/**
 * Fetch OSRM route dengan multi-server fallback dan retry otomatis
 */
async function fetchOsrmWithFallbacks(
  coordsStr: string,
  extraParams = "overview=full&geometries=geojson&steps=true&continue_straight=true"
): Promise<{
  geometry: { coordinates: [number, number][] };
  legs: Array<{
    distance: number;
    duration: number;
    summary?: string;
    steps?: Array<{ name?: string }>;
  }>;
  distance: number;
  duration: number;
} | null> {
  for (const serverUrl of OSRM_SERVERS) {
    const url = `${serverUrl}/${coordsStr}?${extraParams}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429 || response.status >= 500) {
        continue;
      }
      if (!response.ok) continue;

      const data = await response.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        return data.routes[0];
      }
    } catch {
      // Coba mirror berikutnya
      continue;
    }
  }
  return null;
}

/**
 * Coba query rute 2 titik ke server OSRM dengan deteksi cerdas untuk jalur berbalik/detour
 */
async function tryOsrmPair(
  from: { lat: number; lng: number; name?: string },
  to: { lat: number; lng: number; name?: string }
): Promise<{
  coords: [number, number][];
  leafletPoints: [number, number][];
  distanceKm: number;
  durationMin: number;
  streetName?: string;
} | null> {
  const profileKey = `${from.lat.toFixed(5)},${from.lng.toFixed(5)}->${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
  const cached = osrmSegmentCache.get(profileKey);
  if (cached) {
    return {
      coords: cached.coords,
      leafletPoints: cached.leafletPoints,
      distanceKm: cached.distanceKm,
      durationMin: cached.durationMin,
      streetName: cached.streetNames[0],
    };
  }

  const straightDistKm = calculateHaversine(from.lat, from.lng, to.lat, to.lng);
  const coordsStr = `${from.lng.toFixed(6)},${from.lat.toFixed(6)};${to.lng.toFixed(6)},${to.lat.toFixed(6)}`;

  // 1. Coba forward route
  let route = await fetchOsrmWithFallbacks(coordsStr);

  // Jika OSRM driving memutar balik terlalu jauh karena batasan satu arah / separator
  // (misal jarak garis lurus 200m tapi OSRM memutar 2.5km), coba arah sebaliknya atau mode bike
  if (route && straightDistKm < 1.0 && route.distance / 1000 > straightDistKm * 3.5) {
    const reverseCoords = `${to.lng.toFixed(6)},${to.lat.toFixed(6)};${from.lng.toFixed(6)},${from.lat.toFixed(6)}`;
    const reverseRoute = await fetchOsrmWithFallbacks(reverseCoords);
    if (reverseRoute && reverseRoute.distance < route.distance) {
      const coords = [...reverseRoute.geometry.coordinates].reverse() as [number, number][];
      const leafletPoints = coords.map((c) => [c[1], c[0]] as [number, number]);
      const distanceKm = Number((reverseRoute.distance / 1000).toFixed(3));
      const durationMin = Math.max(1, Math.round(reverseRoute.duration / 60));
      let streetName = "";
      if (reverseRoute.legs && reverseRoute.legs[0]?.steps) {
        for (const s of reverseRoute.legs[0].steps) {
          if (s.name && s.name.trim()) {
            streetName = s.name.trim();
            break;
          }
        }
      }
      const result = { coords, leafletPoints, distanceKm, durationMin, streetName };
      osrmSegmentCache.set(profileKey, {
        coords,
        leafletPoints,
        distanceKm,
        durationMin,
        streetNames: streetName ? [streetName] : [],
        legs: [],
      });
      return result;
    }
  }

  if (route && route.geometry && route.geometry.coordinates.length >= 2) {
    const coords = route.geometry.coordinates as [number, number][];
    const leafletPoints = coords.map((c) => [c[1], c[0]] as [number, number]);
    const distanceKm = Number((route.distance / 1000).toFixed(3));
    const durationMin = Math.max(1, Math.round(route.duration / 60));
    let streetName = "";
    if (route.legs && route.legs[0]?.steps) {
      for (const s of route.legs[0].steps) {
        if (s.name && s.name.trim()) {
          streetName = s.name.trim();
          break;
        }
      }
    }
    const result = { coords, leafletPoints, distanceKm, durationMin, streetName };
    osrmSegmentCache.set(profileKey, {
      coords,
      leafletPoints,
      distanceKm,
      durationMin,
      streetNames: streetName ? [streetName] : [],
      legs: [],
    });
    return result;
  }

  return null;
}

/**
 * Hubungkan endpoint secara halus tanpa membuat siku tajam/kink ke pinggir jalan
 */
function smoothAttachEndpoints(
  leafletPoints: [number, number][],
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): [number, number][] {
  if (leafletPoints.length === 0) return [[p1.lat, p1.lng], [p2.lat, p2.lng]];
  const out = [...leafletPoints];
  const first = out[0];
  const last = out[out.length - 1];

  // Hanya jika titik klik berada cukup jauh dari jalan (> 40 meter), hubungkan perlahan
  if (calculateHaversine(first[0], first[1], p1.lat, p1.lng) > 0.04) {
    out.unshift([p1.lat, p1.lng]);
  }
  if (calculateHaversine(last[0], last[1], p2.lat, p2.lng) > 0.04) {
    out.push([p2.lat, p2.lng]);
  }
  return out;
}

/**
 * Rute antar 2 titik berdekatan
 */
export async function routeBetweenTwoWaypoints(
  p1: { lat: number; lng: number; name?: string },
  p2: { lat: number; lng: number; name?: string },
  connectionMode: ConnectionMode = "sequential"
): Promise<{
  coords: [number, number][];
  leafletPoints: [number, number][];
  distanceKm: number;
  durationMin: number;
  streetName?: string;
}> {
  const straightDistKm = calculateHaversine(p1.lat, p1.lng, p2.lat, p2.lng);
  const cacheKey = `seg:${connectionMode}:${p1.lat.toFixed(5)},${p1.lng.toFixed(5)}->${p2.lat.toFixed(5)},${p2.lng.toFixed(5)}`;

  const build = (
    pts: [number, number][],
    distanceKm: number,
    durationMin: number,
    streetName?: string,
    cache = true
  ) => {
    const leafletPoints = smoothAttachEndpoints(pts, p1, p2);
    const result = {
      coords: leafletPoints.map((c) => [c[1], c[0]] as [number, number]),
      leafletPoints,
      distanceKm,
      durationMin,
      streetName,
    };
    if (cache) {
      osrmSegmentCache.set(cacheKey, {
        coords: result.coords,
        leafletPoints: result.leafletPoints,
        distanceKm,
        durationMin,
        streetNames: streetName ? [streetName] : [],
        legs: [],
      });
    }
    return result;
  };

  if (connectionMode === "direct_line") {
    const directPath = generateInterpolatedPath(p1.lat, p1.lng, p2.lat, p2.lng, 10);
    return build(
      directPath,
      Number(straightDistKm.toFixed(3)),
      Math.max(1, Math.round((straightDistKm / 30) * 60)),
      p1.name || p2.name,
      false
    );
  }

  const cached = osrmSegmentCache.get(cacheKey);
  if (cached) {
    return {
      coords: cached.coords,
      leafletPoints: cached.leafletPoints,
      distanceKm: cached.distanceKm,
      durationMin: cached.durationMin,
      streetName: cached.streetNames[0],
    };
  }

  if (straightDistKm < 0.005) {
    return build([[p1.lat, p1.lng], [p2.lat, p2.lng]], Number(straightDistKm.toFixed(3)), 1, p1.name || p2.name);
  }

  // Coba rute OSRM
  const forward = await tryOsrmPair(p1, p2);
  if (forward && forward.leafletPoints && forward.leafletPoints.length >= 2) {
    return build(forward.leafletPoints, forward.distanceKm, forward.durationMin, forward.streetName);
  }

  // Fallback direct interpolated
  const directPath = generateInterpolatedPath(p1.lat, p1.lng, p2.lat, p2.lng, 8);
  return build(
    directPath,
    Number(straightDistKm.toFixed(3)),
    Math.max(1, Math.round((straightDistKm / 25) * 60)),
    p1.name || p2.name,
    false
  );
}

/**
 * Urutkan titik berdasarkan jarak terdekat (Greedy Nearest Neighbor)
 */
export function sortWaypointsByNearestNeighbor(points: WaypointItem[]): WaypointItem[] {
  if (points.length <= 2) return [...points];

  const unvisited = [...points];
  const ordered: WaypointItem[] = [];
  ordered.push(unvisited.shift()!);

  while (unvisited.length > 0) {
    const current = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = calculateHaversine(current.lat, current.lng, unvisited[i].lat, unvisited[i].lng);
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    ordered.push(unvisited.splice(nearestIdx, 1)[0]);
  }

  return ordered;
}

/**
 * Multi-point road route calculation
 * Keunggulan:
 * 1. Batch Multi-Coordinate Request: 1 query langsung memetakan semua titik berurutan secara akurat, mulus, dan bebas 429 rate-limit.
 * 2. Segment-level Fallback: jika ada titik yang tidak terjangkau jaringan jalan, otomatis dihubungkan tanpa merusak rute lain.
 * 3. Tidak ada garis siku patah/kink ke pinggir jalan.
 * 4. Mendukung Pisah Rute (isDisconnected) dan Sambung Cabang (nearest_branch / direct_snap).
 */
export async function calculateMultiPointRoadRoute(
  waypoints: WaypointItem[],
  arg2?: string | ConnectionMode,
  arg3?: string | ConnectionMode | [number, number][][],
  arg4?: [number, number][][]
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

  let connectionMode: ConnectionMode = "sequential";
  let otherRoutesCoords: [number, number][][] | undefined = undefined;

  const validModes: ConnectionMode[] = [
    "sequential",
    "nearest",
    "direct_line",
    "loop_closed",
    "smart_direct",
  ];

  if (typeof arg2 === "string" && validModes.includes(arg2 as ConnectionMode)) {
    connectionMode = arg2 as ConnectionMode;
  }
  if (typeof arg3 === "string" && validModes.includes(arg3 as ConnectionMode)) {
    connectionMode = arg3 as ConnectionMode;
  } else if (Array.isArray(arg3)) {
    otherRoutesCoords = arg3 as [number, number][][];
  }
  if (Array.isArray(arg4)) {
    otherRoutesCoords = arg4 as [number, number][][];
  }

  const effectiveWaypoints =
    connectionMode === "nearest"
      ? sortWaypointsByNearestNeighbor(waypoints)
      : waypoints;

  try {
    interface SubPolyline {
      coords: [number, number][];
      leafletPoints: [number, number][];
      distanceKm: number;
      durationMin: number;
    }

    const newChain = (): SubPolyline => ({ coords: [], leafletPoints: [], distanceKm: 0, durationMin: 0 });
    const subPolylines: SubPolyline[] = [];
    let currentPolyline: SubPolyline = newChain();

    const streetNamesSet = new Set<string>();
    const legs: MultiPointRouteResult["legs"] = [];

    const appendToChain = (
      chain: SubPolyline,
      seg: { coords: [number, number][]; leafletPoints: [number, number][]; distanceKm: number; durationMin: number }
    ) => {
      if (chain.leafletPoints.length === 0) {
        chain.coords.push(...seg.coords);
        chain.leafletPoints.push(...seg.leafletPoints);
      } else {
        chain.coords.push(...seg.coords.slice(1));
        chain.leafletPoints.push(...seg.leafletPoints.slice(1));
      }
      chain.distanceKm += seg.distanceKm;
      chain.durationMin += seg.durationMin;
    };

    const closeCurrentChain = () => {
      if (currentPolyline.leafletPoints.length >= 2) subPolylines.push(currentPolyline);
      currentPolyline = newChain();
    };

    // Fungsi pencari garis terdekat untuk cabang T / persimpangan
    const findNearestOnDrawnLines = (
      lat: number,
      lng: number,
      excludePoint?: [number, number]
    ): { point: [number, number]; distKm: number } | null => {
      const candidateLines: [number, number][][] = [];

      if (otherRoutesCoords && otherRoutesCoords.length > 0) {
        candidateLines.push(...otherRoutesCoords);
      }

      subPolylines.forEach((c) => {
        if (c.leafletPoints.length >= 2) candidateLines.push(c.leafletPoints);
      });

      if (currentPolyline.leafletPoints.length >= 2) {
        const filteredCurrent = currentPolyline.leafletPoints.filter(
          (pt) =>
            calculateHaversine(lat, lng, pt[0], pt[1]) > 0.035 &&
            (!excludePoint || calculateHaversine(excludePoint[0], excludePoint[1], pt[0], pt[1]) > 0.035)
        );
        if (filteredCurrent.length >= 2) {
          candidateLines.push(filteredCurrent);
        }
      }

      let best: { point: [number, number]; distKm: number } | null = null;
      let bestDist = Infinity;

      for (const line of candidateLines) {
        if (line.length < 2) continue;
        const p = findNearestCoordinateOnPath(lat, lng, line);
        const d = calculateHaversine(lat, lng, p[0], p[1]);

        if (
          excludePoint &&
          calculateHaversine(p[0], p[1], excludePoint[0], excludePoint[1]) < 0.005
        ) {
          continue;
        }

        if (d < 0.001) continue;

        if (d < bestDist) {
          bestDist = d;
          best = { point: p, distKm: d };
        }
      }

      if (!best) {
        if (otherRoutesCoords) {
          for (const line of otherRoutesCoords) {
            for (const pt of line) {
              const d = calculateHaversine(lat, lng, pt[0], pt[1]);
              if (d > 0.001 && d < bestDist) {
                bestDist = d;
                best = { point: pt, distKm: d };
              }
            }
          }
        }
        for (const wp of effectiveWaypoints) {
          if (
            (Math.abs(wp.lat - lat) < 0.0001 && Math.abs(wp.lng - lng) < 0.0001) ||
            (excludePoint && Math.abs(wp.lat - excludePoint[0]) < 0.0001 && Math.abs(wp.lng - excludePoint[1]) < 0.0001)
          ) {
            continue;
          }
          const d = calculateHaversine(lat, lng, wp.lat, wp.lng);
          if (d > 0.001 && d < bestDist) {
            bestDist = d;
            best = { point: [wp.lat, wp.lng], distKm: d };
          }
        }
      }

      return best;
    };

    // 1. Pecah waypoints menjadi segmen kontinu (dipisah jika ada isDisconnected)
    interface ContinuousChunk {
      startIndex: number;
      points: WaypointItem[];
    }

    const chunks: ContinuousChunk[] = [];
    let currentChunk: WaypointItem[] = [effectiveWaypoints[0]];
    let chunkStartIndex = 0;

    for (let i = 1; i < effectiveWaypoints.length; i++) {
      const wp = effectiveWaypoints[i];
      const isDisc = wp.isDisconnected || wp.connectionType === "disconnected";
      if (isDisc) {
        if (currentChunk.length >= 1) {
          chunks.push({ startIndex: chunkStartIndex, points: currentChunk });
        }
        currentChunk = [wp];
        chunkStartIndex = i;
      } else {
        currentChunk.push(wp);
      }
    }
    if (currentChunk.length >= 1) {
      chunks.push({ startIndex: chunkStartIndex, points: currentChunk });
    }

    // 2. Proses tiap chunk
    for (const chunk of chunks) {
      if (chunk.points.length < 2) {
        continue;
      }

      // Jika direct_line, hitung interpolasi langsung
      if (connectionMode === "direct_line") {
        for (let i = 0; i < chunk.points.length - 1; i++) {
          const p1 = chunk.points[i];
          const p2 = chunk.points[i + 1];
          const seg = await routeBetweenTwoWaypoints(p1, p2, "direct_line");
          appendToChain(currentPolyline, seg);
          legs.push({
            fromName: p1.name || `Titik ${chunk.startIndex + i + 1}`,
            toName: p2.name || `Titik ${chunk.startIndex + i + 2}`,
            distanceKm: seg.distanceKm,
            durationMin: seg.durationMin,
          });
        }
        closeCurrentChain();
        continue;
      }

      // Coba batch query OSRM untuk chunk yang kontinu jika tidak ada titik cabang khusus
      const hasSpecialBranch = chunk.points.some(
        (p, idx) => idx > 0 && (p.connectionType === "nearest_branch" || p.connectionType === "direct_snap")
      );

      let batchSuccess = false;

      if (!hasSpecialBranch && chunk.points.length >= 2 && chunk.points.length <= 50) {
        const coordsStr = chunk.points
          .map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`)
          .join(";");

        const batchRoute = await fetchOsrmWithFallbacks(coordsStr);
        if (batchRoute && batchRoute.geometry && batchRoute.geometry.coordinates.length >= 2) {
          const rawCoords = batchRoute.geometry.coordinates as [number, number][];
          const leafletPoints = rawCoords.map((c) => [c[1], c[0]] as [number, number]);
          const totalDistanceKm = Number((batchRoute.distance / 1000).toFixed(3));
          const totalDurationMin = Math.max(1, Math.round(batchRoute.duration / 60));

          subPolylines.push({
            coords: rawCoords,
            leafletPoints,
            distanceKm: totalDistanceKm,
            durationMin: totalDurationMin,
          });

          // Ekstrak legs dan nama jalan dari batch response
          if (batchRoute.legs && batchRoute.legs.length > 0) {
            for (let k = 0; k < batchRoute.legs.length; k++) {
              const leg = batchRoute.legs[k];
              const p1 = chunk.points[k];
              const p2 = chunk.points[k + 1] || p1;
              if (leg.steps) {
                for (const s of leg.steps) {
                  if (s.name && s.name.trim()) streetNamesSet.add(s.name.trim());
                }
              }
              legs.push({
                fromName: p1?.name || `Titik ${chunk.startIndex + k + 1}`,
                toName: p2?.name || `Titik ${chunk.startIndex + k + 2}`,
                distanceKm: Number((leg.distance / 1000).toFixed(3)),
                durationMin: Math.max(1, Math.round(leg.duration / 60)),
              });
            }
          }

          batchSuccess = true;
        }
      }

      // Jika batch tidak digunakan atau gagal, lakukan perutean segmen demi segmen dengan fallback kuat
      if (!batchSuccess) {
        for (let i = 0; i < chunk.points.length - 1; i++) {
          const p1 = chunk.points[i];
          const p2 = chunk.points[i + 1];
          const actualIndex = chunk.startIndex + i;

          const isP2Branch = p2.connectionType === "nearest_branch";
          const isP2DirectSnap = p2.connectionType === "direct_snap";

          const seg = await routeBetweenTwoWaypoints(p1, p2, connectionMode);
          appendToChain(currentPolyline, seg);
          if (seg.streetName) streetNamesSet.add(seg.streetName);

          legs.push({
            fromName: p1.name || `Titik ${actualIndex + 1}`,
            toName: p2.name || `Titik ${actualIndex + 2}`,
            distanceKm: seg.distanceKm,
            durationMin: seg.durationMin,
          });

          if (isP2Branch || isP2DirectSnap) {
            const nearest = findNearestOnDrawnLines(p2.lat, p2.lng, [p1.lat, p1.lng]);
            if (nearest) {
              if (isP2DirectSnap) {
                subPolylines.push({
                  coords: [
                    [p2.lng, p2.lat],
                    [nearest.point[1], nearest.point[0]],
                  ],
                  leafletPoints: [
                    [p2.lat, p2.lng],
                    [nearest.point[0], nearest.point[1]],
                  ],
                  distanceKm: Number(nearest.distKm.toFixed(3)),
                  durationMin: Math.max(1, Math.round(nearest.distKm * 2)),
                });
                legs.push({
                  fromName: p2.name || `Titik ${actualIndex + 2}`,
                  toName: "Jalur Terdekat (Snap Langsung)",
                  distanceKm: Number(nearest.distKm.toFixed(3)),
                  durationMin: Math.max(1, Math.round(nearest.distKm * 2)),
                  isBranch: true,
                });
              } else {
                const connector = await routeBetweenTwoWaypoints(
                  p2,
                  { lat: nearest.point[0], lng: nearest.point[1], name: "Jalur Terdekat" },
                  connectionMode
                );
                if (connector && connector.leafletPoints.length >= 2) {
                  subPolylines.push({
                    coords: connector.coords,
                    leafletPoints: connector.leafletPoints,
                    distanceKm: connector.distanceKm,
                    durationMin: connector.durationMin,
                  });
                  if (connector.streetName) streetNamesSet.add(connector.streetName);
                  legs.push({
                    fromName: p2.name || `Titik ${actualIndex + 2}`,
                    toName: "Jalur Terdekat (Ikuti Jalan)",
                    distanceKm: connector.distanceKm,
                    durationMin: connector.durationMin,
                    isBranch: true,
                  });
                }
              }
            }
          }
        }
        closeCurrentChain();
      }
    }

    // 3. Periksa titik pertama jika diset ke cabang terdekat
    const pFirst = effectiveWaypoints[0];
    if (
      pFirst &&
      (pFirst.connectionType === "nearest_branch" || pFirst.connectionType === "direct_snap")
    ) {
      const nearestFirst = findNearestOnDrawnLines(pFirst.lat, pFirst.lng);
      if (nearestFirst) {
        if (pFirst.connectionType === "direct_snap") {
          subPolylines.push({
            coords: [
              [pFirst.lng, pFirst.lat],
              [nearestFirst.point[1], nearestFirst.point[0]],
            ],
            leafletPoints: [
              [pFirst.lat, pFirst.lng],
              [nearestFirst.point[0], nearestFirst.point[1]],
            ],
            distanceKm: Number(nearestFirst.distKm.toFixed(3)),
            durationMin: Math.max(1, Math.round(nearestFirst.distKm * 2)),
          });
          legs.unshift({
            fromName: pFirst.name || "Titik Awal",
            toName: "Jalur Terdekat (Snap Langsung)",
            distanceKm: Number(nearestFirst.distKm.toFixed(3)),
            durationMin: Math.max(1, Math.round(nearestFirst.distKm * 2)),
            isBranch: true,
          });
        } else {
          const connectorFirst = await routeBetweenTwoWaypoints(
            pFirst,
            { lat: nearestFirst.point[0], lng: nearestFirst.point[1], name: "Jalur Terdekat" },
            connectionMode
          );
          if (connectorFirst && connectorFirst.leafletPoints.length >= 2) {
            subPolylines.push({
              coords: connectorFirst.coords,
              leafletPoints: connectorFirst.leafletPoints,
              distanceKm: connectorFirst.distanceKm,
              durationMin: connectorFirst.durationMin,
            });
            if (connectorFirst.streetName) streetNamesSet.add(connectorFirst.streetName);
            legs.unshift({
              fromName: pFirst.name || "Titik Awal",
              toName: "Jalur Terdekat (Ikuti Jalan)",
              distanceKm: connectorFirst.distanceKm,
              durationMin: connectorFirst.durationMin,
              isBranch: true,
            });
          }
        }
      }
    }

    // 4. Jika mode loop_closed, sambungkan kembali titik akhir ke titik awal
    if (connectionMode === "loop_closed" && effectiveWaypoints.length >= 2) {
      const lastWp = effectiveWaypoints[effectiveWaypoints.length - 1];
      const firstWp = effectiveWaypoints[0];
      const returnSeg = await routeBetweenTwoWaypoints(lastWp, firstWp, connectionMode);
      subPolylines.push({
        coords: returnSeg.coords,
        leafletPoints: returnSeg.leafletPoints,
        distanceKm: returnSeg.distanceKm,
        durationMin: returnSeg.durationMin,
      });
      if (returnSeg.streetName) streetNamesSet.add(returnSeg.streetName);

      legs.push({
        fromName: lastWp.name || `Titik ${effectiveWaypoints.length}`,
        toName: `${firstWp.name || "Titik 1"} (Loop Tertutup)`,
        distanceKm: returnSeg.distanceKm,
        durationMin: returnSeg.durationMin,
      });
    }

    closeCurrentChain();

    if (subPolylines.length === 0) {
      return {
        success: false,
        coordinates: [],
        leafletPoints: [],
        distanceKm: 0,
        durationMin: 0,
        streetNames: [],
        summary: "Tidak ada segmen rute yang valid",
        legs: [],
      };
    }

    let totalDist = 0;
    let totalDur = 0;
    subPolylines.forEach((s) => {
      totalDist += s.distanceKm;
      totalDur += s.durationMin;
    });

    const isSingle = subPolylines.length === 1;
    const finalCoordinates = isSingle
      ? subPolylines[0].coords
      : subPolylines.map((s) => s.coords);
    const finalLeafletPoints = isSingle
      ? subPolylines[0].leafletPoints
      : subPolylines.map((s) => s.leafletPoints);

    return {
      success: true,
      coordinates: finalCoordinates as [number, number][] | [number, number][][],
      leafletPoints: finalLeafletPoints as [number, number][] | [number, number][][],
      distanceKm: Number(totalDist.toFixed(2)),
      durationMin: Math.max(1, totalDur),
      streetNames: Array.from(streetNamesSet),
      summary: `${effectiveWaypoints.length} Titik Terhubung`,
      legs,
    };
  } catch (err) {
    console.error("Gagal kalkulasi rute multi-titik:", err);
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
const geocodeCache = new Map<string, string>();

export async function reverseGeocodeRoadName(lat: number, lng: number): Promise<string> {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

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
      const data = await responseToJsonSafe(res);
      if (data) {
        const addr = data.address || {};
        const road =
          addr.road ||
          addr.pedestrian ||
          addr.street ||
          addr.neighbourhood ||
          addr.suburb ||
          data.display_name?.split(",")[0];
        if (road) {
          geocodeCache.set(cacheKey, road);
          return road;
        }
      }
    }
  } catch (e) {
    console.warn("Reverse geocode notice:", e);
  }

  return `Titik (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}

async function responseToJsonSafe(res: Response) {
  try {
    return await res.json();
  } catch {
    return null;
  }
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
