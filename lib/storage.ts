export interface GeoMarker {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface GeoPolygon {
  id: string;
  name: string;
  area: string;
  density: string;
  color: string;
  coordinates?: [number, number][];
  pointsCount?: number;
  createdAt: string;
}

export interface GeoJsonRecord {
  id: string;
  name: string;
  size: string;
  content: Record<string, unknown>;
  createdAt: string;
}

export interface GeoRouteRecord {
  id: string;
  fromName: string;
  fromLat: number;
  fromLng: number;
  toName: string;
  toLat: number;
  toLng: number;
  distanceKm: number;
  createdAt: string;
}

export interface HeatmapPoint {
  id: string;
  lat: number;
  lng: number;
  intensity: number;
  name: string;
  category: string;
}

/* =========================================================================
 * INDEPENDENT MODULAR DATABASE STRUCTURE (TERPISAH PER MODUL)
 * ========================================================================= */
export interface GeoDatabaseState {
  version: number;
  lastBackupDate?: string;

  // Modul 1: Global Maps Data
  globalMaps: {
    activeBasemap: string;
    landmarks: GeoMarker[];
  };

  // Modul 2: Spatial CRUD Data (Fasilitas Pendidikan, Kesehatan, Pemerintahan)
  spatialCrud: {
    facilities: GeoMarker[];
  };

  // Modul 3: Analisis Wilayah & Poligon Data
  areaAnalysis: {
    polygons: GeoPolygon[];
    surveyPoints: GeoMarker[];
  };

  // Modul 4: GeoJSON Tools Data
  geojsonTools: {
    files: GeoJsonRecord[];
  };

  // Modul 5: Jarak & Rute Spasial Data
  distanceRouting: {
    waypoints: GeoMarker[];
    history: GeoRouteRecord[];
  };

  // Modul 6: Peta Kepadatan & Heatmap Data (Titik Konsentrasi / Hotspot)
  heatmapDensity: {
    points: HeatmapPoint[];
  };
}

const STORAGE_KEY = "geospatial_studio_modular_db_v2";

/* =========================================================================
 * DEFAULT DATA FOR EACH INDEPENDENT MODULE
 * ========================================================================= */

// 1. Modul Global Maps (Landmark Dunia & Wisata Indonesia)
export const DEFAULT_GLOBAL_LANDMARKS: GeoMarker[] = [
  {
    id: "gmark-1",
    name: "Monumen Nasional (Monas)",
    category: "Landmark Nasional",
    lat: -6.1754,
    lng: 106.8272,
    address: "Gambir, Jakarta Pusat",
    color: "#eab308",
    createdAt: new Date().toISOString(),
  },
  {
    id: "gmark-2",
    name: "Candi Borobudur",
    category: "Warisan Budaya",
    lat: -7.6079,
    lng: 110.2038,
    address: "Magelang, Jawa Tengah",
    color: "#678a40",
    createdAt: new Date().toISOString(),
  },
  {
    id: "gmark-3",
    name: "Gunung Bromo",
    category: "Wisata Alam",
    lat: -7.9425,
    lng: 112.9530,
    address: "Taman Nasional Bromo Tengger Semeru",
    color: "#ea580c",
    createdAt: new Date().toISOString(),
  },
  {
    id: "gmark-4",
    name: "Pura Tanah Lot",
    category: "Wisata Bahari & Budaya",
    lat: -8.6212,
    lng: 115.0868,
    address: "Tabanan, Bali",
    color: "#06b6d4",
    createdAt: new Date().toISOString(),
  },
  {
    id: "gmark-5",
    name: "Tokyo Skytree",
    category: "Landmark Dunia",
    lat: 35.7101,
    lng: 139.8107,
    address: "Sumida, Tokyo, Japan",
    color: "#3b82f6",
    createdAt: new Date().toISOString(),
  },
  {
    id: "gmark-6",
    name: "Menara Eiffel",
    category: "Landmark Dunia",
    lat: 48.8584,
    lng: 2.2945,
    address: "Champ de Mars, Paris, France",
    color: "#a855f7",
    createdAt: new Date().toISOString(),
  },
];

// 2. Modul Spatial CRUD (Fasilitas Publik & Sekolah Terpadu)
export const DEFAULT_CRUD_FACILITIES: GeoMarker[] = [
  {
    id: "crud-1",
    name: "SMAN 1 Kota Utama",
    category: "Sekolah (SMA)",
    lat: -6.2088,
    lng: 106.8456,
    address: "Jl. Pendidikan No. 45, Menteng",
    color: "#678a40",
    createdAt: new Date().toISOString(),
  },
  {
    id: "crud-2",
    name: "SMP Negeri 03",
    category: "Sekolah (SMP)",
    lat: -6.2140,
    lng: 106.8320,
    address: "Jl. Pemuda Merdeka No. 12, Tanah Abang",
    color: "#597a36",
    createdAt: new Date().toISOString(),
  },
  {
    id: "crud-3",
    name: "RSUD Geografis Medika",
    category: "Kesehatan",
    lat: -6.1950,
    lng: 106.8510,
    address: "Jl. Kesehatan Terpadu No. 8, Gambir",
    color: "#dc2626",
    createdAt: new Date().toISOString(),
  },
  {
    id: "crud-4",
    name: "Kantor Camat Wilayah 1",
    category: "Pemerintahan",
    lat: -6.2201,
    lng: 106.8600,
    address: "Jl. Protocol Barat No. 100, Senen",
    color: "#2563eb",
    createdAt: new Date().toISOString(),
  },
  {
    id: "crud-5",
    name: "SDN Teladan 01",
    category: "Sekolah (SD)",
    lat: -6.2020,
    lng: 106.8390,
    address: "Jl. Bunga Melati No. 5, Menteng",
    color: "#91b665",
    createdAt: new Date().toISOString(),
  },
];

// 3. Modul Analisis Wilayah (Poligon Kecamatan & Titik Uji ST_Contains)
export const DEFAULT_AREA_POLYGONS: GeoPolygon[] = [
  {
    id: "poly-1",
    name: "Kecamatan Menteng",
    area: "6.53 km²",
    density: "Tinggi",
    color: "#678a40",
    createdAt: new Date().toISOString(),
  },
  {
    id: "poly-2",
    name: "Kecamatan Tanah Abang",
    area: "9.30 km²",
    density: "Sangat Tinggi",
    color: "#597a36",
    createdAt: new Date().toISOString(),
  },
  {
    id: "poly-3",
    name: "Kecamatan Gambir",
    area: "7.59 km²",
    density: "Sedang",
    color: "#455e2d",
    createdAt: new Date().toISOString(),
  },
  {
    id: "poly-4",
    name: "Kecamatan Senen",
    area: "4.23 km²",
    density: "Sedang",
    color: "#394c28",
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_AREA_SURVEY_POINTS: GeoMarker[] = [
  {
    id: "survey-1",
    name: "Pos Pantau Menteng Utama",
    category: "Pos Pemantau",
    lat: -6.1950,
    lng: 106.8380,
    address: "Kecamatan Menteng",
    color: "#678a40",
    createdAt: new Date().toISOString(),
  },
  {
    id: "survey-2",
    name: "Sensor Ketinggian Air Gambir",
    category: "Sensor Lingkungan",
    lat: -6.1750,
    lng: 106.8280,
    address: "Kecamatan Gambir",
    color: "#455e2d",
    createdAt: new Date().toISOString(),
  },
  {
    id: "survey-3",
    name: "Stasiun Cuaca Tanah Abang",
    category: "Stasiun Cuaca",
    lat: -6.1980,
    lng: 106.8150,
    address: "Kecamatan Tanah Abang",
    color: "#597a36",
    createdAt: new Date().toISOString(),
  },
  {
    id: "survey-4",
    name: "Pusat Distribusi Logistik Senen",
    category: "Pusat Logistik",
    lat: -6.1850,
    lng: 106.8520,
    address: "Kecamatan Senen",
    color: "#394c28",
    createdAt: new Date().toISOString(),
  },
];

// 4. Modul GeoJSON Tools (File GeoJSON Mandiri)
export const DEFAULT_GEOJSON_FILES: GeoJsonRecord[] = [
  {
    id: "geo-sample-1",
    name: "Batas_Administrasi_Sample.geojson",
    size: "2.4 KB",
    createdAt: new Date().toISOString(),
    content: {
      type: "FeatureCollection",
      name: "Batas_Administrasi_Sample",
      crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      features: [
        {
          type: "Feature",
          properties: { id: 1, nama_wilayah: "Zona Observasi Khusus", status: "Aktif", warna: "#678a40" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [106.820, -6.180],
                [106.860, -6.180],
                [106.860, -6.220],
                [106.820, -6.220],
                [106.820, -6.180],
              ],
            ],
          },
        },
      ],
    },
  },
];

// 5. Modul Jarak & Rute Spasial (Titik Rute Khusus)
export const DEFAULT_ROUTING_WAYPOINTS: GeoMarker[] = [
  {
    id: "route-point-1",
    name: "Stasiun Gambir (Titik Berangkat)",
    category: "Transportasi Kereta",
    lat: -6.1767,
    lng: 106.8306,
    address: "Gambir, Jakarta Pusat",
    color: "#2563eb",
    createdAt: new Date().toISOString(),
  },
  {
    id: "route-point-2",
    name: "Bundaran HI (Titik Singgah)",
    category: "Pusat Transit MRT",
    lat: -6.1951,
    lng: 106.8230,
    address: "Jl. M.H. Thamrin, Menteng",
    color: "#678a40",
    createdAt: new Date().toISOString(),
  },
  {
    id: "route-point-3",
    name: "Gelora Bung Karno (Titik Tujuan)",
    category: "Stadion Olahraga",
    lat: -6.2185,
    lng: 106.8018,
    address: "Senayan, Jakarta Pusat",
    color: "#dc2626",
    createdAt: new Date().toISOString(),
  },
  {
    id: "route-point-4",
    name: "Bandara Internasional Soekarno-Hatta",
    category: "Bandara",
    lat: -6.1256,
    lng: 106.6559,
    address: "Tangerang, Banten",
    color: "#7c3aed",
    createdAt: new Date().toISOString(),
  },
];

// 6. Modul Peta Kepadatan / Heatmap (Data Titik Hotspot Kepadatan Tinggi)
export const DEFAULT_HEATMAP_POINTS: HeatmapPoint[] = [
  { id: "heat-1", lat: -6.1945, lng: 106.8231, intensity: 0.95, name: "Simpang Bundaran HI", category: "Lalu Lintas Padat" },
  { id: "heat-2", lat: -6.1955, lng: 106.8220, intensity: 0.90, name: "Stasiun MRT Bundaran HI", category: "Transit Keramaian" },
  { id: "heat-3", lat: -6.1930, lng: 106.8245, intensity: 0.85, name: "Kawasan Plaza Indonesia", category: "Pusat Perbelanjaan" },
  { id: "heat-4", lat: -6.2005, lng: 106.8235, intensity: 0.80, name: "Jl. Jenderal Sudirman Utara", category: "Lalu Lintas Padat" },
  { id: "heat-5", lat: -6.1865, lng: 106.8105, intensity: 0.92, name: "Pasar Tanah Abang Blok A", category: "Pusat Perdagangan" },
  { id: "heat-6", lat: -6.1875, lng: 106.8115, intensity: 0.88, name: "Stasiun Tanah Abang", category: "Transit Keramaian" },
  { id: "heat-7", lat: -6.1754, lng: 106.8272, intensity: 0.75, name: "Area Monas", category: "Wisatawan" },
  { id: "heat-8", lat: -6.1770, lng: 106.8305, intensity: 0.70, name: "Stasiun Gambir", category: "Transit Keramaian" },
  { id: "heat-9", lat: -6.2185, lng: 106.8018, intensity: 0.85, name: "Stadion Utama GBK", category: "Event Olahraga" },
  { id: "heat-10", lat: -6.2250, lng: 106.8080, intensity: 0.82, name: "SCBD Sudirman", category: "Kawasan Bisnis" },
  { id: "heat-11", lat: -6.2270, lng: 106.8000, intensity: 0.65, name: "Senayan City", category: "Pusat Perbelanjaan" },
  { id: "heat-12", lat: -6.1915, lng: 106.8505, intensity: 0.78, name: "Kawasan RS Cipto Mangunkusumo", category: "Kesehatan" },
  { id: "heat-13", lat: -6.1850, lng: 106.8620, intensity: 0.72, name: "Pasar Senen", category: "Pusat Perdagangan" },
  { id: "heat-14", lat: -6.2088, lng: 106.8456, intensity: 0.60, name: "Kawasan Cikini", category: "Kuliner & Budaya" },
  { id: "heat-15", lat: -6.2140, lng: 106.8320, intensity: 0.55, name: "Karet Tengsin", category: "Perumahan Padat" },
];

export const DEFAULT_DATABASE: GeoDatabaseState = {
  version: 2,
  globalMaps: {
    activeBasemap: "osm-standard",
    landmarks: DEFAULT_GLOBAL_LANDMARKS,
  },
  spatialCrud: {
    facilities: DEFAULT_CRUD_FACILITIES,
  },
  areaAnalysis: {
    polygons: DEFAULT_AREA_POLYGONS,
    surveyPoints: DEFAULT_AREA_SURVEY_POINTS,
  },
  geojsonTools: {
    files: DEFAULT_GEOJSON_FILES,
  },
  distanceRouting: {
    waypoints: DEFAULT_ROUTING_WAYPOINTS,
    history: [
      {
        id: "route-1",
        fromName: "Stasiun Gambir (Titik Berangkat)",
        fromLat: -6.1767,
        fromLng: 106.8306,
        toName: "Gelora Bung Karno (Titik Tujuan)",
        toLat: -6.2185,
        toLng: 106.8018,
        distanceKm: 5.61,
        createdAt: new Date().toISOString(),
      },
    ],
  },
  heatmapDensity: {
    points: DEFAULT_HEATMAP_POINTS,
  },
};

function notifyStorageChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("geostorage-updated"));
  }
}

