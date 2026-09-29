"use client";

import * as React from "react";
import type * as LType from "leaflet";
import { BASEMAP_OPTIONS } from "./basemap-config";
import { 
  WaypointItem,
  AlternativeRouteOption,
} from "@/lib/road-routing";
import { Trash2, Loader2, GitFork, Link2, Unlink, Check } from "lucide-react";

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
  travel_mode?: string;
  category?: string;
  description?: string;
  geojson?: {
    type: string;
    coordinates: [number, number][] | [number, number][][]; // [lng, lat] LineString atau MultiLineString
  };
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

  // Mode & Handlers
  isAddPointMode: boolean;
  onMapClickAddPoint?: (lat: number, lng: number) => void;
  onWaypointDragEnd?: (index: number, lat: number, lng: number) => void;
  onRouteLineClick?: (lat: number, lng: number) => void;
  onSelectRoute?: (route: TraversedRoadRecord) => void;
  onDeleteRoute?: (id: number) => void;
  onRemoveWaypoint?: (index: number) => void;
  onToggleDisconnectWaypoint?: (index: number) => void;
  onConnectWaypointToNearest?: (index: number) => void;
  hideWaypointsOnMap?: boolean;
  focusedRouteId?: number | null;
  focusedFolder?: string | null;
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
  isAddPointMode = true,
  onMapClickAddPoint,
  onWaypointDragEnd,
  onRemoveWaypoint,
  onToggleDisconnectWaypoint,
  onConnectWaypointToNearest,
  hideWaypointsOnMap = false,
  onRouteLineClick,
  onSelectRoute,
  onDeleteRoute,
  focusedRouteId,
  focusedFolder,
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

  const [L, setL] = React.useState<typeof LType | null>(null);

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
    onMapClickAddPoint,
    onWaypointDragEnd,
    onRemoveWaypoint,
    onToggleDisconnectWaypoint,
    onConnectWaypointToNearest,
    onRouteLineClick,
    onSelectAlternativeRoute,
    onSelectRoute,
    onDeleteRoute,
  });

  React.useEffect(() => {
    callbacksRef.current = {
      isAddPointMode,
      waypoints,
      onMapClickAddPoint,
      onWaypointDragEnd,
      onRemoveWaypoint,
      onToggleDisconnectWaypoint,
      onConnectWaypointToNearest,
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

  React.useEffect(() => {
    if (!waypointContextMenu) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setWaypointContextMenu(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [waypointContextMenu]);

  // Initialize Map
  React.useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-6.9754, 108.4831],
      zoom: 14,
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      preferCanvas: true,
    });

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

    const initialLayer = createTileLayer(L, activeBasemapId);
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

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    mapInstanceRef.current = map;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L, createTileLayer, activeBasemapId]);

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

      if (route.geojson && Array.isArray(route.geojson.coordinates) && route.geojson.coordinates.length > 0) {
        const firstElem = route.geojson.coordinates[0];
        const isMulti =
          route.geojson.type === "MultiLineString" ||
          (Array.isArray(firstElem) && Array.isArray((firstElem as unknown as [number, number])[0]));

        if (isMulti) {
          latlngs = (route.geojson.coordinates as [number, number][][]).map((seg) =>
            seg.map((c) => [c[1], c[0]] as [number, number])
          );
        } else {
          latlngs = (route.geojson.coordinates as [number, number][]).map((c) => [c[1], c[0]] as [number, number]);
        }
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
        { maxWidth: 300 }
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
  }, [L, routes, focusedRouteId, activeRouteId]);

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
  }, [L, draftPathCoordinates, customColor, customWeight, customOpacity, customLineStyle, isCalculatingRoute, waypoints.length]);

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
  }, [L, alternativeRoutes, selectedAlternativeId]);

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
      const bgColor = isBranch
        ? "bg-teal-600"
        : isDisconnected
        ? "bg-amber-600"
        : isStart
        ? "bg-emerald-500"
        : isEnd
        ? "bg-rose-500"
        : "bg-sky-500";

      const ringColor = isBranch
        ? "ring-teal-500/30"
        : isDisconnected
        ? "ring-amber-500/30"
        : isStart
        ? "ring-emerald-500/30"
        : isEnd
        ? "ring-rose-500/30"
        : "ring-sky-500/30";

      const arrowBg = isBranch
        ? "bg-teal-700"
        : isDisconnected
        ? "bg-amber-700"
        : isStart
        ? "bg-emerald-600"
        : isEnd
        ? "bg-rose-600"
        : "bg-sky-600";

      const typeBadgeText = isBranch ? " (Cabang T)" : isDisconnected ? " (Jalan Lain)" : "";

      const wpIcon = L.divIcon({
        className: "custom-waypoint-marker",
        html: `
          <div class="relative group cursor-grab active:cursor-grabbing">
            <div class="w-8 h-8 rounded-full ${bgColor} text-white font-bold text-xs flex items-center justify-center shadow-lg ring-4 ${ringColor} transition-transform transform group-hover:scale-110">
              ${isBranch ? "T" : pointNumber}
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${arrowBg} rotate-45"></div>
            <span class="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/95 backdrop-blur border border-border text-[10px] font-medium px-2 py-0.5 rounded shadow text-foreground pointer-events-none max-w-32.5 truncate block text-center">
              Titik ${pointNumber}: ${wp.name || "Titik Rute"}${typeBadgeText}
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([wp.lat, wp.lng], {
        icon: wpIcon,
        draggable: true,
        title: `Titik ${pointNumber}: ${wp.name || ""} (Klik kanan untuk opsi cabang/pisah)`,
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
            <span>Titik ${pointNumber} ${isStart ? "(Awal)" : isEnd ? "(Tujuan Akhir)" : ""}</span>
            ${isBranch ? '<span class="px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-700 dark:text-teal-400 text-[10px] font-semibold">Cabang T</span>' : ""}
            ${isDisconnected ? '<span class="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-semibold">Jalan Terpisah</span>' : ""}
          </div>
          <div class="font-medium">${wp.name || "Titik Jalan"}</div>
          <div class="text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            💡 Klik kanan pin untuk opsi Cabang T / Buat Jalan Lain / Hapus
          </div>
        </div>
      `);

      group.addLayer(marker);
    });
  }, [L, waypoints, hideWaypointsOnMap]);

  // Fit bounds when focusedRouteId changes
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (focusedRouteId) {
      const targetRoute = routes.find((r) => r.id === focusedRouteId);
      if (targetRoute) {
        // Cek koordinat geojson rute
        const coords = targetRoute.geojson?.coordinates;
        if (Array.isArray(coords) && coords.length > 0) {
          const firstElem = coords[0];
          const isMulti =
            targetRoute.geojson?.type === "MultiLineString" ||
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
              const poly = routePolylineMapRef.current.get(focusedRouteId);
              if (poly) {
                setTimeout(() => {
                  poly.openPopup();
                }, 200);
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
              const poly = routePolylineMapRef.current.get(focusedRouteId);
              if (poly) {
                setTimeout(() => {
                  poly.openPopup();
                }, 200);
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
      }
    }
  }, [L, focusedRouteId, routes]);

  // Fit bounds when focusedFolder changes
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !focusedFolder) return;
    const map = mapInstanceRef.current;

    const folderRoutes = routes.filter(
      (r) => (r.folder_name || "Tanpa Folder").toLowerCase() === focusedFolder.toLowerCase()
    );

    if (folderRoutes.length === 0) return;

    const allPoints: [number, number][] = [];
    folderRoutes.forEach((route) => {
      const coords = route.geojson?.coordinates;
      if (Array.isArray(coords) && coords.length > 0) {
        const isMulti =
          route.geojson?.type === "MultiLineString" ||
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
  }, [L, focusedFolder, routes]);

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
            <div className="px-2.5 py-1.5 mb-1 text-[11px] font-semibold text-muted-foreground border-b border-border/60 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                  {waypointContextMenu.index + 1}
                </span>
                <span className="truncate text-foreground font-medium">
                  {waypointContextMenu.wp.name || `Titik ${waypointContextMenu.index + 1}`}
                </span>
              </div>
            </div>

            {/* Opsi khusus titik ke-2 dst (bukan titik awal) */}
            {waypointContextMenu.index > 0 && (
              <div className="space-y-0.5 mb-1 border-b border-border/60 pb-1">
                {/* Opsi 1: Hubungkan ke Rute Terdekat (Huruf T) */}
                <button
                  type="button"
                  onClick={() => {
                    const idx = waypointContextMenu.index;
                    setWaypointContextMenu(null);
                    callbacksRef.current.onConnectWaypointToNearest?.(idx);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-colors text-left ${
                    waypointContextMenu.wp.connectionType === "nearest_branch"
                      ? "bg-teal-500/15 text-teal-700 dark:text-teal-300 font-semibold"
                      : "text-foreground hover:bg-secondary/80 font-medium"
                  }`}
                  title="Hubungkan titik ini langsung ke jalan terdekat pada rute utama (membentuk huruf T)"
                >
                  <div className="flex items-center gap-2">
                    <GitFork className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span>Hubungkan Rute Terdekat (Huruf T)</span>
                  </div>
                  {waypointContextMenu.wp.connectionType === "nearest_branch" && (
                    <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                  )}
                </button>

                {/* Opsi 2: Buat Jalan Lain (Pisah Rute) / Sambungkan Kembali */}
                <button
                  type="button"
                  onClick={() => {
                    const idx = waypointContextMenu.index;
                    setWaypointContextMenu(null);
                    callbacksRef.current.onToggleDisconnectWaypoint?.(idx);
                  }}
                  className={`w-full flex items-center justify-between px-2 py-1.5 text-xs rounded-lg cursor-pointer transition-colors text-left ${
                    waypointContextMenu.wp.connectionType === "disconnected" || waypointContextMenu.wp.isDisconnected
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold"
                      : "text-foreground hover:bg-secondary/80 font-medium"
                  }`}
                  title="Putus hubungan dengan titik sebelumnya tanpa membuat jalur memutar"
                >
                  <div className="flex items-center gap-2">
                    {waypointContextMenu.wp.connectionType === "disconnected" || waypointContextMenu.wp.isDisconnected ? (
                      <>
                        <Link2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Sambungkan ke Titik Sebelumnya</span>
                      </>
                    ) : (
                      <>
                        <Unlink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>Buat Jalan Lain (Pisah Rute)</span>
                      </>
                    )}
                  </div>
                  {(waypointContextMenu.wp.connectionType === "disconnected" || waypointContextMenu.wp.isDisconnected) && (
                    <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  )}
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                const idx = waypointContextMenu.index;
                setWaypointContextMenu(null);
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
