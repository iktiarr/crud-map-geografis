"use client";

import * as React from "react";
import {
  GeoDatabaseState,
  GeoMarker,
  GeoPolygon,
  GeoJsonRecord,
  GeoRouteRecord,
  HeatmapPoint,
  getLocalDatabase,
  // Modul 1
  addGlobalLandmark,
  deleteGlobalLandmark,
  // Modul 2
  addCrudFacility,
  updateCrudFacility,
  deleteCrudFacility,
  // Modul 3
  addAreaPolygon,
  deleteAreaPolygon,
  // Modul 4
  addGeoJsonFile,
  deleteGeoJsonFile,
  // Modul 5
  addRouteHistory,
  clearRouteHistory,
  // Modul 6
  addHeatmapPoint,
  // Backup / Restore / Reset
  downloadDatabaseBackup,
  importDatabaseFromJson,
  resetDatabaseToFactory,
} from "@/lib/storage";

export function useGeoStorage() {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [db, setDb] = React.useState<GeoDatabaseState>(getLocalDatabase());

  const refresh = React.useCallback(() => {
    setDb(getLocalDatabase());
  }, []);

  React.useEffect(() => {
    setIsLoaded(true);
    refresh();

    const handleStorageUpdate = () => {
      refresh();
    };

    window.addEventListener("geostorage-updated", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);

    return () => {
      window.removeEventListener("geostorage-updated", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, [refresh]);

  return {
    isLoaded,
    lastBackupDate: db.lastBackupDate,

    // ==========================================
    // MODUL 1: GLOBAL MAPS DATA
    // ==========================================
    globalLandmarks: isLoaded ? db.globalMaps.landmarks : [],
    addGlobalLandmark: (marker: Omit<GeoMarker, "id" | "createdAt">) => {
      const res = addGlobalLandmark(marker);
      refresh();
      return res;
    },
    deleteGlobalLandmark: (id: string) => {
      const res = deleteGlobalLandmark(id);
      refresh();
      return res;
    },

    // ==========================================
    // MODUL 2: SPATIAL CRUD DATA (Fasilitas Publik / Sekolah)
    // ==========================================
    crudFacilities: isLoaded ? db.spatialCrud.facilities : [],
    addCrudFacility: (marker: Omit<GeoMarker, "id" | "createdAt">) => {
      const res = addCrudFacility(marker);
      refresh();
      return res;
    },
    updateCrudFacility: (id: string, updates: Partial<Omit<GeoMarker, "id" | "createdAt">>) => {
      const res = updateCrudFacility(id, updates);
      refresh();
      return res;
    },
    deleteCrudFacility: (id: string) => {
      const res = deleteCrudFacility(id);
      refresh();
      return res;
    },

    // ==========================================
    // MODUL 3: ANALISIS WILAYAH & POLIGON
    // ==========================================
    areaPolygons: isLoaded ? db.areaAnalysis.polygons : [],
    areaSurveyPoints: isLoaded ? db.areaAnalysis.surveyPoints : [],
    addAreaPolygon: (poly: Omit<GeoPolygon, "id" | "createdAt">) => {
      const res = addAreaPolygon(poly);
      refresh();
      return res;
    },
    deleteAreaPolygon: (id: string) => {
      const res = deleteAreaPolygon(id);
      refresh();
      return res;
    },

    // ==========================================
    // MODUL 4: GEOJSON TOOLS DATA
    // ==========================================
    geojsonFiles: isLoaded ? db.geojsonTools.files : [],
    addGeoJsonFile: (file: Omit<GeoJsonRecord, "id" | "createdAt">) => {
      const res = addGeoJsonFile(file);
      refresh();
      return res;
    },
    deleteGeoJsonFile: (id: string) => {
      const res = deleteGeoJsonFile(id);
      refresh();
      return res;
    },

    // ==========================================
    // MODUL 5: JARAK & RUTE SPASIAL
    // ==========================================
    routingWaypoints: isLoaded ? db.distanceRouting.waypoints : [],
    routeHistory: isLoaded ? db.distanceRouting.history : [],
    addRouteHistory: (item: Omit<GeoRouteRecord, "id" | "createdAt">) => {
      const res = addRouteHistory(item);
      refresh();
      return res;
    },
    clearRouteHistory: () => {
      clearRouteHistory();
      refresh();
    },

    // ==========================================
    // MODUL 6: PETA KEPADATAN & HEATMAP DATA
    // ==========================================
    heatmapPoints: isLoaded ? db.heatmapDensity.points : [],
    addHeatmapPoint: (point: Omit<HeatmapPoint, "id">) => {
      const res = addHeatmapPoint(point);
      refresh();
      return res;
    },

    // ==========================================
    // BACKUP / RESTORE / RESET GLOBAL
    // ==========================================
    downloadBackup: () => {
      downloadDatabaseBackup();
      refresh();
    },
    importBackup: (jsonString: string) => {
      const success = importDatabaseFromJson(jsonString);
      if (success) refresh();
      return success;
    },
    resetToFactory: () => {
      resetDatabaseToFactory();
      refresh();
    },
  };
}
