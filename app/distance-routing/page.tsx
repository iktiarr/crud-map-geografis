"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, AlertTriangle, X } from "lucide-react";
import {
  calculateMultiPointRoadRoute,
  reverseGeocodeRoadName,
  clearOsrmCache,
} from "@/lib/road-routing";

// Import Konfigurasi & Tipe Data
import { DEFAULT_ROUTE_CONFIG } from "./konfigurasi";
import {
  TraversedRoadRecord,
  WaypointItem,
  MultiPointRouteResult,
  TravelMode,
  ConnectionMode,
  MarkerStyle,
  LineStyle,
  ToastMessage,
  parseRouteGeoJSON,
} from "./tipe";

// Import Layanan API Backend Modul 5
import {
  ambilSemuaRuteDanFolder,
  simpanRuteBaru,
  updateKustomisasiRute,
  hapusRute,
  buatFolderBaru,
  ubahNamaFolder,
  hapusFolder,
} from "./layanan/api-rute";

// Import Komponen Tampilan (Bahasa Indonesia)
import { PanelSamping } from "./komponen/panel-samping";
import { DaftarFolder } from "./komponen/daftar-folder";
import { DaftarRuteFolder } from "./komponen/daftar-rute-folder";
import { TambahRute } from "./komponen/tambah-rute";
import { ModalFolder } from "./komponen/modal-folder";
import { ModalRute } from "./komponen/modal-rute";
import { ModalPindahFolder } from "./komponen/modal-pindah-folder";
import { ModalEkspor } from "./komponen/modal-ekspor";
import { PetaRute } from "./komponen/peta-rute";

// Kunci penyimpanan sesi edit aktif rute di localStorage
const ACTIVE_EDIT_SESSION_KEY = "dr_active_edit_session";

