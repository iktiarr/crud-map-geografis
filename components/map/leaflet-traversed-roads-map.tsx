"use client";

import * as React from "react";
import type * as LType from "leaflet";
import { BASEMAP_OPTIONS } from "./basemap-config";
import { 
  WaypointItem,
  AlternativeRouteOption,
} from "@/lib/road-routing";
import { getLetterLabel } from "@/modules/modul_3/tipe";
import { Trash2, Loader2, Link2, Unlink, Check, Eye, MoveUp, MoveDown, Edit3, X, Zap } from "lucide-react";

export type RouteGeoJsonObject = {
  type: string;
  coordinates: [number, number][] | [number, number][][];
};

export function parseRouteGeoJSON(raw: unknown): RouteGeoJsonObject | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).coordinates)) {
        return parsed as RouteGeoJsonObject;
      }
    } catch {
      return null;
    }
  } else if (typeof raw === "object" && raw !== null && "coordinates" in raw) {
    const obj = raw as { type?: unknown; coordinates?: unknown };
    if (Array.isArray(obj.coordinates)) {
      return raw as RouteGeoJsonObject;
    }
  }
  return null;
}

export interface TraversedRoadRecord {
  id: number;
  name: string;
  folder_name?: string;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  waypoints?: WaypointItem[];
  distance_km: number;
  duration_min: number;
  color: string;
  weight: number;
  opacity: number;
  line_style: "solid" | "dashed" | "dotted" | string;
  marker_style?: "numbers" | "letters" | "none" | "icon" | "dot" | "random" | string;
  connection_mode?: "sequential" | "nearest" | "direct_line" | "loop_closed" | "smart_direct" | string;
  travel_mode?: string;
  category?: string;
  description?: string;
  geojson?: RouteGeoJsonObject | string | Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
  isVisible?: boolean;
}

export interface LeafletTraversedRoadsMapProps {
  // Saved routes from database
  routes: TraversedRoadRecord[];

  // Multi-point waypoints for active/draft route
  waypoints: WaypointItem[];
  draftPathCoordinates: [number, number][] | [number, number][][]; // [lat, lng] for Leaflet
  alternativeRoutes?: AlternativeRouteOption[];
  selectedAlternativeId?: string | null;
  onSelectAlternativeRoute?: (id: string | null) => void;

  // Customization for current/draft route
  customColor: string;
  customWeight: number;
  customOpacity: number;
  customLineStyle: "solid" | "dashed" | "dotted" | string;
  markerStyle?: "numbers" | "letters" | "none" | "icon" | "pin" | "dot" | "random";

  // Mode & Handlers
  isAddPointMode: boolean;
  onMapClickAddPoint?: (lat: number, lng: number) => void;
  onWaypointDragEnd?: (index: number, lat: number, lng: number) => void;
  onRouteLineClick?: (lat: number, lng: number) => void;
  onSelectRoute?: (route: TraversedRoadRecord) => void;
  onDeleteRoute?: (id: number) => void;
  onRemoveWaypoint?: (index: number) => void;
  onMoveWaypoint?: (index: number, direction: "up" | "down") => void;
  onToggleDisconnectWaypoint?: (index: number) => void;
  onConnectWaypointToNearest?: (index: number, mode?: "road" | "direct") => void;
  onUpdateWaypointName?: (index: number, newName: string) => void;
  hideWaypointsOnMap?: boolean;
  isPositionLocked?: boolean;
  focusedRouteId?: number | null;
  focusedFolder?: string | null;
  zoomTargetRouteId?: { id: number; timestamp: number } | null;
  zoomTargetFolder?: { name: string; timestamp: number } | null;
  zoomTargetPoint?: { lat: number; lng: number; timestamp: number } | null;
  zoomTargetDraftRoute?: { timestamp: number } | null;
  onClearZoomTarget?: (type: "route" | "folder" | "point" | "draft") => void;
  activeRouteId?: number | null;
  isCalculatingRoute?: boolean;

  // Insert mode state info
  insertModeInfo?: {
    fromIndex: number;
    toIndex: number;
    fromName: string;
    toName: string;
  } | null;
  onCancelInsertMode?: () => void;

  // Basemap
  activeBasemapId?: string;
  className?: string;
}