export function getLocalDatabase(): GeoDatabaseState {
  if (typeof window === "undefined") {
    return DEFAULT_DATABASE;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATABASE));
      return DEFAULT_DATABASE;
    }
    const parsed = JSON.parse(raw) as Partial<GeoDatabaseState>;
    return {
      version: 2,
      globalMaps: parsed.globalMaps || DEFAULT_DATABASE.globalMaps,
      spatialCrud: parsed.spatialCrud || DEFAULT_DATABASE.spatialCrud,
      areaAnalysis: parsed.areaAnalysis || DEFAULT_DATABASE.areaAnalysis,
      geojsonTools: parsed.geojsonTools || DEFAULT_DATABASE.geojsonTools,
      distanceRouting: parsed.distanceRouting || DEFAULT_DATABASE.distanceRouting,
      heatmapDensity: parsed.heatmapDensity || DEFAULT_DATABASE.heatmapDensity,
      lastBackupDate: parsed.lastBackupDate,
    };
  } catch (err) {
    console.error("Error reading local database:", err);
    return DEFAULT_DATABASE;
  }
}

export function saveLocalDatabase(db: GeoDatabaseState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    notifyStorageChange();
  } catch (err) {
    console.error("Error saving local database:", err);
  }
}

/* =========================================================================
 * 1. MODUL GLOBAL MAPS METHODS
 * ========================================================================= */