export default function DistanceRoutingPage() {
  const router = useRouter();

  // State Tampilan & Navigasi Panel Samping
  const [isSidePanelOpen, setIsSidePanelOpen] = React.useState(true);
  const [folderSubTab, setFolderSubTab] = React.useState<"add-route" | "routes-list">("routes-list");

  // State Data Database
  const [routes, setRoutes] = React.useState<TraversedRoadRecord[]>([]);
  const [dbFolders, setDbFolders] = React.useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);
  const [dbError, setDbError] = React.useState<string | null>(null);

  // State Peta & Basemap
  const [activeBasemapId, setActiveBasemapId] = React.useState(DEFAULT_ROUTE_CONFIG.basemapId);
  const [focusedRouteId, setFocusedRouteId] = React.useState<number | null>(null);
  const [focusedFolder, setFocusedFolder] = React.useState<string | null>(null);
  const [zoomTargetRouteId, setZoomTargetRouteId] = React.useState<{ id: number; timestamp: number } | null>(null);
  const [zoomTargetFolder, setZoomTargetFolder] = React.useState<{ name: string; timestamp: number } | null>(null);
  // Folder yang sedang dilihat di peta (tanpa membuka folder), null = tampilkan semua rute
  const [previewFolder, setPreviewFolder] = React.useState<string | null>(null);
  const [zoomTargetPoint, setZoomTargetPoint] = React.useState<{ lat: number; lng: number; timestamp: number } | null>(null);
  const [zoomTargetDraftRoute, setZoomTargetDraftRoute] = React.useState<{ timestamp: number } | null>(null);

  // State Waypoint & Kalkulasi Rute
  const [waypoints, setWaypoints] = React.useState<WaypointItem[]>([]);
  const [travelMode, setTravelMode] = React.useState<TravelMode>(DEFAULT_ROUTE_CONFIG.travelMode);
  const [connectionMode, setConnectionMode] = React.useState<ConnectionMode>(DEFAULT_ROUTE_CONFIG.connectionMode);
  const [markerStyle, setMarkerStyle] = React.useState<MarkerStyle>(DEFAULT_ROUTE_CONFIG.markerStyle);
  const [isCalculatingRoute, setIsCalculatingRoute] = React.useState(false);
  const [draftRouteData, setDraftRouteData] = React.useState<MultiPointRouteResult | null>(null);

  // State Pemilihan Jalur Alternatif
  const [selectedAlternativeId, setSelectedAlternativeId] = React.useState<string | null>(null);

  // State Kustomisasi Garis Rute
  const [customColor, setCustomColor] = React.useState(DEFAULT_ROUTE_CONFIG.color);
  const [customWeight, setCustomWeight] = React.useState(DEFAULT_ROUTE_CONFIG.weight);
  const customOpacity = DEFAULT_ROUTE_CONFIG.opacity;
  const [customLineStyle, setCustomLineStyle] = React.useState<LineStyle>(DEFAULT_ROUTE_CONFIG.lineStyle);
  const [targetFolder, setTargetFolder] = React.useState("Utama");
  const [routeName, setRouteName] = React.useState("Rute Baru");
  const routeCategory = DEFAULT_ROUTE_CONFIG.category;

  // State Aksi & Notifikasi Toast
  const [hideWaypointsOnMap, setHideWaypointsOnMap] = React.useState(false);
  const [isPositionLocked, setIsPositionLocked] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<ToastMessage | null>(null);
  const [activeRouteId, setActiveRouteId] = React.useState<number | null>(null);

  // Auto-Save Refs untuk Mencegah Stale State & Request Berlebih
  const latestStateRef = React.useRef({
    activeRouteId: null as number | null,
    routeName: "Rute Baru",
    targetFolder: "Utama",
    customColor: DEFAULT_ROUTE_CONFIG.color,
    customWeight: DEFAULT_ROUTE_CONFIG.weight,
    customOpacity: DEFAULT_ROUTE_CONFIG.opacity,
    customLineStyle: DEFAULT_ROUTE_CONFIG.lineStyle as LineStyle,
    travelMode: DEFAULT_ROUTE_CONFIG.travelMode as TravelMode,
    connectionMode: DEFAULT_ROUTE_CONFIG.connectionMode as ConnectionMode,
    markerStyle: DEFAULT_ROUTE_CONFIG.markerStyle as MarkerStyle,
    routeCategory: DEFAULT_ROUTE_CONFIG.category,
    waypoints: [] as WaypointItem[],
    activeDraftCoordinates: [] as [number, number][] | [number, number][][],
    activeDraftDistanceKm: 0,
    activeDraftDurationMin: 0,
  });

  const saveTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastSavedFingerprintRef = React.useRef<string>("");

  // State Modal Folder
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = React.useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = React.useState("");
  const [renameTargetFolder, setRenameTargetFolder] = React.useState<string | null>(null);
  const [renameNewNameInput, setRenameNewNameInput] = React.useState("");
  const [deleteTargetFolder, setDeleteTargetFolder] = React.useState<string | null>(null);

  // State Modal Rute
  const [deleteTargetRouteId, setDeleteTargetRouteId] = React.useState<number | null>(null);
  const [isDeleteRouteModalOpen, setIsDeleteRouteModalOpen] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<TraversedRoadRecord | null>(null);
  const [isEditingRouteModalOpen, setIsEditingRouteModalOpen] = React.useState(false);
  const [renameTargetRoute, setRenameTargetRoute] = React.useState<TraversedRoadRecord | null>(null);
  const [renameRouteNewNameInput, setRenameRouteNewNameInput] = React.useState("");

  // State Modal Tambah Rute Baru (Alur: Tambah nama folder -> Tambah nama rute -> Baru edit rute)
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = React.useState(false);
  const [newRouteNameInput, setNewRouteNameInput] = React.useState("");

  // State Modal Pindahkan Rute ke Folder
  const [isMoveFolderModalOpen, setIsMoveFolderModalOpen] = React.useState(false);
  const [moveTargetRoute, setMoveTargetRoute] = React.useState<TraversedRoadRecord | null>(null);

  // State Modal Ekspor Berkas
  const [exportModalState, setExportModalState] = React.useState<{
    isOpen: boolean;
    title: string;
    routes: TraversedRoadRecord[];
  }>({
    isOpen: false,
    title: "",
    routes: [],
  });

  // State Riwayat Undo & Redo (Rudo dan Endo Titik & Viewport)
  interface HistorySnapshot {
    waypoints: WaypointItem[];
    connectionMode: ConnectionMode;
    markerStyle: MarkerStyle;
    targetPoint?: { lat: number; lng: number } | null;
  }
  const [undoStack, setUndoStack] = React.useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = React.useState<HistorySnapshot[]>([]);

  // Helper Notifikasi Toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Memuat Rute & Folder dari Database
  const fetchRoutesAndFolders = React.useCallback(async () => {
    const { routes: fetchedRoutes, folderNames, errorMessage } = await ambilSemuaRuteDanFolder();
    if (errorMessage) {
      setDbError(errorMessage);
    } else {
      setDbError(null);
    }
    setRoutes(fetchedRoutes);
    setDbFolders(folderNames);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    const initData = async () => {
      const { routes: fetchedRoutes, folderNames, errorMessage } = await ambilSemuaRuteDanFolder();
      if (!isMounted) return;
      if (errorMessage) {
        setDbError(errorMessage);
      } else {
        setDbError(null);
      }
      setRoutes(fetchedRoutes);
      setDbFolders(folderNames);

      // Pemulihan Sesi Edit Rute Aktif dari localStorage saat halaman di-refresh (F5)
      try {
        const savedStr = localStorage.getItem(ACTIVE_EDIT_SESSION_KEY);
        if (savedStr) {
          const parsed = JSON.parse(savedStr);
          if (parsed?.activeRouteId) {
            const target = fetchedRoutes.find((r) => r.id === parsed.activeRouteId);
            if (target) {
              const folderName = parsed.selectedFolder || target.folder_name || "Utama";
              setSelectedFolder(folderName);
              setTargetFolder(folderName);
              setActiveRouteId(target.id);
              setRouteName(target.name || "Rute Baru");
              setCustomColor(target.color || DEFAULT_ROUTE_CONFIG.color);
              setCustomWeight(target.weight || DEFAULT_ROUTE_CONFIG.weight);
              const validLineStyles: LineStyle[] = ["solid", "dashed", "dotted"];
              const style: LineStyle = validLineStyles.includes(target.line_style as LineStyle)
                ? (target.line_style as LineStyle)
                : DEFAULT_ROUTE_CONFIG.lineStyle;
              setCustomLineStyle(style);

              const validMarkerStyles: MarkerStyle[] = ["numbers", "letters", "none", "icon", "pin", "dot", "random"];
              const mStyle: MarkerStyle = validMarkerStyles.includes(target.marker_style as MarkerStyle)
                ? (target.marker_style as MarkerStyle)
                : DEFAULT_ROUTE_CONFIG.markerStyle;
              setMarkerStyle(mStyle);

              const validConnModes: ConnectionMode[] = ["sequential", "nearest", "direct_line", "loop_closed", "smart_direct"];
              const cMode: ConnectionMode = validConnModes.includes(target.connection_mode as ConnectionMode)
                ? (target.connection_mode as ConnectionMode)
                : DEFAULT_ROUTE_CONFIG.connectionMode;
              setConnectionMode(cMode);

              const validTravelModes: TravelMode[] = ["driving", "bike", "foot"];
              const tMode: TravelMode = validTravelModes.includes(target.travel_mode as TravelMode)
                ? (target.travel_mode as TravelMode)
                : DEFAULT_ROUTE_CONFIG.travelMode;
              setTravelMode(tMode);

              const loadedWaypoints: WaypointItem[] = Array.isArray(target.waypoints)
                ? target.waypoints.map((wp, idx) => ({
                    id: `wp-${target.id}-${idx}`,
                    name: wp.name || `Titik ${idx + 1}`,
                    lat: wp.lat,
                    lng: wp.lng,
                    isDisconnected: wp.isDisconnected,
                    connectionType: wp.connectionType,
                    branchTargetCoord: wp.branchTargetCoord,
                  }))
                : [];

              setWaypoints(loadedWaypoints);
              setSelectedAlternativeId(null);
              setFocusedRouteId(target.id);

              const targetGeojson = parseRouteGeoJSON(target.geojson);
              if (targetGeojson && Array.isArray(targetGeojson.coordinates) && targetGeojson.coordinates.length > 0) {
                const coords = targetGeojson.coordinates;
                const isMulti =
                  targetGeojson.type === "MultiLineString" ||
                  (Array.isArray(coords[0]) && Array.isArray((coords as unknown[][])[0][0]));

                const leafletPoints = isMulti
                  ? (coords as unknown as [number, number][][]).map((segment) =>
                      segment.map((c) => [c[1], c[0]] as [number, number])
                    )
                  : (coords as [number, number][]).map((c) => [c[1], c[0]] as [number, number]);

                setDraftRouteData({
                  success: true,
                  coordinates: coords,
                  leafletPoints,
                  distanceKm: target.distance_km || 0,
                  durationMin: target.duration_min || 0,
                  streetNames: [],
                  summary: target.name || "",
                  legs: [],
                  alternatives: [],
                });
              } else {
                setDraftRouteData(null);
              }

              setFolderSubTab("add-route");
            }
          }
        }
      } catch {}
    };

    initData().catch((e) => {
      if (isMounted) console.error(e);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 1.5. Perhitungan Metrik Rute Aktif (Rute Utama vs Jalur Alternatif Terpilih)
  const activeAlternative = React.useMemo(() => {
    if (!selectedAlternativeId || !draftRouteData?.alternatives) return null;
    return draftRouteData.alternatives.find((a) => a.id === selectedAlternativeId) || null;
  }, [selectedAlternativeId, draftRouteData]);

  const activeDraftLeafletPoints = React.useMemo(() => {
    if (activeAlternative) return activeAlternative.leafletPoints;
    return draftRouteData?.leafletPoints || [];
  }, [activeAlternative, draftRouteData]);

  const activeDraftCoordinates = React.useMemo(() => {
    if (activeAlternative) return activeAlternative.coordinates;
    return draftRouteData?.coordinates || [];
  }, [activeAlternative, draftRouteData]);

  const activeDraftDistanceKm = activeAlternative ? activeAlternative.distanceKm : draftRouteData?.distanceKm || 0;
  const activeDraftDurationMin = activeAlternative ? activeAlternative.durationMin : draftRouteData?.durationMin || 0;

  // Sinkronisasi latestStateRef agar selalu memegang nilai terbaru tanpa stale closure
  React.useEffect(() => {
    latestStateRef.current = {
      activeRouteId,
      routeName,
      targetFolder,
      customColor,
      customWeight,
      customOpacity,
      customLineStyle,
      travelMode,
      connectionMode,
      markerStyle,
      routeCategory,
      waypoints,
      activeDraftCoordinates,
      activeDraftDistanceKm,
      activeDraftDurationMin,
    };
  });

  // Simpan Sesi Edit Rute Aktif ke localStorage agar saat F5 / Refresh halaman tidak kembali ke daftar
  React.useEffect(() => {
    if (activeRouteId && folderSubTab === "add-route") {
      try {
        localStorage.setItem(
          ACTIVE_EDIT_SESSION_KEY,
          JSON.stringify({
            activeRouteId,
            selectedFolder: selectedFolder || targetFolder || "Utama",
            folderSubTab: "add-route",
          })
        );
      } catch {}
    }
  }, [activeRouteId, folderSubTab, selectedFolder, targetFolder]);

  // Simpan data state rute aktif sebelum unload (Refresh / Tutup Tab)
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const s = latestStateRef.current;
      if (s.activeRouteId && folderSubTab === "add-route") {
        try {
          localStorage.setItem(
            ACTIVE_EDIT_SESSION_KEY,
            JSON.stringify({
              activeRouteId: s.activeRouteId,
              selectedFolder: s.targetFolder || "Utama",
              folderSubTab: "add-route",
            })
          );
        } catch {}
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [folderSubTab]);

  // Fungsi Flush / Auto-Simpan ke Database untuk Rute Aktif
  const flushSave = React.useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const s = latestStateRef.current;
    if (!s.activeRouteId) return;

    const origin = s.waypoints[0];
    const destination = s.waypoints[s.waypoints.length - 1];

    const isMultiLine =
      Array.isArray(s.activeDraftCoordinates) &&
      s.activeDraftCoordinates.length > 0 &&
      Array.isArray(s.activeDraftCoordinates[0]) &&
      Array.isArray((s.activeDraftCoordinates as unknown[][])[0][0]);

    const coordinates: [number, number][] | [number, number][][] =
      s.activeDraftCoordinates.length > 0
        ? s.activeDraftCoordinates
        : s.waypoints.length >= 2
        ? s.waypoints.map((w) => [w.lng, w.lat] as [number, number])
        : [];

    const geojsonType = isMultiLine ? "MultiLineString" : "LineString";

    const payload: Partial<TraversedRoadRecord> = {
      name: s.routeName.trim() || (origin && destination ? `${origin.name} ➔ ${destination.name}` : "Rute Baru"),
      folder_name: s.targetFolder.trim() || "Utama",
      origin_name: origin?.name || "Belum ditentukan",
      origin_lat: origin?.lat || 0,
      origin_lng: origin?.lng || 0,
      destination_name: destination?.name || "Belum ditentukan",
      destination_lat: destination?.lat || 0,
      destination_lng: destination?.lng || 0,
      waypoints: s.waypoints.map((w, idx) => ({
        id: w.id || `wp-${idx}`,
        name: w.name,
        lat: w.lat,
        lng: w.lng,
        isDisconnected: w.isDisconnected,
        connectionType: w.connectionType,
        branchTargetCoord: w.branchTargetCoord,
      })),
      distance_km: s.activeDraftDistanceKm,
      duration_min: s.activeDraftDurationMin,
      color: s.customColor,
      weight: s.customWeight,
      opacity: s.customOpacity,
      line_style: s.customLineStyle,
      marker_style: s.markerStyle,
      connection_mode: s.connectionMode,
      travel_mode: s.travelMode,
      category: s.routeCategory,
      geojson: {
        type: geojsonType,
        coordinates,
      },
    };

    const fingerprint = JSON.stringify({
      id: s.activeRouteId,
      name: payload.name,
      folder_name: payload.folder_name,
      origin_name: payload.origin_name,
      destination_name: payload.destination_name,
      waypointsCount: s.waypoints.length,
      waypoints: s.waypoints.map((w) => [w.lat, w.lng, w.connectionType, w.isDisconnected]),
      coordsCount: coordinates.length,
      distanceKm: s.activeDraftDistanceKm,
      durationMin: s.activeDraftDurationMin,
      color: s.customColor,
      weight: s.customWeight,
      line_style: s.customLineStyle,
      marker_style: s.markerStyle,
      connection_mode: s.connectionMode,
      travel_mode: s.travelMode,
    });

    if (fingerprint === lastSavedFingerprintRef.current) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateKustomisasiRute(s.activeRouteId, payload);
      if (res.success) {
        lastSavedFingerprintRef.current = fingerprint;
        // Update state routes lokal secara instan agar data rute selalu sinkron
        setRoutes((prev) =>
          prev.map((r) =>
            r.id === s.activeRouteId
              ? {
                  ...r,
                  ...payload,
                  geojson: {
                    type: geojsonType,
                    coordinates,
                  },
                  distance_km: s.activeDraftDistanceKm,
                  duration_min: s.activeDraftDurationMin,
                  waypoints: s.waypoints.map((w, idx) => ({
                    id: w.id || `wp-${idx}`,
                    name: w.name,
                    lat: w.lat,
                    lng: w.lng,
                    isDisconnected: w.isDisconnected,
                    connectionType: w.connectionType,
                    branchTargetCoord: w.branchTargetCoord,
                  })),
                }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Auto-save rute error:", err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Debounced Auto-Simpan saat Mengubah Titik / Nama / Warna / Ukuran / Gaya Ikon / Opsi Hubungkan
  React.useEffect(() => {
    if (!activeRouteId || folderSubTab !== "add-route") return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      flushSave();
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    activeRouteId,
    folderSubTab,
    routeName,
    targetFolder,
    waypoints,
    activeDraftCoordinates,
    activeDraftDistanceKm,
    activeDraftDurationMin,
    customColor,
    customWeight,
    customLineStyle,
    markerStyle,
    connectionMode,
    travelMode,
    flushSave,
  ]);

  // Ekstrak semua koordinat rute lain di peta untuk menghubungkan titik cabang ke rute terdekat
  const otherRoutesCoordinates = React.useMemo(() => {
    const list: [number, number][][] = [];
    routes.forEach((r) => {
      if (r.id === activeRouteId) return; // Lewati rute yang sedang diedit
      const routeGeojson = parseRouteGeoJSON(r.geojson);
      const coords = routeGeojson?.coordinates;
      if (Array.isArray(coords) && coords.length > 0) {
        const firstElem = coords[0];
        const isMulti =
          routeGeojson?.type === "MultiLineString" ||
          (Array.isArray(firstElem) && Array.isArray((firstElem as unknown as number[])[0]));

        if (isMulti) {
          (coords as unknown as number[][][]).forEach((seg) => {
            if (Array.isArray(seg)) {
              const validSeg = seg
                .filter((c) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]))
                .map((c) => [c[1], c[0]] as [number, number]);
              if (validSeg.length >= 2) list.push(validSeg);
            }
          });
        } else {
          const validSeg = (coords as unknown as number[][])
            .filter((c) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]))
            .map((c) => [c[1], c[0]] as [number, number]);
          if (validSeg.length >= 2) list.push(validSeg);
        }
      } else if (Array.isArray(r.waypoints) && r.waypoints.length >= 2) {
        const validWps = r.waypoints
          .filter((w) => w && !isNaN(w.lat) && !isNaN(w.lng) && !(w.lat === 0 && w.lng === 0))
          .map((w) => [w.lat, w.lng] as [number, number]);
        if (validWps.length >= 2) list.push(validWps);
      }
    });
    return list;
  }, [routes, activeRouteId]);

  // Kunci koordinat titik & tipe sambungan jalan untuk mencegah kalkulasi OSRM berlebih
  const waypointsCoordKey = React.useMemo(
    () =>
      waypoints
        .map(
          (w) =>
            `${w.lat.toFixed(6)},${w.lng.toFixed(6)},${w.connectionType || "seq"},${
              w.isDisconnected ? "disc" : "conn"
            }`
        )
        .join("|"),
    [waypoints]
  );

  // 2. Kalkulasi Rute Otomatis saat Waypoint atau ConnectionMode Berubah
  React.useEffect(() => {
    if (waypoints.length < 2) return;

    let isMounted = true;
    calculateMultiPointRoadRoute(waypoints, connectionMode, otherRoutesCoordinates)
      .then((res) => {
        if (!isMounted) return;
        setDraftRouteData(res);
        setIsCalculatingRoute(false);
        setSelectedAlternativeId((prev) => {
          if (prev && res.alternatives?.some((a) => a.id === prev)) return prev;
          return null;
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Gagal kalkulasi rute:", err);
        setIsCalculatingRoute(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waypointsCoordKey, connectionMode, otherRoutesCoordinates.length]);

  // Fungsi Riwayat Perubahan (Undo & Redo)
  const pushHistorySnapshot = React.useCallback(() => {
    setUndoStack((prev) => [
      ...prev.slice(-30),
      {
        waypoints: JSON.parse(JSON.stringify(waypoints)),
        connectionMode,
        markerStyle,
        targetPoint: zoomTargetPoint ? { lat: zoomTargetPoint.lat, lng: zoomTargetPoint.lng } : null,
      },
    ]);
    setRedoStack([]);
  }, [waypoints, connectionMode, markerStyle, zoomTargetPoint]);

  const handleConnectionModeChange = React.useCallback((mode: ConnectionMode) => {
    pushHistorySnapshot();
    clearOsrmCache();
    setIsCalculatingRoute(true);
    setConnectionMode(mode);
  }, [pushHistorySnapshot]);

  const handleUndo = React.useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, undoStack.length - 1);

    // Jika perubahan dibatalkan kembali ke kondisi awal (awal rute), reset redo agar nol dan tidak aktif
    if (newUndoStack.length === 0) {
      setRedoStack([]);
    } else {
      const current: HistorySnapshot = {
        waypoints: JSON.parse(JSON.stringify(waypoints)),
        connectionMode,
        markerStyle,
        targetPoint: null,
      };
      setRedoStack((prev) => [...prev, current]);
    }
    setUndoStack(newUndoStack);

    // Kembalikan posisi titik, mode koneksi & gaya marker tanpa mengubah zoom kamera peta
    setWaypoints(previous.waypoints);
    setConnectionMode(previous.connectionMode);
    setMarkerStyle(previous.markerStyle);
    // CATATAN: Tidak memanggil setZoomTargetPoint agar peta tidak melompat/zoom ke titik lain,
    // sehingga pengguna dapat melihat langsung titik kembali ke posisi semula di layar.
    showToast("Perubahan dibatalkan (Undo)", "success");
  }, [undoStack, waypoints, connectionMode, markerStyle]);

  const handleRedo = React.useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    const current: HistorySnapshot = {
      waypoints: JSON.parse(JSON.stringify(waypoints)),
      connectionMode,
      markerStyle,
      targetPoint: null,
    };
    setUndoStack((prev) => [...prev, current]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));

    setWaypoints(next.waypoints);
    setConnectionMode(next.connectionMode);
    setMarkerStyle(next.markerStyle);
    // Tidak memicu zoom peta agar posisi tetap stabil
    showToast("Perubahan diulangi (Redo)", "success");
  }, [redoStack, waypoints, connectionMode, markerStyle]);

  // 3. Interaksi Klik Peta untuk Menambah Titik Secara Berurutan (Append)
  const handleMapClick = async (lat: number, lng: number) => {
    if (folderSubTab !== "add-route") return;

    if (!selectedFolder) {
      setSelectedFolder(targetFolder || "Utama");
    }

    pushHistorySnapshot();

    // Pastikan tidak ada target zoom yang tertunda yang mengganggu klik penambahan titik
    setZoomTargetRouteId(null);
    setZoomTargetFolder(null);
    setZoomTargetPoint(null);
    setZoomTargetDraftRoute(null);

    setIsCalculatingRoute(true);
    const newId = `wp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const tempName = `Titik ${waypoints.length + 1}`;
    const newWp: WaypointItem = { id: newId, name: tempName, lat, lng };

    setWaypoints((prev) => [...prev, newWp]);

    const roadName = await reverseGeocodeRoadName(lat, lng);
    setWaypoints((prev) =>
      prev.map((p) => (p.id === newId ? { ...p, name: roadName } : p))
    );
  };

  const handleWaypointDragEnd = async (index: number, lat: number, lng: number) => {
    pushHistorySnapshot();
    setIsCalculatingRoute(true);
    setWaypoints((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, lat, lng } : p))
    );

    const roadName = await reverseGeocodeRoadName(lat, lng);
    setWaypoints((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, name: roadName } : p))
    );
  };

  const handleRemoveWaypoint = (index: number) => {
    pushHistorySnapshot();
    setWaypoints((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length < 2) setDraftRouteData(null);
      else setIsCalculatingRoute(true);
      return next;
    });
  };

  const handleResetWaypoints = () => {
    pushHistorySnapshot();
    setWaypoints([]);
    setDraftRouteData(null);
    setSelectedAlternativeId(null);
    setRouteName("Rute Baru");
    showToast("Titik rute berhasil direset", "success");
  };

  const handleMoveWaypoint = (index: number, direction: "up" | "down") => {
    pushHistorySnapshot();
    setWaypoints((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const clone = [...prev];
      const temp = clone[index];
      clone[index] = clone[targetIndex];
      clone[targetIndex] = temp;
      setIsCalculatingRoute(true);
      return clone;
    });
  };

  const handleUpdateWaypointName = (index: number, newName: string) => {
    setWaypoints((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, name: newName } : p))
    );
  };

  // Buat Jalan Lain (Pisah Rute): Titik tidak akan dihubungkan ke titik sebelumnya
  const handleToggleDisconnectWaypoint = (index: number) => {
    if (index <= 0) return;
    pushHistorySnapshot();
    setIsCalculatingRoute(true);
    setWaypoints((prev) =>
      prev.map((p, idx) => {
        if (idx !== index) return p;
        const willDisconnect = !(p.connectionType === "disconnected" || p.isDisconnected);
        return {
          ...p,
          connectionType: willDisconnect ? "disconnected" : "sequential",
          isDisconnected: willDisconnect,
          branchTargetCoord: undefined,
        };
      })
    );
    const targetWp = waypoints[index];
    const willDisconnect = !(targetWp?.connectionType === "disconnected" || targetWp?.isDisconnected);
    showToast(
      willDisconnect
        ? `Titik ${index + 1} dipisahkan menjadi jalan baru`
        : `Titik ${index + 1} disambungkan kembali`,
      "success"
    );
  };

  // Hubungkan Rute Terdekat (Cabang Huruf T / Sambung Otomatis): Hubungkan titik ke jalan terdekat yang sudah dirute
  const handleConnectWaypointToNearest = (index: number, mode: "road" | "direct" = "road") => {
    if (waypoints.length < 2 || index < 0 || index >= waypoints.length) return;
    pushHistorySnapshot();
    setIsCalculatingRoute(true);
    const targetType = mode === "direct" ? "direct_snap" : "nearest_branch";

    setWaypoints((prev) =>
      prev.map((p, idx) => {
        if (idx !== index) return p;
        const isCurrentlySame = p.connectionType === targetType;
        return {
          ...p,
          connectionType: isCurrentlySame ? "sequential" : targetType,
          isDisconnected: false,
          branchTargetCoord: undefined,
        };
      })
    );
    const targetWp = waypoints[index];
    const isCurrentlySame = targetWp?.connectionType === targetType;
    showToast(
      !isCurrentlySame
        ? mode === "direct"
          ? `Titik ${index + 1} dihubungkan langsung ke jalur terdekat (Snap Cepat)`
          : `Titik ${index + 1} dihubungkan ke jalur terdekat (Ikuti Jalan)`
        : `Titik ${index + 1} dikembalikan ke rute berurutan normal`,
      "success"
    );
  };

  // Import Titik Perjalanan dari File (GeoJSON, GPX, KML)
  const handleImportWaypoints = (
    newWaypoints: WaypointItem[],
    mode: "snap_roads" | "keep_original"
  ) => {
    pushHistorySnapshot();
    setIsCalculatingRoute(true);
    if (mode === "keep_original") {
      setConnectionMode("smart_direct");
    } else {
      setConnectionMode("sequential");
    }
    setWaypoints(newWaypoints);
    showToast(
      `Berhasil mengimpor ${newWaypoints.length} titik perjalanan (${
        mode === "snap_roads" ? "Sesuaikan dengan jalan" : "Sesuai file awal"
      })`,
      "success"
    );
  };

  // Balikkan Semua Titik Rute (Start ⇄ Finish)
  const handleReverseAllWaypoints = () => {
    if (waypoints.length < 2) return;
    pushHistorySnapshot();
    setIsCalculatingRoute(true);
    setWaypoints((prev) => [...prev].reverse());
    showToast("Arah rute berhasil dibalikkan (Awal ⇄ Akhir)", "success");
  };

  // Hubungkan Semua Titik ke Cabang / Jalur Terdekat
  const handleConnectAllToNearest = () => {
    if (waypoints.length < 2) return;
    pushHistorySnapshot();
    setIsCalculatingRoute(true);
    setWaypoints((prev) =>
      prev.map((p, idx) =>
        idx === 0
          ? p
          : { ...p, connectionType: "nearest_branch", isDisconnected: false }
      )
    );
    showToast("Semua titik diarahkan untuk menyambung ke jalur terdekat", "success");
  };

  // 4. Operasi Buka & Tutup Folder
  const handleOpenFolder = (folderName: string) => {
    setPreviewFolder(null);
    setSelectedFolder(folderName);
    setTargetFolder(folderName);
    setFocusedFolder(folderName);
    setFocusedRouteId(null);
    setFolderSubTab("routes-list");
  };

  // Lihat Peta: tampilkan semua rute milik folder di peta (gaya sesuai tiap rute), tanpa membuka folder
  const handlePreviewFolderOnMap = (folderName: string) => {
    if (previewFolder && previewFolder.toLowerCase() === folderName.toLowerCase()) {
      setPreviewFolder(null);
      return;
    }
    setPreviewFolder(folderName);
    setFocusedRouteId(null);
    setZoomTargetFolder({ name: folderName, timestamp: Date.now() });
  };

  const handleBackToAllFolders = () => {
    setSelectedFolder(null);
    setPreviewFolder(null);
    setFocusedFolder(null);
    setFocusedRouteId(null);
    setZoomTargetFolder(null);
    setZoomTargetRouteId(null);
    setFolderSubTab("routes-list");
  };

  const handleFocusRoute = (routeId: number) => {
    setFocusedRouteId(routeId);
    setZoomTargetRouteId({ id: routeId, timestamp: Date.now() });
    const target = routes.find((r) => r.id === routeId);
    if (target) {
      showToast(`Mengarahkan ke rute: ${target.name}`, "success");
    }
  };

  const handleFocusWaypoint = (lat: number, lng: number) => {
    setZoomTargetPoint({ lat, lng, timestamp: Date.now() });
  };

  const handleZoomToActiveRoute = () => {
    setZoomTargetDraftRoute({ timestamp: Date.now() });
    showToast("Mengarahkan ke rute di peta", "success");
  };

  // Handler Pencarian Lokasi Google Maps Style
  const handleSelectLocationFromSearch = (lat: number, lng: number, name: string) => {
    setZoomTargetPoint({ lat, lng, timestamp: Date.now() });
    showToast(`Mengarahkan ke: ${name}`, "success");
  };

  const handleAddWaypointFromSearch = async (lat: number, lng: number, name: string) => {
    pushHistorySnapshot();
    setIsCalculatingRoute(true);
    const newId = `wp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newWp: WaypointItem = { id: newId, name, lat, lng };
    setWaypoints((prev) => [...prev, newWp]);
    setZoomTargetPoint({ lat, lng, timestamp: Date.now() });
    showToast(`Titik ditambahkan: ${name}`, "success");
  };

  // Handler Buka Modal Ekspor Folder & Rute
  const handleOpenExportFolder = (folderName: string) => {
    const targetRoutes = routes.filter(
      (r) => (r.folder_name || "Tanpa Folder").toLowerCase() === folderName.toLowerCase()
    );
    if (targetRoutes.length === 0) {
      showToast(`Folder "${folderName}" tidak memiliki rute untuk diekspor`, "error");
      return;
    }
    setExportModalState({
      isOpen: true,
      title: `Folder: ${folderName}`,
      routes: targetRoutes,
    });
  };

  const handleOpenExportRoute = (route: TraversedRoadRecord) => {
    setExportModalState({
      isOpen: true,
      title: `Rute: ${route.name}`,
      routes: [route],
    });
  };

  // Navigasi Kembali dari Mode Pemetaan / Edit: Otomatis Simpan & Kembali ke Daftar
  const handleBackFromEdit = React.useCallback(async () => {
    try {
      localStorage.removeItem(ACTIVE_EDIT_SESSION_KEY);
    } catch {}
    if (activeRouteId) {
      await flushSave();
      await fetchRoutesAndFolders();
    }
    setActiveRouteId(null);
    setWaypoints([]);
    setDraftRouteData(null);
    setSelectedAlternativeId(null);
    setUndoStack([]);
    setRedoStack([]);
    setFolderSubTab("routes-list");
  }, [activeRouteId, flushSave, fetchRoutesAndFolders]);

  // Tangani Navigasi Tombol Samping Mouse (Button 3 = Kembali / Back, Button 4 = Maju / Forward)
  React.useEffect(() => {
    const handleMouseAuxNav = (e: MouseEvent) => {
      // Button 3 = Tombol Kembali samping mouse
      if (e.button === 3) {
        e.preventDefault();
        e.stopPropagation();

        if (folderSubTab === "add-route") {
          // Dari edit rute -> kembali ke daftar rute di folder
          handleBackFromEdit();
        } else if (selectedFolder !== null) {
          // Dari daftar rute di folder -> kembali ke daftar semua folder
          setSelectedFolder(null);
        } else {
          // Dari daftar folder (root) -> kembali ke modul/halaman utama
          router.push("/");
        }
      } else if (e.button === 4) {
        // Button 4 = Tombol Maju samping mouse
        e.preventDefault();
        e.stopPropagation();

        if (selectedFolder === null && dbFolders.length > 0) {
          setSelectedFolder(dbFolders[0]);
        }
      }
    };

    window.addEventListener("mouseup", handleMouseAuxNav);
    window.addEventListener("auxclick", handleMouseAuxNav);
    return () => {
      window.removeEventListener("mouseup", handleMouseAuxNav);
      window.removeEventListener("auxclick", handleMouseAuxNav);
    };
  }, [folderSubTab, selectedFolder, dbFolders, router, handleBackFromEdit]);

  // Pindahkan Rute ke Folder Lain
  const handleConfirmMoveRoute = async (routeId: number, targetFld: string) => {
    const target = routes.find((r) => r.id === routeId);
    if (!target) return;
    const res = await updateKustomisasiRute(routeId, { ...target, folder_name: targetFld });
    if (res.success) {
      setRoutes((prev) =>
        prev.map((r) => (r.id === routeId ? { ...r, folder_name: targetFld } : r))
      );
      if (targetFld !== "Tanpa Folder" && !dbFolders.includes(targetFld)) {
        setDbFolders((prev) => [...prev, targetFld]);
      }
      showToast(`Rute "${target.name}" berhasil dipindahkan ke folder "${targetFld}"`, "success");
    } else {
      showToast("Gagal memindahkan rute ke folder", "error");
    }
  };

  // 6. Operasi Folder (Buat, Ubah Nama, Hapus)
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderNameInput.trim();
    if (!trimmed) {
      showToast("Nama folder tidak boleh kosong", "error");
      return;
    }

    const res = await buatFolderBaru(trimmed);
    if (res.success) {
      showToast(`Folder "${trimmed}" berhasil dibuat!`, "success");
      setDbFolders((prev) => Array.from(new Set([...prev, trimmed])));
      setSelectedFolder(trimmed);
      setTargetFolder(trimmed);
      setFolderSubTab("routes-list");
      setIsNewFolderModalOpen(false);
      setNewFolderNameInput("");
    } else {
      showToast(res.message || "Gagal membuat folder", "error");
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTargetFolder) return;
    const trimmed = renameNewNameInput.trim();
    if (!trimmed) {
      showToast("Nama folder tidak boleh kosong", "error");
      return;
    }

    const res = await ubahNamaFolder(renameTargetFolder, trimmed);
    if (res.success) {
      showToast(`Folder diubah menjadi "${trimmed}"`, "success");
      setDbFolders((prev) => prev.map((f) => (f === renameTargetFolder ? trimmed : f)));
      setRoutes((prev) =>
        prev.map((r) =>
          r.folder_name?.toLowerCase() === renameTargetFolder.toLowerCase()
            ? { ...r, folder_name: trimmed }
            : r
        )
      );
      if (selectedFolder === renameTargetFolder) setSelectedFolder(trimmed);
      if (targetFolder === renameTargetFolder) setTargetFolder(trimmed);
      setRenameTargetFolder(null);
      setRenameNewNameInput("");
    } else {
      showToast(res.message || "Gagal mengubah nama folder", "error");
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!deleteTargetFolder) return;
    const folderToDelete = deleteTargetFolder;

    const res = await hapusFolder(folderToDelete);
    if (res.success) {
      showToast(`Folder "${folderToDelete}" berhasil dihapus`, "success");
      setDbFolders((prev) =>
        prev.filter((f) => f.toLowerCase() !== folderToDelete.toLowerCase())
      );
      if (selectedFolder?.toLowerCase() === folderToDelete.toLowerCase()) {
        setSelectedFolder(null);
        setFolderSubTab("routes-list");
      }
      if (targetFolder?.toLowerCase() === folderToDelete.toLowerCase()) {
        setTargetFolder("Utama");
      }
      setRoutes((prev) =>
        prev.map((r) =>
          (r.folder_name || "").toLowerCase() === folderToDelete.toLowerCase()
            ? { ...r, folder_name: "Tanpa Folder" }
            : r
        )
      );
      setDeleteTargetFolder(null);
    } else {
      showToast(res.message || "Gagal menghapus folder", "error");
    }
  };

  // 7. Operasi Rute (Hapus & Edit Kustomisasi)
  const handleConfirmDeleteRoute = async () => {
    if (!deleteTargetRouteId) return;
    const idToDelete = deleteTargetRouteId;

    if (idToDelete === activeRouteId) {
      try {
        localStorage.removeItem(ACTIVE_EDIT_SESSION_KEY);
      } catch {}
    }

    const res = await hapusRute(idToDelete);
    if (res.success) {
      showToast("Rute jalan berhasil dihapus", "success");
      setRoutes((prev) => prev.filter((r) => r.id !== idToDelete));
      if (focusedRouteId === idToDelete) setFocusedRouteId(null);
      setIsDeleteRouteModalOpen(false);
      setDeleteTargetRouteId(null);
    } else {
      showToast(res.message || "Gagal menghapus rute", "error");
    }
  };

  const handleSaveRouteEdit = async () => {
    if (!editingRoute) return;

    const res = await updateKustomisasiRute(editingRoute.id, editingRoute);
    if (res.success) {
      showToast("Kustomisasi rute jalan berhasil diperbarui!", "success");
      setRoutes((prev) =>
        prev.map((r) => (r.id === editingRoute.id ? { ...r, ...editingRoute } : r))
      );
      setIsEditingRouteModalOpen(false);
      setEditingRoute(null);
    } else {
      showToast(res.message || "Gagal memperbarui rute", "error");
    }
  };

  const handleOpenRenameRouteModal = (route: TraversedRoadRecord) => {
    setRenameTargetRoute(route);
    setRenameRouteNewNameInput(route.name);
  };

  const handleConfirmRenameRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTargetRoute) return;
    const trimmed = renameRouteNewNameInput.trim();
    if (!trimmed) {
      showToast("Nama rute tidak boleh kosong", "error");
      return;
    }

    const res = await updateKustomisasiRute(renameTargetRoute.id, {
      name: trimmed,
    });

    if (res.success) {
      showToast(`Nama rute diubah menjadi "${trimmed}"`, "success");
      setRoutes((prev) =>
        prev.map((r) => (r.id === renameTargetRoute.id ? { ...r, name: trimmed } : r))
      );
      if (activeRouteId === renameTargetRoute.id) {
        setRouteName(trimmed);
      }
      setRenameTargetRoute(null);
      setRenameRouteNewNameInput("");
    } else {
      showToast(res.message || "Gagal mengubah nama rute", "error");
    }
  };

  // Alur Tambah Rute Baru: Langsung Simpan ke Database Saat Submit Nama Rute
  const handleOpenNewRouteModal = () => {
    setNewRouteNameInput("");
    setIsNewRouteModalOpen(true);
  };

  const handleSubmitNewRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRouteNameInput.trim();
    if (!trimmed) {
      showToast("Nama rute tidak boleh kosong", "error");
      return;
    }

    const folderForNewRoute = selectedFolder && selectedFolder !== "Tanpa Folder" ? selectedFolder : "Utama";

    setIsSaving(true);
    const initialPayload = {
      name: trimmed,
      folder_name: folderForNewRoute,
      origin_name: "Belum ditentukan",
      origin_lat: 0,
      origin_lng: 0,
      destination_name: "Belum ditentukan",
      destination_lat: 0,
      destination_lng: 0,
      waypoints: [],
      distance_km: 0,
      duration_min: 0,
      color: customColor,
      weight: customWeight,
      opacity: customOpacity,
      line_style: customLineStyle,
      marker_style: markerStyle,
      connection_mode: connectionMode,
      travel_mode: travelMode,
      category: routeCategory,
      geojson: {
        type: "LineString",
        coordinates: [],
      },
    };

    const res = await simpanRuteBaru(initialPayload);
    setIsSaving(false);

    if (res.success && res.data) {
      setActiveRouteId(res.data.id);
      setRouteName(trimmed);
      setTargetFolder(folderForNewRoute);
      setSelectedFolder(folderForNewRoute);
      setWaypoints([]);
      setDraftRouteData(null);
      setSelectedAlternativeId(null);
      setZoomTargetRouteId(null);
      setZoomTargetFolder(null);
      setZoomTargetPoint(null);
      setZoomTargetDraftRoute(null);
      setConnectionMode("sequential");
      setMarkerStyle("numbers");
      setTravelMode("bike");
      setIsNewRouteModalOpen(false);
      setFolderSubTab("add-route");
      lastSavedFingerprintRef.current = "";
      await fetchRoutesAndFolders();
      showToast(`Rute "${trimmed}" berhasil dibuat dan otomatis tersimpan!`, "success");
    } else {
      showToast(res.message || "Gagal membuat rute baru", "error");
    }
  };

  // Buka Pemetaan / Edit Jalur Rute yang Ada di Peta
  const handleEditRouteOnMap = (route: TraversedRoadRecord) => {
    setActiveRouteId(route.id);
    setRouteName(route.name || "Rute Baru");
    const targetFolderName = route.folder_name || selectedFolder || "Utama";
    setSelectedFolder(targetFolderName);
    setTargetFolder(targetFolderName);
    setZoomTargetRouteId(null);
    setZoomTargetFolder(null);
    setZoomTargetPoint(null);
    setZoomTargetDraftRoute(null);
    setCustomColor(route.color || DEFAULT_ROUTE_CONFIG.color);
    setCustomWeight(route.weight || DEFAULT_ROUTE_CONFIG.weight);
    const validLineStyles: LineStyle[] = ["solid", "dashed", "dotted"];
    const style: LineStyle = validLineStyles.includes(route.line_style as LineStyle)
      ? (route.line_style as LineStyle)
      : DEFAULT_ROUTE_CONFIG.lineStyle;
    setCustomLineStyle(style);

    const validMarkerStyles: MarkerStyle[] = ["numbers", "letters", "none", "icon", "pin", "dot", "random"];
    setMarkerStyle(
      validMarkerStyles.includes(route.marker_style as MarkerStyle)
        ? (route.marker_style as MarkerStyle)
        : "numbers"
    );

    const validConnectionModes: ConnectionMode[] = ["sequential", "nearest", "direct_line", "loop_closed", "smart_direct"];
    setConnectionMode(
      validConnectionModes.includes(route.connection_mode as ConnectionMode)
        ? (route.connection_mode as ConnectionMode)
        : "sequential"
    );

    const validTravelModes: TravelMode[] = ["bike", "driving", "foot"];
    setTravelMode(
      validTravelModes.includes(route.travel_mode as TravelMode)
        ? (route.travel_mode as TravelMode)
        : "bike"
    );

    const loadedWaypoints: WaypointItem[] = Array.isArray(route.waypoints)
      ? route.waypoints.map((wp, idx) => ({
          id: `wp-${route.id}-${idx}`,
          name: wp.name || `Titik ${idx + 1}`,
          lat: wp.lat,
          lng: wp.lng,
          isDisconnected: wp.isDisconnected,
          connectionType: wp.connectionType,
          branchTargetCoord: wp.branchTargetCoord,
        }))
      : [];

    setWaypoints(loadedWaypoints);
    setSelectedAlternativeId(null);
    setFocusedRouteId(route.id);
    lastSavedFingerprintRef.current = "";

    // Inisialisasi draft rute langsung dari geojson tersimpan agar instan dan tidak kedip
    const routeGeojson = parseRouteGeoJSON(route.geojson);
    if (routeGeojson && Array.isArray(routeGeojson.coordinates) && routeGeojson.coordinates.length > 0) {
      const coords = routeGeojson.coordinates;
      const isMulti =
        routeGeojson.type === "MultiLineString" ||
        (Array.isArray(coords[0]) && Array.isArray((coords as unknown[][])[0][0]));

      const leafletPoints = isMulti
        ? (coords as unknown as [number, number][][]).map((segment) =>
            segment.map((c) => [c[1], c[0]] as [number, number])
          )
        : (coords as [number, number][]).map((c) => [c[1], c[0]] as [number, number]);

      setDraftRouteData({
        success: true,
        coordinates: coords,
        leafletPoints,
        distanceKm: route.distance_km || 0,
        durationMin: route.duration_min || 0,
        streetNames: [],
        summary: route.name || "",
        legs: [],
        alternatives: [],
      });
    } else {
      setDraftRouteData(null);
    }

    setFolderSubTab("add-route");
  };

  // Handler untuk mengosongkan target zoom setelah dieksekusi satu kali oleh peta
  const handleClearZoomTarget = React.useCallback(
    (type: "route" | "folder" | "point" | "draft") => {
      if (type === "route") setZoomTargetRouteId(null);
      else if (type === "folder") setZoomTargetFolder(null);
      else if (type === "point") setZoomTargetPoint(null);
      else if (type === "draft") setZoomTargetDraftRoute(null);
    },
    []
  );

  // 8. Filtered & Grouped Data
  const allFolderList = React.useMemo(() => {
    const set = new Set<string>();
    dbFolders.forEach((f) => {
      if (f && f.trim().toLowerCase() !== "tanpa folder") set.add(f.trim());
    });
    routes.forEach((r) => {
      if (r.folder_name && r.folder_name.trim().toLowerCase() !== "tanpa folder") {
        set.add(r.folder_name.trim());
      }
    });
    return Array.from(set);
  }, [dbFolders, routes]);

  const unassignedRoutes = React.useMemo(() => {
    return routes.filter(
      (r) => !r.folder_name || r.folder_name.trim().toLowerCase() === "tanpa folder"
    );
  }, [routes]);

  const filteredRoutes = React.useMemo(() => {
    if (selectedFolder) {
      if (selectedFolder.trim().toLowerCase() === "tanpa folder") {
        return unassignedRoutes;
      }
      return routes.filter(
        (r) => (r.folder_name || "").trim().toLowerCase() === selectedFolder.trim().toLowerCase()
      );
    }
    return routes;
  }, [routes, selectedFolder, unassignedRoutes]);

  const mapRoutes = React.useMemo(() => {
    if (selectedFolder) return filteredRoutes;
    if (previewFolder) {
      if (previewFolder.trim().toLowerCase() === "tanpa folder") return unassignedRoutes;
      return routes.filter(
        (r) => (r.folder_name || "").trim().toLowerCase() === previewFolder.trim().toLowerCase()
      );
    }
    return [];
  }, [routes, selectedFolder, previewFolder, filteredRoutes, unassignedRoutes]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 text-xs font-medium ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          {toastMessage.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split View: Panel Samping (Kiri) & Peta Leaflet (Kanan) */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
        <PanelSamping
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
          activeBasemapId={activeBasemapId}
          onBasemapChange={setActiveBasemapId}
          dbError={dbError}
        >
          {!selectedFolder ? (
            <DaftarFolder
              allFolderList={allFolderList}
              routes={routes}
              unassignedRoutes={unassignedRoutes}
              onOpenFolder={handleOpenFolder}
              onViewFolder={handlePreviewFolderOnMap}
              previewFolder={previewFolder}
              onExportFolder={handleOpenExportFolder}
              onOpenNewFolderModal={() => setIsNewFolderModalOpen(true)}
              onOpenRenameFolderModal={(f) => {
                setRenameTargetFolder(f);
                setRenameNewNameInput(f);
              }}
              onOpenDeleteFolderModal={(f) => setDeleteTargetFolder(f)}
            />
          ) : selectedFolder !== "Tanpa Folder" && folderSubTab === "add-route" ? (
            <TambahRute
              selectedFolder={selectedFolder}
              filteredRoutesCount={filteredRoutes.length}
              onGoBack={handleBackFromEdit}
              onSelectLocation={handleSelectLocationFromSearch}
              onAddWaypointDirectly={handleAddWaypointFromSearch}
              routeName={routeName}
              onRouteNameChange={setRouteName}
              customColor={customColor}
              onCustomColorChange={setCustomColor}
              customWeight={customWeight}
              onCustomWeightChange={setCustomWeight}
              customOpacity={customOpacity}
              customLineStyle={customLineStyle}
              onCustomLineStyleChange={setCustomLineStyle}
              markerStyle={markerStyle}
              onMarkerStyleChange={setMarkerStyle}
              connectionMode={connectionMode}
              onConnectionModeChange={handleConnectionModeChange}
              canUndo={undoStack.length > 0}
              canRedo={redoStack.length > 0}
              undoCount={undoStack.length}
              redoCount={redoStack.length}
              onUndo={handleUndo}
              onRedo={handleRedo}
              waypoints={waypoints}
              draftRouteData={draftRouteData}
              selectedAlternativeId={selectedAlternativeId}
              onSelectAlternativeRoute={(id) => {
                setSelectedAlternativeId(id);
                if (id && draftRouteData?.alternatives) {
                  const alt = draftRouteData.alternatives.find((a) => a.id === id);
                  if (alt) showToast(`Beralih ke jalur alternatif: ${alt.name}`, "success");
                } else {
                  showToast("Kembali ke jalur rute utama", "success");
                }
              }}
              isCalculatingRoute={isCalculatingRoute}
              isSaving={isSaving}
              onResetWaypoints={handleResetWaypoints}
              onRemoveWaypoint={handleRemoveWaypoint}
              onMoveWaypoint={handleMoveWaypoint}
              onToggleDisconnectWaypoint={handleToggleDisconnectWaypoint}
              onConnectWaypointToNearest={handleConnectWaypointToNearest}
              hideWaypointsOnMap={hideWaypointsOnMap}
              onToggleHideWaypoints={setHideWaypointsOnMap}
              isPositionLocked={isPositionLocked}
              onTogglePositionLocked={setIsPositionLocked}
              onFocusWaypoint={handleFocusWaypoint}
              onZoomToRoute={handleZoomToActiveRoute}
              onUpdateWaypointName={handleUpdateWaypointName}
              onImportWaypoints={handleImportWaypoints}
              onReverseAllWaypoints={handleReverseAllWaypoints}
              onConnectAllToNearest={handleConnectAllToNearest}
            />
          ) : (
            <DaftarRuteFolder
              selectedFolder={selectedFolder}
              filteredRoutes={filteredRoutes}
              focusedRouteId={focusedRouteId}
              onBackToAllFolders={handleBackToAllFolders}
              onFocusRoute={handleFocusRoute}
              onExportRoute={handleOpenExportRoute}
              onOpenEditRouteModal={(r) => {
                setEditingRoute({ ...r });
                setIsEditingRouteModalOpen(true);
              }}
              onOpenDeleteRouteModal={(id) => {
                setDeleteTargetRouteId(id);
                setIsDeleteRouteModalOpen(true);
              }}
              onOpenRenameFolderModal={(f) => {
                setRenameTargetFolder(f);
                setRenameNewNameInput(f);
              }}
              onOpenDeleteFolderModal={(f) => setDeleteTargetFolder(f)}
              onOpenNewRouteModal={handleOpenNewRouteModal}
              onOpenRenameRouteModal={handleOpenRenameRouteModal}
              onEditRouteOnMap={handleEditRouteOnMap}
              onOpenMoveFolderModal={(r) => {
                setMoveTargetRoute(r);
                setIsMoveFolderModalOpen(true);
              }}
            />
          )}
        </PanelSamping>

        <PetaRute
          isSidePanelOpen={isSidePanelOpen}
          onOpenSidePanel={() => setIsSidePanelOpen(true)}
          routes={mapRoutes}
          waypoints={waypoints}
          draftPathCoordinates={activeDraftLeafletPoints}
          alternativeRoutes={draftRouteData?.alternatives || []}
          selectedAlternativeId={selectedAlternativeId}
          onSelectAlternativeRoute={(id) => {
            setSelectedAlternativeId(id);
            if (id && draftRouteData?.alternatives) {
              const alt = draftRouteData.alternatives.find((a) => a.id === id);
              if (alt) showToast(`Beralih ke jalur alternatif: ${alt.name}`, "success");
            } else {
              showToast("Kembali ke jalur rute utama", "success");
            }
          }}
          customColor={customColor}
          customWeight={customWeight}
          customOpacity={customOpacity}
          customLineStyle={customLineStyle}
          markerStyle={markerStyle}
          isAddPointMode={folderSubTab === "add-route"}
          onMapClickAddWaypoint={handleMapClick}
          onWaypointDragEnd={handleWaypointDragEnd}
          onRemoveWaypoint={handleRemoveWaypoint}
          onMoveWaypoint={handleMoveWaypoint}
          onToggleDisconnectWaypoint={handleToggleDisconnectWaypoint}
          onConnectWaypointToNearest={handleConnectWaypointToNearest}
          onUpdateWaypointName={handleUpdateWaypointName}
          hideWaypointsOnMap={hideWaypointsOnMap}
          isPositionLocked={isPositionLocked}
          basemapId={activeBasemapId}
          focusedRouteId={focusedRouteId}
          focusedFolder={focusedFolder}
          zoomTargetRouteId={zoomTargetRouteId}
          zoomTargetFolder={zoomTargetFolder}
          zoomTargetPoint={zoomTargetPoint}
          zoomTargetDraftRoute={zoomTargetDraftRoute}
          onClearZoomTarget={handleClearZoomTarget}
          activeRouteId={activeRouteId}
          isCalculatingRoute={isCalculatingRoute}
          onRouteClick={(r) => setFocusedRouteId(r.id)}
        />
      </div>

      {/* Pop-up Modals untuk Folder */}
      <ModalFolder
        isNewFolderOpen={isNewFolderModalOpen}
        newFolderName={newFolderNameInput}
        onNewFolderNameChange={setNewFolderNameInput}
        onCloseNewFolder={() => setIsNewFolderModalOpen(false)}
        onSubmitNewFolder={handleCreateFolder}
        renameTargetFolder={renameTargetFolder}
        renameNewName={renameNewNameInput}
        onRenameNewNameChange={setRenameNewNameInput}
        onCloseRenameFolder={() => {
          setRenameTargetFolder(null);
          setRenameNewNameInput("");
        }}
        onSubmitRenameFolder={handleRenameFolder}
        deleteTargetFolder={deleteTargetFolder}
        onCloseDeleteFolder={() => setDeleteTargetFolder(null)}
        onConfirmDeleteFolder={handleConfirmDeleteFolder}
      />

      {/* Pop-up Modals untuk Rute */}
      <ModalRute
        isNewRouteOpen={isNewRouteModalOpen}
        newRouteName={newRouteNameInput}
        targetFolderName={selectedFolder || targetFolder}
        onNewRouteNameChange={setNewRouteNameInput}
        onCloseNewRoute={() => setIsNewRouteModalOpen(false)}
        onSubmitNewRoute={handleSubmitNewRoute}
        isSubmitting={isSaving}
        isDeleteOpen={isDeleteRouteModalOpen}
        targetRoute={routes.find((r) => r.id === deleteTargetRouteId) || null}
        onCloseDelete={() => {
          setIsDeleteRouteModalOpen(false);
          setDeleteTargetRouteId(null);
        }}
        onConfirmDelete={handleConfirmDeleteRoute}
        isEditOpen={isEditingRouteModalOpen}
        editingRoute={editingRoute}
        allFolderList={allFolderList}
        onEditingRouteChange={setEditingRoute}
        onCloseEdit={() => {
          setIsEditingRouteModalOpen(false);
          setEditingRoute(null);
        }}
        onSubmitEdit={handleSaveRouteEdit}
        renameTargetRoute={renameTargetRoute}
        renameRouteNewName={renameRouteNewNameInput}
        onRenameRouteNewNameChange={setRenameRouteNewNameInput}
        onCloseRenameRoute={() => {
          setRenameTargetRoute(null);
          setRenameRouteNewNameInput("");
        }}
        onSubmitRenameRoute={handleConfirmRenameRoute}
      />

      {/* Modal Pindah Folder */}
      <ModalPindahFolder
        isOpen={isMoveFolderModalOpen}
        route={moveTargetRoute}
        allFolderList={allFolderList}
        onClose={() => {
          setIsMoveFolderModalOpen(false);
          setMoveTargetRoute(null);
        }}
        onConfirmMove={handleConfirmMoveRoute}
      />

      {/* Modal Ekspor Berkas (PNG, JPEG, SVG, GeoJSON, GPX, KML, CSV, JSON) */}
      <ModalEkspor
        isOpen={exportModalState.isOpen}
        title={exportModalState.title}
        routes={exportModalState.routes}
        onClose={() =>
          setExportModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSuccessToast={(msg) => showToast(msg, "success")}
      />
    </div>
  );
}