export function LeafletTraversedRoadsMap({
  routes,
  waypoints,
  draftPathCoordinates,
  alternativeRoutes = [],
  selectedAlternativeId = null,
  onSelectAlternativeRoute,
  customColor = "#2563eb",
  customWeight = 6,
  customOpacity = 0.9,
  customLineStyle = "solid",
  markerStyle = "numbers",
  isAddPointMode = true,
  onMapClickAddPoint,
  onWaypointDragEnd,
  onRemoveWaypoint,
  onMoveWaypoint,
  onToggleDisconnectWaypoint,
  onConnectWaypointToNearest,
  onUpdateWaypointName,
  hideWaypointsOnMap = false,
  isPositionLocked = true,
  onRouteLineClick,
  onSelectRoute,
  onDeleteRoute,
  focusedRouteId,
  zoomTargetRouteId,
  zoomTargetFolder,
  zoomTargetPoint,
  zoomTargetDraftRoute,
  onClearZoomTarget,
  activeRouteId = null,
  isCalculatingRoute = false,
  insertModeInfo,
  onCancelInsertMode,
  activeBasemapId = "carto-voyager",
  className = "w-full h-full",
}: LeafletTraversedRoadsMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<LType.Map | null>(null);
  const currentTileLayerRef = React.useRef<LType.TileLayer | null>(null);
  const layerCacheRef = React.useRef<Map<string, LType.TileLayer>>(new Map());

  // Layer Groups
  const savedRoutesLayerGroupRef = React.useRef<LType.FeatureGroup | null>(null);
  const draftRouteLayerGroupRef = React.useRef<LType.FeatureGroup | null>(null);
  const alternativeRoutesLayerGroupRef = React.useRef<LType.FeatureGroup | null>(null);
  const waypointsLayerGroupRef = React.useRef<LType.FeatureGroup | null>(null);
  const routePolylineMapRef = React.useRef<Map<number, LType.Polyline>>(new Map());
  const routesRef = React.useRef(routes);

  React.useEffect(() => {
    routesRef.current = routes;
  });

  const [L, setL] = React.useState<typeof LType | null>(null);
  const [isMapReady, setIsMapReady] = React.useState(false);

  // Dynamic import Leaflet
  React.useEffect(() => {
    import("leaflet").then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

  // Ensure leaflet container class
  React.useEffect(() => {
    if (mapContainerRef.current && !mapContainerRef.current.classList.contains("leaflet-container")) {
      mapContainerRef.current.classList.add("leaflet-container");
    }
  });

  // Tile layer helper
  const createTileLayer = React.useCallback(
    (leaflet: typeof LType, basemapId: string) => {
      if (layerCacheRef.current.has(basemapId)) {
        return layerCacheRef.current.get(basemapId)!;
      }

      const basemapConfig =
        BASEMAP_OPTIONS.find((b) => b.id === basemapId) || BASEMAP_OPTIONS[0];

      const layer = leaflet.tileLayer(basemapConfig.url, {
        attribution: basemapConfig.attribution,
        maxZoom: basemapConfig.maxZoom,
        maxNativeZoom: basemapConfig.maxNativeZoom ?? basemapConfig.maxZoom,
        subdomains: basemapConfig.subdomains || ["a", "b", "c"],
        crossOrigin: "anonymous",
      });

      layerCacheRef.current.set(basemapId, layer);
      return layer;
    },
    []
  );

  // Keep references to latest callbacks to avoid stale closures
  const callbacksRef = React.useRef({
    isAddPointMode,
    waypoints,
    draftPathCoordinates,
    onMapClickAddPoint,
    onWaypointDragEnd,
    onRemoveWaypoint,
    onMoveWaypoint,
    onToggleDisconnectWaypoint,
    onConnectWaypointToNearest,
    onUpdateWaypointName,
    isPositionLocked,
    onRouteLineClick,
    onSelectAlternativeRoute,
    onSelectRoute,
    onDeleteRoute,
  });

  React.useEffect(() => {
    callbacksRef.current = {
      isAddPointMode,
      waypoints,
      draftPathCoordinates,
      onMapClickAddPoint,
      onWaypointDragEnd,
      onRemoveWaypoint,
      onMoveWaypoint,
      onToggleDisconnectWaypoint,
      onConnectWaypointToNearest,
      onUpdateWaypointName,
      isPositionLocked,
      onRouteLineClick,
      onSelectAlternativeRoute,
      onSelectRoute,
      onDeleteRoute,
    };
  });

  // State Context Menu Titik (Klik Kanan pada Marker)
  const [waypointContextMenu, setWaypointContextMenu] = React.useState<{
    x: number;
    y: number;
    index: number;
    wp: WaypointItem;
  } | null>(null);

  // State Edit Nama Titik dari Peta
  const [mapEditingWp, setMapEditingWp] = React.useState<{ index: number; name: string } | null>(null);

  const closeWaypointContextMenu = React.useCallback(() => {
    setWaypointContextMenu(null);
    setMapEditingWp(null);
  }, []);

  React.useEffect(() => {
    if (!waypointContextMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeWaypointContextMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [waypointContextMenu, closeWaypointContextMenu]);

  const [initialBasemapId] = React.useState(activeBasemapId);

  // Initialize Map
  React.useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    let initialCenter: [number, number] = [-6.9754, 108.4831];
    let initialZoom = 14;
    try {
      const savedView = sessionStorage.getItem("traversed_map_view");
      if (savedView) {
        const parsed = JSON.parse(savedView);
        if (typeof parsed.lat === "number" && typeof parsed.lng === "number" && typeof parsed.zoom === "number") {
          initialCenter = [parsed.lat, parsed.lng];
          initialZoom = parsed.zoom;
        }
      }
    } catch {
      // ignore
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      doubleClickZoom: false, // Mencegah zoom tidak sengaja saat klik cepat menambah titik
    });

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

    const initialLayer = createTileLayer(L, initialBasemapId);
    initialLayer.addTo(map);
    currentTileLayerRef.current = initialLayer;

    // Create layer groups
    const savedRoutesGroup = L.featureGroup().addTo(map);
    const alternativeRoutesGroup = L.featureGroup().addTo(map);
    const draftRouteGroup = L.featureGroup().addTo(map);
    const waypointsGroup = L.featureGroup().addTo(map);

    savedRoutesLayerGroupRef.current = savedRoutesGroup;
    alternativeRoutesLayerGroupRef.current = alternativeRoutesGroup;
    draftRouteLayerGroupRef.current = draftRouteGroup;
    waypointsLayerGroupRef.current = waypointsGroup;

    // Handle map clicks for adding waypoints
    map.on("click", (e: LType.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const { isAddPointMode: canAdd, onMapClickAddPoint: cb } = callbacksRef.current;
      if (canAdd && cb) {
        cb(lat, lng);
      }
    });

    // Simpan posisi peta saat user pan / zoom secara manual
    map.on("moveend", () => {
      try {
        const c = map.getCenter();
        const z = map.getZoom();
        sessionStorage.setItem(
          "traversed_map_view",
          JSON.stringify({ lat: c.lat, lng: c.lng, zoom: z })
        );
      } catch {
        // ignore
      }
    });

    // Cegah Leaflet mem-pan otomatis kembali ke center lama saat container berubah ukuran
    let lastW = mapContainerRef.current?.clientWidth || 0;
    let lastH = mapContainerRef.current?.clientHeight || 0;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (Math.abs(width - lastW) > 2 || Math.abs(height - lastH) > 2) {
          lastW = width;
          lastH = height;
          map.invalidateSize({ pan: false });
        }
      }
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    mapInstanceRef.current = map;
    setIsMapReady(true);

    map.whenReady(() => {
      setIsMapReady(true);
      map.invalidateSize({ pan: false });
      setTimeout(() => map.invalidateSize({ pan: false }), 60);
      setTimeout(() => map.invalidateSize({ pan: false }), 200);
      setTimeout(() => map.invalidateSize({ pan: false }), 500);
    });

    return () => {
      resizeObserver.disconnect();
      try {
        savedRoutesGroup.clearLayers();
        alternativeRoutesGroup.clearLayers();
        draftRouteGroup.clearLayers();
        waypointsGroup.clearLayers();
      } catch {
        // ignore
      }
      map.remove();
      mapInstanceRef.current = null;
      setIsMapReady(false);
    };
  }, [L, createTileLayer, initialBasemapId]);

  // Update Basemap Layer
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    const oldLayer = currentTileLayerRef.current;
    const newLayer = createTileLayer(L, activeBasemapId);

    if (oldLayer === newLayer) return;

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;

    if (oldLayer && map.hasLayer(oldLayer)) {
      map.removeLayer(oldLayer);
    }
  }, [L, activeBasemapId, createTileLayer]);

  // Helper for dash array
  const getDashArray = (style: string): string | undefined => {
    if (style === "dashed") return "12, 10";
    if (style === "dotted") return "3, 8";
    return undefined;
  };

  // Render Saved Traversed Routes
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !savedRoutesLayerGroupRef.current) return;
    const group = savedRoutesLayerGroupRef.current;
    group.clearLayers();
    routePolylineMapRef.current.clear();

    routes.forEach((route) => {
      if (route.isVisible === false) return;
      // Jangan gambar rute tersimpan jika rute ini sedang diedit aktif di layer draft
      if (activeRouteId && route.id === activeRouteId) return;

      let latlngs: LType.LatLngExpression[] | LType.LatLngExpression[][] = [];
      const geojsonObj = parseRouteGeoJSON(route.geojson);

      if (geojsonObj && Array.isArray(geojsonObj.coordinates) && geojsonObj.coordinates.length > 0) {
        const firstElem = geojsonObj.coordinates[0];
        const isMulti =
          geojsonObj.type === "MultiLineString" ||
          (Array.isArray(firstElem) && Array.isArray((firstElem as unknown as [number, number])[0]));

        if (isMulti) {
          latlngs = (geojsonObj.coordinates as [number, number][][]).map((seg) =>
            seg.map((c) => [c[1], c[0]] as [number, number])
          );
        } else {
          latlngs = (geojsonObj.coordinates as [number, number][]).map((c) => [c[1], c[0]] as [number, number]);
        }
      } else if (Array.isArray(route.waypoints) && route.waypoints.length >= 2) {
        latlngs = route.waypoints
          .filter((w) => w && !isNaN(w.lat) && !isNaN(w.lng) && !(w.lat === 0 && w.lng === 0))
          .map((w) => [w.lat, w.lng] as [number, number]);
      } else if (route.origin_lat && route.destination_lat) {
        latlngs = [
          [route.origin_lat, route.origin_lng],
          [route.destination_lat, route.destination_lng],
        ];
      }

      if (!latlngs || latlngs.length === 0) return;

      const isFocused = focusedRouteId === route.id;
      const routeColor = route.color || "#2563eb";
      const routeWeight = isFocused ? (route.weight || 6) + 4 : (route.weight || 6);
      const dash = getDashArray(route.line_style);

      // Glow underlay
      const glowPolyline = L.polyline(latlngs, {
        color: isFocused ? "#ffffff" : routeColor,
        weight: routeWeight + 4,
        opacity: isFocused ? 0.9 : 0.25,
        lineCap: "round",
        lineJoin: "round",
        interactive: false,
      });
      group.addLayer(glowPolyline);

      // Main colored route line
      const mainPolyline = L.polyline(latlngs, {
        color: routeColor,
        weight: routeWeight,
        opacity: route.opacity !== undefined ? route.opacity : 0.9,
        dashArray: dash,
        lineCap: "round",
        lineJoin: "round",
        interactive: true,
      });

      mainPolyline.bindTooltip(
        `<div class="px-2 py-1 text-xs font-sans">
          <div class="font-bold text-foreground flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${routeColor}"></span>
            ${route.name}
          </div>
          <div class="text-[11px] text-muted-foreground mt-0.5 font-mono">
            ${route.distance_km} km • ${route.folder_name ? `Folder: ${route.folder_name}` : ""}
          </div>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      mainPolyline.bindPopup(
        `<div class="p-2 min-w-56 text-xs font-sans space-y-2">
          <div class="font-bold text-sm text-foreground flex items-center justify-between border-b border-border pb-1.5">
            <span class="truncate">${route.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border" style="color: ${routeColor}; border-color: ${routeColor}40">
              ${route.line_style || "solid"}
            </span>
          </div>
          <div class="space-y-1 text-muted-foreground text-[11px]">
            <div><strong>Folder:</strong> <span class="text-primary font-medium">${route.folder_name || "Tanpa Folder"}</span></div>
            <div><strong>Asal:</strong> ${route.origin_name}</div>
            <div><strong>Tujuan:</strong> ${route.destination_name}</div>
            <div><strong>Jarak Total:</strong> <span class="font-mono text-foreground font-semibold">${route.distance_km} km</span> (${(route.distance_km * 1000).toLocaleString()} m)</div>
            <div><strong>Waktu Tempuh:</strong> <span class="font-mono text-foreground">${route.duration_min} menit</span></div>
            ${route.description ? `<div class="italic text-[10px] pt-1 text-muted-foreground">${route.description}</div>` : ""}
          </div>
          <div class="pt-1.5 flex items-center justify-end gap-1.5 border-t border-border">
            <button id="btn-focus-${route.id}" class="px-2 py-1 text-[10px] font-medium rounded bg-secondary hover:bg-muted text-foreground cursor-pointer transition-colors">
              Fokus
            </button>
            <button id="btn-del-${route.id}" class="px-2 py-1 text-[10px] font-medium rounded bg-red-500/10 text-red-600 hover:bg-red-500/20 cursor-pointer transition-colors">
              Hapus
            </button>
          </div>
        </div>`,
        { maxWidth: 300, autoPan: false }
      );

      mainPolyline.on("popupopen", () => {
        const focusBtn = document.getElementById(`btn-focus-${route.id}`);
        if (focusBtn) {
          focusBtn.onclick = () => {
            const bounds = mainPolyline.getBounds();
            if (bounds && bounds.isValid()) {
              mapInstanceRef.current?.fitBounds(bounds, { padding: [50, 50] });
            }
            callbacksRef.current.onSelectRoute?.(route);
          };
        }
        const delBtn = document.getElementById(`btn-del-${route.id}`);
        if (delBtn) {
          delBtn.onclick = () => {
            callbacksRef.current.onDeleteRoute?.(route.id);
          };
        }
      });

      mainPolyline.on("click", () => {
        callbacksRef.current.onSelectRoute?.(route);
      });

      routePolylineMapRef.current.set(route.id, mainPolyline);
      group.addLayer(mainPolyline);
    });

    if (routes.length > 0) {
      mapInstanceRef.current?.invalidateSize({ pan: false });
    }
  }, [L, isMapReady, routes, focusedRouteId, activeRouteId]);

  // Render Draft Multi-Point Route Line
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !draftRouteLayerGroupRef.current) return;
    const group = draftRouteLayerGroupRef.current;
    group.clearLayers();

    if (!draftPathCoordinates || draftPathCoordinates.length === 0) return;

    const isMultiSegment =
      Array.isArray(draftPathCoordinates[0]) &&
      Array.isArray((draftPathCoordinates[0] as unknown as [number, number])[0]);

    if (!isMultiSegment && draftPathCoordinates.length < 2) return;
    if (
      isMultiSegment &&
      (draftPathCoordinates as [number, number][][]).every((seg) => !seg || seg.length < 2)
    )
      return;

    const dash = isCalculatingRoute ? "6, 8" : getDashArray(customLineStyle);

    const draftCoords = draftPathCoordinates as LType.LatLngExpression[] | LType.LatLngExpression[][];

    // Glowing underlay
    const glowPolyline = L.polyline(draftCoords, {
      color: customColor,
      weight: customWeight + 6,
      opacity: isCalculatingRoute ? 0.15 : 0.35,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    });
    group.addLayer(glowPolyline);

    // Main draft line
    const draftPolyline = L.polyline(draftCoords, {
      color: customColor,
      weight: customWeight,
      opacity: isCalculatingRoute ? 0.45 : customOpacity,
      dashArray: dash,
      lineCap: "round",
      lineJoin: "round",
      interactive: true,
    });

    draftPolyline.bindTooltip(
      `<div class="px-2 py-1 text-xs font-sans">
        <span class="font-semibold text-foreground">${isCalculatingRoute ? "Menyesuaikan rute..." : "Jalur Rute Aktif"}</span>
      </div>`,
      { sticky: true }
    );

    draftPolyline.on("click", (e: LType.LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(e);
      if (callbacksRef.current.isAddPointMode && callbacksRef.current.onMapClickAddPoint) {
        callbacksRef.current.onMapClickAddPoint(e.latlng.lat, e.latlng.lng);
      }
    });

    group.addLayer(draftPolyline);
  }, [L, isMapReady, draftPathCoordinates, customColor, customWeight, customOpacity, customLineStyle, isCalculatingRoute, waypoints.length]);

  // Render Alternative Routes (Clickable to switch route)
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !alternativeRoutesLayerGroupRef.current) return;
    const group = alternativeRoutesLayerGroupRef.current;
    group.clearLayers();

    if (!alternativeRoutes || alternativeRoutes.length === 0) return;

    alternativeRoutes.forEach((alt) => {
      if (selectedAlternativeId === alt.id) return;

      const altPolyline = L.polyline(alt.leafletPoints, {
        color: "#d97706", // Amber
        weight: 5,
        opacity: 0.7,
        dashArray: "8, 8",
        lineCap: "round",
        lineJoin: "round",
        interactive: true,
      });

      altPolyline.bindTooltip(
        `<div class="px-2.5 py-1.5 text-xs font-sans space-y-0.5">
          <div class="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full inline-block bg-amber-500"></span>
            Jalur Alternatif: ${alt.name}
          </div>
          <div class="text-[11px] text-muted-foreground font-mono">
            ${alt.distanceKm} km • ${alt.durationMin} menit
          </div>
          <div class="text-[10px] text-primary font-semibold pt-0.5">
            ⚡ Klik untuk beralih ke rute ini
          </div>
        </div>`,
        { sticky: true }
      );

      altPolyline.on("mouseover", () => {
        altPolyline.setStyle({ weight: 7, opacity: 0.95 });
      });

      altPolyline.on("mouseout", () => {
        altPolyline.setStyle({ weight: 5, opacity: 0.7 });
      });

      altPolyline.on("click", (e: LType.LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        callbacksRef.current.onSelectAlternativeRoute?.(alt.id);
      });

      group.addLayer(altPolyline);
    });
  }, [L, isMapReady, alternativeRoutes, selectedAlternativeId]);

  // Render Multi-Point Waypoint Markers
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !waypointsLayerGroupRef.current) return;
    const group = waypointsLayerGroupRef.current;
    group.clearLayers();

    // Jika pengguna memilih sembunyikan titik, jangan gambar marker di peta
    if (hideWaypointsOnMap) {
      return;
    }

    waypoints.forEach((wp, index) => {
      const isStart = index === 0;
      const isEnd = index === waypoints.length - 1 && waypoints.length > 1;
      const isBranch = wp.connectionType === "nearest_branch";
      const isDisconnected = wp.connectionType === "disconnected" || wp.isDisconnected;
      const pointNumber = index + 1;

      // Color badge: Branch T (Teal), Disconnected (Amber), Start (Emerald), End (Rose), Intermediate (Sky Blue)
      let bgColor = isBranch
        ? "bg-teal-600"
        : isDisconnected
        ? "bg-amber-600"
        : isStart
        ? "bg-emerald-500"
        : isEnd
        ? "bg-rose-500"
        : "bg-sky-500";

      const RANDOM_PALETTES = [
        "bg-indigo-600",
        "bg-emerald-600",
        "bg-amber-600",
        "bg-rose-600",
        "bg-cyan-600",
        "bg-purple-600",
        "bg-orange-600",
        "bg-teal-600",
      ];

      if (markerStyle === "random") {
        bgColor = RANDOM_PALETTES[index % RANDOM_PALETTES.length];
      }

      const typeBadgeText = isBranch ? " (Terhubung)" : isDisconnected ? " (Jalan Lain)" : "";

      // Konten dalam badge: nomor, huruf, kosong (dot polos), ikon pin, atau random
      let badgeContent = "";
      if (markerStyle === "letters") {
        badgeContent = getLetterLabel(index);
      } else if (markerStyle === "none" || markerStyle === "dot") {
        badgeContent = "";
      } else if (markerStyle === "icon" || markerStyle === "pin") {
        badgeContent = `<svg class="w-3.5 h-3.5 inline-block fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      } else if (markerStyle === "random") {
        const randomSymbols = [
          `${pointNumber}`,
          getLetterLabel(index),
          `<svg class="w-3.5 h-3.5 inline-block fill-current" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
          `<svg class="w-3.5 h-3.5 inline-block fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`,
          `<svg class="w-3.5 h-3.5 inline-block fill-current" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
        ];
        badgeContent = randomSymbols[index % randomSymbols.length];
      } else {
        badgeContent = `${pointNumber}`;
      }

      const pointLabel =
        markerStyle === "letters"
        ? `Titik ${getLetterLabel(index)}`
        : `Titik ${pointNumber}`;

      let wpIcon: LType.DivIcon;

      if (markerStyle === "none") {
        // Mode None: Bersih 100%. Hanya klik di peta untuk menghubungkan jalan.
        wpIcon = L.divIcon({
          className: "custom-waypoint-marker-none",
          html: `
            <div class="relative group cursor-pointer w-4 h-4 flex items-center justify-center">
              <div class="w-2.5 h-2.5 rounded-full bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity ring-2 ring-white shadow"></div>
            </div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
      } else if (markerStyle === "dot") {
        // Mode Dot: Titik lingkaran minimalis modern tanpa panah
        wpIcon = L.divIcon({
          className: "custom-waypoint-marker-dot",
          html: `
            <div class="relative group cursor-grab active:cursor-grabbing w-5 h-5 flex items-center justify-center">
              <div class="w-4 h-4 rounded-full ${bgColor} ring-2 ring-white shadow-md flex items-center justify-center transition-transform group-hover:scale-125">
                <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
              </div>
              <span class="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/95 backdrop-blur border border-border text-[10px] font-medium px-2 py-0.5 rounded shadow text-foreground pointer-events-none max-w-36 truncate hidden group-hover:block z-50 text-center">
                ${pointLabel}: ${wp.name || "Titik"}${typeBadgeText}
              </span>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        });
      } else {
        // Semua gaya berpusat tepat di koordinat titik (anchor tengah) agar posisi konsisten antar gaya
        const sizeClass = "w-7 h-7";
        const iconSize: [number, number] = [28, 28];
        const iconAnchor: [number, number] = [14, 14];

        wpIcon = L.divIcon({
          className: "custom-waypoint-marker",
          html: `
            <div class="relative group cursor-grab active:cursor-grabbing w-7 h-7 flex items-center justify-center">
              <div class="${sizeClass} rounded-full ${bgColor} text-white font-bold text-xs leading-none flex items-center justify-center shadow-lg ring-2 ring-white transition-transform transform group-hover:scale-110">
                ${badgeContent}
              </div>
              <!-- Tooltip nama titik hanya tampil saat di-hover agar jalan tetap bersih tanpa tertutup box teks -->
              <span class="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/95 backdrop-blur border border-border text-[10px] font-medium px-2 py-0.5 rounded shadow text-foreground pointer-events-none max-w-36 truncate hidden group-hover:block z-50 text-center">
                ${pointLabel}: ${wp.name || "Titik Rute"}${typeBadgeText}
              </span>
            </div>
          `,
          iconSize,
          iconAnchor,
        });
      }

      const marker = L.marker([wp.lat, wp.lng], {
        icon: wpIcon,
        draggable: !isPositionLocked,
        title: `${pointLabel}: ${wp.name || ""}${isPositionLocked ? " (Posisi Terkunci)" : " (Bisa Digeser)"} - Klik kanan untuk opsi`,
      });

      marker.on("dragend", (e: LType.DragEndEvent) => {
        const { lat, lng } = e.target.getLatLng();
        callbacksRef.current.onWaypointDragEnd?.(index, lat, lng);
      });

      marker.on("contextmenu", (e: LType.LeafletMouseEvent) => {
        const originalEvent = e.originalEvent as MouseEvent;
        if (originalEvent) {
          originalEvent.stopPropagation();
          originalEvent.preventDefault();
          setWaypointContextMenu({
            x: originalEvent.clientX,
            y: originalEvent.clientY,
            index,
            wp,
          });
        }
      });

      marker.bindPopup(`
        <div class="p-1 text-xs space-y-1">
          <div class="font-bold flex items-center gap-1.5">
            <span>${pointLabel} ${isStart ? "(Awal)" : isEnd ? "(Tujuan Akhir)" : ""}</span>
            ${isBranch ? '<span class="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-400 text-[10px] font-semibold">Cabang T</span>' : ""}
            ${isDisconnected ? '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">Jalan Terpisah</span>' : ""}
          </div>
          <div class="font-medium">${wp.name || "Titik Jalan"}</div>
          <div class="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            💡 Klik kanan pin untuk opsi Cabang T / Buat Jalan Lain / Hapus
          </div>
        </div>
      `, { autoPan: false });

      group.addLayer(marker);
    });
  }, [L, isMapReady, waypoints, hideWaypointsOnMap, markerStyle, isPositionLocked]);

  const handledTimestampsRef = React.useRef<{
    route?: number;
    folder?: number;
    point?: number;
    draft?: number;
  }>({});

  // Zoom ke rute tertentu HANYA jika dipicu secara eksplisit oleh klik ikon mata pengguna
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !zoomTargetRouteId) return;
    if (handledTimestampsRef.current.route === zoomTargetRouteId.timestamp) return;
    handledTimestampsRef.current.route = zoomTargetRouteId.timestamp;
    onClearZoomTarget?.("route");

    const map = mapInstanceRef.current;
    const currentRoutes = routesRef.current;
    const targetRoute = currentRoutes.find((r) => r.id === zoomTargetRouteId.id);
    if (!targetRoute) return;

    // Cek koordinat geojson rute
    const geojsonObj = parseRouteGeoJSON(targetRoute.geojson);
    const coords = geojsonObj?.coordinates;
    if (Array.isArray(coords) && coords.length > 0) {
      const firstElem = coords[0];
      const isMulti =
        geojsonObj?.type === "MultiLineString" ||
        (Array.isArray(firstElem) && Array.isArray((firstElem as unknown as [number, number])[0]));

      const flatCoords = isMulti
        ? (coords as [number, number][][]).flat()
        : (coords as [number, number][]);

      const validPoints = flatCoords
        .filter(
          (c) =>
            Array.isArray(c) &&
            c.length >= 2 &&
            !isNaN(c[0]) &&
            !isNaN(c[1]) &&
            !(c[0] === 0 && c[1] === 0)
        )
        .map((c) => [c[1], c[0]] as [number, number]);

      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          const poly = routePolylineMapRef.current.get(zoomTargetRouteId.id);
          if (poly) {
            setTimeout(() => {
              poly.openPopup();
            }, 250);
          }
          return;
        }
      }
    }

    // Cek waypoints rute jika geojson belum ada / kosong
    if (Array.isArray(targetRoute.waypoints) && targetRoute.waypoints.length > 0) {
      const validWaypoints = targetRoute.waypoints
        .filter((w) => w && !isNaN(w.lat) && !isNaN(w.lng) && !(w.lat === 0 && w.lng === 0))
        .map((w) => [w.lat, w.lng] as [number, number]);

      if (validWaypoints.length > 0) {
        const bounds = L.latLngBounds(validWaypoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
          const poly = routePolylineMapRef.current.get(zoomTargetRouteId.id);
          if (poly) {
            setTimeout(() => {
              poly.openPopup();
            }, 250);
          }
          return;
        }
      }
    }

    // Jika hanya titik tunggal (misal origin yang valid)
    if (
      targetRoute.origin_lat &&
      targetRoute.origin_lng &&
      !(targetRoute.origin_lat === 0 && targetRoute.origin_lng === 0)
    ) {
      map.setView([targetRoute.origin_lat, targetRoute.origin_lng], 15);
    }
  }, [L, zoomTargetRouteId, onClearZoomTarget]);

  // Zoom ke seluruh rute folder HANYA jika dipicu secara eksplisit oleh klik "Lihat" di folder
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !zoomTargetFolder) return;
    if (handledTimestampsRef.current.folder === zoomTargetFolder.timestamp) return;
    handledTimestampsRef.current.folder = zoomTargetFolder.timestamp;
    onClearZoomTarget?.("folder");

    const map = mapInstanceRef.current;
    const currentRoutes = routesRef.current;
    const folderRoutes = currentRoutes.filter(
      (r) => (r.folder_name || "Tanpa Folder").toLowerCase() === zoomTargetFolder.name.toLowerCase()
    );

    if (folderRoutes.length === 0) return;

    const allPoints: [number, number][] = [];
    folderRoutes.forEach((route) => {
      const geojsonObj = parseRouteGeoJSON(route.geojson);
      const coords = geojsonObj?.coordinates;
      if (Array.isArray(coords) && coords.length > 0) {
        const isMulti =
          geojsonObj?.type === "MultiLineString" ||
          (Array.isArray(coords[0]) && Array.isArray((coords as unknown[][])[0][0]));

        const flatCoords = isMulti
          ? (coords as [number, number][][]).flat()
          : (coords as [number, number][]);

        flatCoords.forEach((c) => {
          if (
            Array.isArray(c) &&
            c.length >= 2 &&
            !isNaN(c[0]) &&
            !isNaN(c[1]) &&
            !(c[0] === 0 && c[1] === 0)
          ) {
            allPoints.push([c[1], c[0]]);
          }
        });
      } else if (Array.isArray(route.waypoints) && route.waypoints.length > 0) {
        route.waypoints.forEach((w) => {
          if (w && !isNaN(w.lat) && !isNaN(w.lng) && !(w.lat === 0 && w.lng === 0)) {
            allPoints.push([w.lat, w.lng]);
          }
        });
      }
    });

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }
  }, [L, zoomTargetFolder, onClearZoomTarget]);

  // Zoom / Pusatkan peta ke titik tertentu HANYA saat dipicu oleh klik ikon mata pada titik
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !zoomTargetPoint) return;
    if (handledTimestampsRef.current.point === zoomTargetPoint.timestamp) return;
    handledTimestampsRef.current.point = zoomTargetPoint.timestamp;
    onClearZoomTarget?.("point");

    const map = mapInstanceRef.current;
    if (
      !isNaN(zoomTargetPoint.lat) &&
      !isNaN(zoomTargetPoint.lng) &&
      !(zoomTargetPoint.lat === 0 && zoomTargetPoint.lng === 0)
    ) {
      map.flyTo([zoomTargetPoint.lat, zoomTargetPoint.lng], 16, { duration: 0.5 });
    }
  }, [L, zoomTargetPoint, onClearZoomTarget]);

  // Zoom ke seluruh rute aktif / draft HANYA saat dipicu oleh tombol Lihat Rute
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !zoomTargetDraftRoute) return;
    if (handledTimestampsRef.current.draft === zoomTargetDraftRoute.timestamp) return;
    handledTimestampsRef.current.draft = zoomTargetDraftRoute.timestamp;
    onClearZoomTarget?.("draft");

    const map = mapInstanceRef.current;
    const currentCoords = callbacksRef.current.draftPathCoordinates;
    const currentWps = callbacksRef.current.waypoints;

    const allPoints: [number, number][] = [];
    if (Array.isArray(currentCoords) && currentCoords.length > 0) {
      const firstElem = currentCoords[0];
      const isMulti =
        Array.isArray(firstElem) && Array.isArray((firstElem as unknown as [number, number])[0]);
      const flat = isMulti
        ? (currentCoords as [number, number][][]).flat()
        : (currentCoords as [number, number][]);
      flat.forEach((p) => {
        if (Array.isArray(p) && p.length >= 2 && !isNaN(p[0]) && !isNaN(p[1])) {
          allPoints.push([p[0], p[1]]);
        }
      });
    }

    if (allPoints.length === 0 && Array.isArray(currentWps)) {
      currentWps.forEach((wp) => {
        if (wp && !isNaN(wp.lat) && !isNaN(wp.lng) && !(wp.lat === 0 && wp.lng === 0)) {
          allPoints.push([wp.lat, wp.lng]);
        }
      });
    }

    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }
  }, [L, zoomTargetDraftRoute, onClearZoomTarget]);

  return (
    <div className={`relative bg-background overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-120 bg-muted/20 z-0" />

      {/* Floating Status Kalkulasi Rute Aktif */}
      {isCalculatingRoute && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card/95 backdrop-blur-md border border-primary/30 shadow-lg text-xs font-medium text-primary animate-in fade-in zoom-in-95 pointer-events-none select-none">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Menyesuaikan rute dengan jalan...</span>
        </div>
      )}

      {/* Floating Banner Mode Sisipkan Titik */}
      {insertModeInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-background/95 backdrop-blur-md border border-primary/50 shadow-xl px-4 py-2 rounded-full flex items-center gap-3 text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping shrink-0" />
          <span className="text-foreground">
            Klik peta untuk menyisipkan titik lewat antara <strong>Titik {insertModeInfo.fromIndex + 1}</strong> &amp; <strong>Titik {insertModeInfo.toIndex + 1}</strong>
          </span>
          {onCancelInsertMode && (
            <button
              type="button"
              onClick={onCancelInsertMode}
              className="ml-1 text-[11px] px-2.5 py-0.5 rounded-full bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Batal
            </button>
          )}
        </div>
      )}

      {/* Context Menu Titik (Klik Kanan pada Pin Marker) */}
      {waypointContextMenu && (
        <>
          <div
            className="fixed inset-0 z-9998"
            onClick={() => setWaypointContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setWaypointContextMenu(null);
            }}
          />
          <div
            style={{
              position: "fixed",
              left: `${Math.min(waypointContextMenu.x + 4, typeof window !== "undefined" ? window.innerWidth - 260 : 500)}px`,
              top: `${Math.min(waypointContextMenu.y + 4, typeof window !== "undefined" ? window.innerHeight - 200 : 500)}px`,
            }}
            className="z-9999 min-w-56 rounded-xl border border-border bg-popover/95 p-1.5 text-popover-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 select-none"
          >
            {/* Opsi 0: Pusatkan / Zoom di Peta */}
            <button
              type="button"
              onClick={() => {
                const wp = waypointContextMenu.wp;
                closeWaypointContextMenu();
                mapInstanceRef.current?.flyTo([wp.lat, wp.lng], 16, { duration: 0.5 });
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-secondary/80 rounded-lg cursor-pointer transition-colors font-medium text-left mb-1"
            >
              <Eye className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Lihat di Peta</span>
            </button>

            {/* Opsi Edit Nama Titik */}
            {mapEditingWp?.index === waypointContextMenu.index ? (
              <div className="p-1 space-y-1.5 border-b border-border/60 pb-2 mb-1" onClick={(e) => e.stopPropagation()}>
                <div className="text-[10px] font-semibold text-muted-foreground">Ubah Nama Titik:</div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={mapEditingWp.name}
                    onChange={(e) => setMapEditingWp({ ...mapEditingWp, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = mapEditingWp.name.trim();
                        if (trimmed) callbacksRef.current.onUpdateWaypointName?.(mapEditingWp.index, trimmed);
                        closeWaypointContextMenu();
                      } else if (e.key === "Escape") {
                        setMapEditingWp(null);
                      }
                    }}
                    autoFocus
                    className="w-full px-2 py-1 text-xs rounded border border-primary bg-background text-foreground outline-none font-medium"
                    placeholder="Nama titik..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = mapEditingWp.name.trim();
                      if (trimmed) callbacksRef.current.onUpdateWaypointName?.(mapEditingWp.index, trimmed);
                      closeWaypointContextMenu();
                    }}
                    className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 cursor-pointer shadow-xs"
                    title="Simpan"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapEditingWp(null)}
                    className="p-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                    title="Batal"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMapEditingWp({
                    index: waypointContextMenu.index,
                    name: waypointContextMenu.wp.name || "",
                  });
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-foreground hover:bg-secondary/80 rounded-lg cursor-pointer transition-colors font-medium text-left mb-1"
              >
                <Edit3 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Edit Nama Titik</span>
              </button>
            )}

            {/* Opsi Geser Urutan Naik / Turun */}
            {onMoveWaypoint && (
              <div className="flex items-center gap-1 border-b border-border/60 pb-1 mb-1">
                <button
                  type="button"
                  disabled={waypointContextMenu.index === 0}
                  onClick={() => {
                    const idx = waypointContextMenu.index;
                    closeWaypointContextMenu();
                    callbacksRef.current.onMoveWaypoint?.(idx, "up");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-xs text-foreground hover:bg-secondary/80 disabled:opacity-30 rounded-lg cursor-pointer transition-colors font-medium disabled:cursor-not-allowed"
                  title="Geser Urutan Naik"
                >
                  <MoveUp className="w-3 h-3" />
                  <span>Naik</span>
                </button>
                <button
                  type="button"
                  disabled={waypointContextMenu.index === waypoints.length - 1}
                  onClick={() => {
                    const idx = waypointContextMenu.index;
                    closeWaypointContextMenu();
                    callbacksRef.current.onMoveWaypoint?.(idx, "down");
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1 text-xs text-foreground hover:bg-secondary/80 disabled:opacity-30 rounded-lg cursor-pointer transition-colors font-medium disabled:cursor-not-allowed"
                  title="Geser Urutan Turun"
                >
                  <MoveDown className="w-3 h-3" />
                  <span>Turun</span>
                </button>
              </div>
            )}

            {/* Opsi cabang / pisah rute jika titik lebih dari 1 */}
            {waypoints.length > 1 && (
              <div className="space-y-0.5 mb-1 border-b border-border/60 pb-1">
                {/* Opsi 1: Hubungkan ke Jalur Terdekat (Ikuti Jalan) */}
                <button
                  type="button"
                  onClick={() => {
                    const idx = waypointContextMenu.index;
                    closeWaypointContextMenu();
                    callbacksRef.current.onConnectWaypointToNearest?.(idx, "road");
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-colors text-left ${
                    waypointContextMenu.wp.connectionType === "nearest_branch"
                      ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold"
                      : "text-foreground hover:bg-secondary/80 font-medium"
                  }`}
                  title="Hubungkan ke jalan terdekat mengikuti lekukan jalan resmi"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Hubungkan ke Jalur (Ikuti Jalan)</span>
                  </div>
                  {waypointContextMenu.wp.connectionType === "nearest_branch" && (
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  )}
                </button>

                {/* Opsi 2: Hubungkan Langsung ke Jalur Terdekat (Snap Cepat) */}
                <button
                  type="button"
                  onClick={() => {
                    const idx = waypointContextMenu.index;
                    closeWaypointContextMenu();
                    callbacksRef.current.onConnectWaypointToNearest?.(idx, "direct");
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-colors text-left ${
                    waypointContextMenu.wp.connectionType === "direct_snap"
                      ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold"
                      : "text-foreground hover:bg-secondary/80 font-medium"
                  }`}
                  title="Hubungkan langsung ke garis jalan terdekat tanpa memutar satu arah atau pembatas jalan"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Hubungkan Langsung (Snap Cepat)</span>
                  </div>
                  {waypointContextMenu.wp.connectionType === "direct_snap" && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </button>

                {/* Opsi 2: Pisahkan Rute (Jalan Baru) / Sambungkan Kembali */}
                {(() => {
                  const targetIdx = waypointContextMenu.index === 0 ? 1 : waypointContextMenu.index;
                  const targetWp = waypoints[targetIdx] || waypointContextMenu.wp;
                  const isTargetDisc = targetWp.connectionType === "disconnected" || targetWp.isDisconnected;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        closeWaypointContextMenu();
                        callbacksRef.current.onToggleDisconnectWaypoint?.(targetIdx);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-colors text-left ${
                        isTargetDisc
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                          : "text-foreground hover:bg-secondary/80 font-medium"
                      }`}
                      title="Pisahkan rute jalan atau sambungkan kembali"
                    >
                      <div className="flex items-center gap-2">
                        {isTargetDisc ? (
                          <>
                            <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span>Sambungkan Rute</span>
                          </>
                        ) : (
                          <>
                            <Unlink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>Pisahkan Rute (Jalan Baru)</span>
                          </>
                        )}
                      </div>
                      {isTargetDisc && (
                        <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                    </button>
                  );
                })()}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const idx = waypointContextMenu.index;
                closeWaypointContextMenu();
                callbacksRef.current.onRemoveWaypoint?.(idx);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg cursor-pointer transition-colors font-medium text-left"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Hapus Titik Ini</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
