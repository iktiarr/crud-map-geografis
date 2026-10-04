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
 * Coba query 2 titik ke server OSRM dengan profil driving
 */
async function tryOsrmPair(
  from: { lat: number; lng: number; name?: string },
  to: { lat: number; lng: number; name?: string },
  profile: "driving" | "foot" | "bike" = "driving"
): Promise<{
  coords: [number, number][];
  leafletPoints: [number, number][];
  distanceKm: number;
  durationMin: number;
  streetName?: string;
} | null | undefined> {
  const effectiveProfile = profile === "driving" ? "driving" : "driving";
  const profileKey = `${effectiveProfile}:${from.lat.toFixed(5)},${from.lng.toFixed(5)}->${to.lat.toFixed(5)},${to.lng.toFixed(5)}`;
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

  // Gunakan radius fleksibel agar titik yang tidak tepat di tengah aspal tetap tersnap ke jalan terdekat
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng.toFixed(6)},${from.lat.toFixed(6)};${to.lng.toFixed(6)},${to.lat.toFixed(6)}?overview=full&geometries=geojson&steps=true&continue_straight=false`;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.status === 429 || response.status >= 500) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      if (!response.ok) return null;

      const data = await response.json();
      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const r = data.routes[0];
        const coords = r.geometry.coordinates as [number, number][];
        const leafletPoints = coords.map((c) => [c[1], c[0]] as [number, number]);
        const distanceKm = Number((r.distance / 1000).toFixed(3));
        const durationMin = Math.max(1, Math.round(r.duration / 60));
        let streetName = "";
        if (r.legs && r.legs[0]?.steps) {
          for (const s of r.legs[0].steps) {
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
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return undefined;
}

/**
 * Pastikan garis rute benar-benar menempel ke posisi titik (marker),
 * karena OSRM men-snap titik ke jalan sehingga ujung garis bisa sedikit bergeser.
 */
function attachEndpoints(
  leafletPoints: [number, number][],
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number }
): [number, number][] {
  const out = [...leafletPoints];
  if (out.length === 0) return [[p1.lat, p1.lng], [p2.lat, p2.lng]];
  const first = out[0];
  const last = out[out.length - 1];
  if (calculateHaversine(first[0], first[1], p1.lat, p1.lng) > 0.001) out.unshift([p1.lat, p1.lng]);
  if (calculateHaversine(last[0], last[1], p2.lat, p2.lng) > 0.001) out.push([p2.lat, p2.lng]);
  return out;
}

/**
 * Rute cerdas antar 2 titik berdekatan:
 * - Menghubungkan titik secara langsung mengikuti jalan resmi OSRM.
 * - Jika jalan satu arah atau terbagi, otomatis mencoba arah sebaliknya agar tidak putar balik jauh.
 * - Menghasilkan garis lurus hanya jika pengguna secara eksplisit memilih opsi 'direct_line'.
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
    const leafletPoints = attachEndpoints(pts, p1, p2);
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

  // Hanya jika pengguna secara eksplisit memilih 'direct_line', buat garis lurus langsung
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

  // Sangat dekat (< 8 meter): sambung langsung
  if (straightDistKm < 0.008) {
    return build([[p1.lat, p1.lng], [p2.lat, p2.lng]], Number(straightDistKm.toFixed(3)), 1, p1.name || p2.name);
  }

  // 1. Coba arah maju (p1 -> p2) via OSRM jalan raya resmi
  const forward = await tryOsrmPair(p1, p2, "driving");
  if (forward && forward.leafletPoints && forward.leafletPoints.length >= 2) {
    return build(forward.leafletPoints, forward.distanceKm, forward.durationMin, forward.streetName);
  }

  // 2. Coba arah sebaliknya (p2 -> p1), berguna untuk jalan satu arah / terbagi atau titik dipindah ke belakang
  const reverse = await tryOsrmPair(p2, p1, "driving");
  if (reverse && reverse.leafletPoints && reverse.leafletPoints.length >= 2) {
    const reversedPoints = [...reverse.leafletPoints].reverse() as [number, number][];
    return build(reversedPoints, reverse.distanceKm, reverse.durationMin, reverse.streetName);
  }

  // 3. Fallback jika OpenStreetMap belum memiliki data jalan di titik tersebut / offline:
  // Sambungkan langsung antar titik tetapi JANGAN simpan sebagai cache permanen
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
 * Menghubungkan titik secara berantai ke tetangga terdekat agar jalur tidak melompat bolak-balik
 */
export function sortWaypointsByNearestNeighbor(points: WaypointItem[]): WaypointItem[] {
  if (points.length <= 2) return [...points];

  const unvisited = [...points];
  const ordered: WaypointItem[] = [];

  // Mulai dari titik pertama (origin)
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
 * Logika Baru & Mantap:
 * 1. Segmen per segmen dengan cache: rute yang sudah digambar tidak akan hilang atau berubah!
 * 2. Mencegah putar balik: jika titik dekat di jalan satu arah/terbagi, otomatis menggunakan arah jalan tanpa U-turn sejauh kiloan meter.
 * 3. Menghubungkan ke rute terdekat tidak memutus segmen sebelumnya: titik tetap tersambung dari titik sebelumnya DAN tersambung ke jalur terdekat.
 * 4. Mendukung gang dan jalan tikus dengan mengikuti lekukan jalan asli OpenStreetMap (bukan tarik lurus).
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

  // Jika opsi Jalur Terdekat dipilih, urutkan titik dengan Greedy Nearest Neighbor
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

    // Cari titik terdekat pada garis yang sudah digambar atau rute lain di peta
    const findNearestOnDrawnLines = (
      lat: number,
      lng: number,
      excludePoint?: [number, number]
    ): { point: [number, number]; distKm: number } | null => {
      const candidateLines: [number, number][][] = [];

      // 1. Garis-garis dari rute lain yang ada di peta (prioritas utama untuk menghubungkan ke rute lain)
      if (otherRoutesCoords && otherRoutesCoords.length > 0) {
        candidateLines.push(...otherRoutesCoords);
      }

      // 2. Garis subPolylines dari rute saat ini yang sudah selesai digambar
      subPolylines.forEach((c) => {
        if (c.leafletPoints.length >= 2) candidateLines.push(c.leafletPoints);
      });

      // 3. Garis currentPolyline saat ini, TAPI buang bagian segmen yang berdekatan dengan (lat, lng)
      // dan excludePoint (p1) agar tidak menghubungkan ke titik itu sendiri
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

      // Cari proyeksi titik terdekat ke ruas-ruas garis kandidat
      for (const line of candidateLines) {
        if (line.length < 2) continue;
        const p = findNearestCoordinateOnPath(lat, lng, line);
        const d = calculateHaversine(lat, lng, p[0], p[1]);

        // Lewati jika persis di excludePoint (misal titik p1)
        if (
          excludePoint &&
          calculateHaversine(p[0], p[1], excludePoint[0], excludePoint[1]) < 0.005
        ) {
          continue;
        }

        // Lewati jika itu titik itu sendiri (< 1 meter)
        if (d < 0.001) continue;

        if (d < bestDist) {
          bestDist = d;
          best = { point: p, distKm: d };
        }
      }

      // 4. Jika belum ketemu dari garis, cari ke titik waypoint mana saja di rute lain atau waypoint lain
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

    for (let i = 0; i < effectiveWaypoints.length - 1; i++) {
      const p1 = effectiveWaypoints[i];
      const p2 = effectiveWaypoints[i + 1];

      const isP2Disconnected = p2.isDisconnected || p2.connectionType === "disconnected";
      const isP2Branch = p2.connectionType === "nearest_branch";
      const isP2DirectSnap = p2.connectionType === "direct_snap";

      if (isP2Disconnected) {
        // Titik p2 memulai jalan baru (tanpa garis dari p1 ke p2)
        closeCurrentChain();
        continue;
      }

      if (isP2Branch || isP2DirectSnap) {
        // Sambungkan p1 ke p2 terlebih dahulu
        const seg = await routeBetweenTwoWaypoints(p1, p2, connectionMode);
        appendToChain(currentPolyline, seg);
        if (seg.streetName) streetNamesSet.add(seg.streetName);

        legs.push({
          fromName: p1.name || `Titik ${i + 1}`,
          toName: p2.name || `Titik ${i + 2}`,
          distanceKm: seg.distanceKm,
          durationMin: seg.durationMin,
        });

        // Cari rute / titik terdekat sebelumnya untuk menghubungkan loop / persimpangan / rute lain
        const nearest = findNearestOnDrawnLines(p2.lat, p2.lng, [p1.lat, p1.lng]);
        if (nearest) {
          if (isP2DirectSnap) {
            // Opsi 2: Hubungkan Langsung (Snap Cepat)
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
              fromName: p2.name || `Titik ${i + 2}`,
              toName: "Jalur Terdekat (Snap Langsung)",
              distanceKm: Number(nearest.distKm.toFixed(3)),
              durationMin: Math.max(1, Math.round(nearest.distKm * 2)),
              isBranch: true,
            });
          } else {
            // Opsi 1: Hubungkan Mengikuti Jalan Resmi (Ikuti Jalan)
            // Sesuai permintaan pengguna: tidak apa-apa meski jalurnya lebih panjang dari jarak titik asalkan terhubung
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
                fromName: p2.name || `Titik ${i + 2}`,
                toName: "Jalur Terdekat (Ikuti Jalan)",
                distanceKm: connector.distanceKm,
                durationMin: connector.durationMin,
                isBranch: true,
              });
            } else {
              // Fallback aman: jika rute jalan buntu / tidak ada jaringan jalan, sambungkan langsung
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
                fromName: p2.name || `Titik ${i + 2}`,
                toName: "Jalur Terdekat (Sambung Langsung)",
                distanceKm: Number(nearest.distKm.toFixed(3)),
                durationMin: Math.max(1, Math.round(nearest.distKm * 2)),
                isBranch: true,
              });
            }
          }
        }
        continue;
      }

      // Sambung normal berurutan (p1 -> p2)
      const seg = await routeBetweenTwoWaypoints(p1, p2, connectionMode);
      appendToChain(currentPolyline, seg);
      if (seg.streetName) streetNamesSet.add(seg.streetName);

      legs.push({
        fromName: p1.name || `Titik ${i + 1}`,
        toName: p2.name || `Titik ${i + 2}`,
        distanceKm: seg.distanceKm,
        durationMin: seg.durationMin,
      });
    }

    // Periksa apakah titik pertama juga diset untuk menyambung ke jalur terdekat
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
          // Ikuti jalan resmi
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
          } else {
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
              toName: "Jalur Terdekat (Sambung Langsung)",
              distanceKm: Number(nearestFirst.distKm.toFixed(3)),
              durationMin: Math.max(1, Math.round(nearestFirst.distKm * 2)),
              isBranch: true,
            });
          }
        }
      }
    }

    // Jika mode loop_closed dipilih dan ada >= 2 titik, sambungkan kembali titik akhir ke titik awal
    if (connectionMode === "loop_closed" && effectiveWaypoints.length >= 2) {
      const lastWp = effectiveWaypoints[effectiveWaypoints.length - 1];
      const firstWp = effectiveWaypoints[0];
      const returnSeg = await routeBetweenTwoWaypoints(lastWp, firstWp, connectionMode);
      appendToChain(currentPolyline, returnSeg);
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
      const data = await res.json();
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