export function getGlobalLandmarks(): GeoMarker[] {
  return getLocalDatabase().globalMaps.landmarks;
}

export function addGlobalLandmark(marker: Omit<GeoMarker, "id" | "createdAt">): GeoMarker {
  const db = getLocalDatabase();
  const newMarker: GeoMarker = {
    ...marker,
    id: `gmark-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  db.globalMaps.landmarks = [newMarker, ...db.globalMaps.landmarks];
  saveLocalDatabase(db);
  return newMarker;
}

export function deleteGlobalLandmark(id: string): boolean {
  const db = getLocalDatabase();
  const filtered = db.globalMaps.landmarks.filter((m) => m.id !== id);
  if (filtered.length === db.globalMaps.landmarks.length) return false;
  db.globalMaps.landmarks = filtered;
  saveLocalDatabase(db);
  return true;
}

/* =========================================================================
 * 2. MODUL SPATIAL CRUD METHODS (Fasilitas Publik / Sekolah)
 * ========================================================================= */
export function getCrudFacilities(): GeoMarker[] {
  return getLocalDatabase().spatialCrud.facilities;
}

export function addCrudFacility(marker: Omit<GeoMarker, "id" | "createdAt">): GeoMarker {
  const db = getLocalDatabase();
  const newMarker: GeoMarker = {
    ...marker,
    id: `crud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  db.spatialCrud.facilities = [newMarker, ...db.spatialCrud.facilities];
  saveLocalDatabase(db);
  return newMarker;
}

export function updateCrudFacility(id: string, updates: Partial<Omit<GeoMarker, "id" | "createdAt">>): boolean {
  const db = getLocalDatabase();
  const index = db.spatialCrud.facilities.findIndex((m) => m.id === id);
  if (index === -1) return false;

  db.spatialCrud.facilities[index] = {
    ...db.spatialCrud.facilities[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveLocalDatabase(db);
  return true;
}

export function deleteCrudFacility(id: string): boolean {
  const db = getLocalDatabase();
  const filtered = db.spatialCrud.facilities.filter((m) => m.id !== id);
  if (filtered.length === db.spatialCrud.facilities.length) return false;

  db.spatialCrud.facilities = filtered;
  saveLocalDatabase(db);
  return true;
}

/* =========================================================================
 * 3. MODUL ANALISIS WILAYAH & POLIGON METHODS
 * ========================================================================= */
export function getAreaPolygons(): GeoPolygon[] {
  return getLocalDatabase().areaAnalysis.polygons;
}

export function getAreaSurveyPoints(): GeoMarker[] {
  return getLocalDatabase().areaAnalysis.surveyPoints;
}

export function addAreaPolygon(poly: Omit<GeoPolygon, "id" | "createdAt">): GeoPolygon {
  const db = getLocalDatabase();
  const newPoly: GeoPolygon = {
    ...poly,
    id: `poly-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  db.areaAnalysis.polygons = [newPoly, ...db.areaAnalysis.polygons];
  saveLocalDatabase(db);
  return newPoly;
}

export function deleteAreaPolygon(id: string): boolean {
  const db = getLocalDatabase();
  const filtered = db.areaAnalysis.polygons.filter((p) => p.id !== id);
  if (filtered.length === db.areaAnalysis.polygons.length) return false;

  db.areaAnalysis.polygons = filtered;
  saveLocalDatabase(db);
  return true;
}

/* =========================================================================
 * 4. MODUL GEOJSON TOOLS METHODS
 * ========================================================================= */
export function getGeoJsonFiles(): GeoJsonRecord[] {
  return getLocalDatabase().geojsonTools.files;
}

export function addGeoJsonFile(file: Omit<GeoJsonRecord, "id" | "createdAt">): GeoJsonRecord {
  const db = getLocalDatabase();
  const newFile: GeoJsonRecord = {
    ...file,
    id: `geo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  db.geojsonTools.files = [newFile, ...db.geojsonTools.files];
  saveLocalDatabase(db);
  return newFile;
}

export function deleteGeoJsonFile(id: string): boolean {
  const db = getLocalDatabase();
  const filtered = db.geojsonTools.files.filter((f) => f.id !== id);
  if (filtered.length === db.geojsonTools.files.length) return false;

  db.geojsonTools.files = filtered;
  saveLocalDatabase(db);
  return true;
}

/* =========================================================================
 * 5. MODUL JARAK & RUTE SPASIAL METHODS
 * ========================================================================= */
export function getRoutingWaypoints(): GeoMarker[] {
  return getLocalDatabase().distanceRouting.waypoints;
}

export function getRouteHistory(): GeoRouteRecord[] {
  return getLocalDatabase().distanceRouting.history;
}

export function addRouteHistory(record: Omit<GeoRouteRecord, "id" | "createdAt">): GeoRouteRecord {
  const db = getLocalDatabase();
  const newRecord: GeoRouteRecord = {
    ...record,
    id: `route-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  db.distanceRouting.history = [newRecord, ...(db.distanceRouting.history || [])].slice(0, 50);
  saveLocalDatabase(db);
  return newRecord;
}

export function clearRouteHistory(): void {
  const db = getLocalDatabase();
  db.distanceRouting.history = [];
  saveLocalDatabase(db);
}

/* =========================================================================
 * 6. MODUL PETA KEPADATAN & HEATMAP METHODS
 * ========================================================================= */
export function getHeatmapPoints(): HeatmapPoint[] {
  return getLocalDatabase().heatmapDensity.points;
}

export function addHeatmapPoint(point: Omit<HeatmapPoint, "id">): HeatmapPoint {
  const db = getLocalDatabase();
  const newPoint: HeatmapPoint = {
    ...point,
    id: `heat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  db.heatmapDensity.points = [newPoint, ...db.heatmapDensity.points];
  saveLocalDatabase(db);
  return newPoint;
}

/* =========================================================================
 * BACKUP / RESTORE / RESET GLOBAL
 * ========================================================================= */
export function exportDatabaseAsJson(): string {
  const db = getLocalDatabase();
  db.lastBackupDate = new Date().toISOString();
  saveLocalDatabase(db);
  return JSON.stringify(db, null, 2);
}

export function downloadDatabaseBackup(): void {
  if (typeof window === "undefined") return;
  const jsonString = exportDatabaseAsJson();
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `geospatial_modular_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importDatabaseFromJson(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString) as Partial<GeoDatabaseState>;
    if (!parsed) throw new Error("Invalid backup format");
    saveLocalDatabase({
      version: 2,
      globalMaps: parsed.globalMaps || DEFAULT_DATABASE.globalMaps,
      spatialCrud: parsed.spatialCrud || DEFAULT_DATABASE.spatialCrud,
      areaAnalysis: parsed.areaAnalysis || DEFAULT_DATABASE.areaAnalysis,
      geojsonTools: parsed.geojsonTools || DEFAULT_DATABASE.geojsonTools,
      distanceRouting: parsed.distanceRouting || DEFAULT_DATABASE.distanceRouting,
      heatmapDensity: parsed.heatmapDensity || DEFAULT_DATABASE.heatmapDensity,
      lastBackupDate: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    console.error("Failed to import database JSON:", err);
    return false;
  }
}

export function resetDatabaseToFactory(): void {
  saveLocalDatabase(DEFAULT_DATABASE);
}
