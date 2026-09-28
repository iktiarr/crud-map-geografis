"use client";

import * as React from "react";
import type * as LType from "leaflet";
import { BASEMAP_OPTIONS } from "./basemap-config";
import { 
  WaypointItem 
} from "@/lib/road-routing";

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
    coordinates: [number, number][]; // [lng, lat]
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
  draftPathCoordinates: [number, number][]; // [lat, lng] for Leaflet

  // Customization for current/draft route
  customColor: string;
  customWeight: number;
  customOpacity: number;
  customLineStyle: "solid" | "dashed" | "dotted" | string;

  // Mode & Handlers
  isAddPointMode: boolean;
  onMapClickAddPoint?: (lat: number, lng: number) => void;
  onWaypointDragEnd?: (index: number, lat: number, lng: number) => void;
  onSelectRoute?: (route: TraversedRoadRecord) => void;
  onDeleteRoute?: (id: number) => void;
  focusedRouteId?: number | null;

  // Basemap
  activeBasemapId?: string;
  className?: string;
}

export function LeafletTraversedRoadsMap({
  routes,
  waypoints,
  draftPathCoordinates,
  customColor = "#2563eb",
  customWeight = 6,
  customOpacity = 0.9,
  customLineStyle = "solid",
  isAddPointMode = true,
  onMapClickAddPoint,
  onWaypointDragEnd,
  onSelectRoute,
  onDeleteRoute,
  focusedRouteId,
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
  const waypointsLayerGroupRef = React.useRef<LType.FeatureGroup | null>(null);

  const [L, setL] = React.useState<typeof LType | null>(null);
  const [mapCenterCoords, setMapCenterCoords] = React.useState<{ lat: number; lng: number } | null>(null);

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
    onSelectRoute,
    onDeleteRoute,
  });

  React.useEffect(() => {
    callbacksRef.current = {
      isAddPointMode,
      waypoints,
      onMapClickAddPoint,
      onWaypointDragEnd,
      onSelectRoute,
      onDeleteRoute,
    };
  });

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
    const draftRouteGroup = L.featureGroup().addTo(map);
    const waypointsGroup = L.featureGroup().addTo(map);

    savedRoutesLayerGroupRef.current = savedRoutesGroup;
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

    map.on("mousemove", (e: LType.LeafletMouseEvent) => {
      setMapCenterCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
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

    routes.forEach((route) => {
      if (route.isVisible === false) return;

      let latlngs: [number, number][] = [];

      if (route.geojson && Array.isArray(route.geojson.coordinates)) {
        latlngs = route.geojson.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      } else if (route.origin_lat && route.destination_lat) {
        latlngs = [
          [route.origin_lat, route.origin_lng],
          [route.destination_lat, route.destination_lng],
        ];
      }

      if (latlngs.length < 2) return;

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
            mapInstanceRef.current?.fitBounds(mainPolyline.getBounds(), { padding: [50, 50] });
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

      group.addLayer(mainPolyline);
    });
  }, [L, routes, focusedRouteId]);

  // Render Draft Multi-Point Route Line
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !draftRouteLayerGroupRef.current) return;
    const group = draftRouteLayerGroupRef.current;
    group.clearLayers();

    if (draftPathCoordinates.length < 2) return;

    const dash = getDashArray(customLineStyle);

    // Glowing underlay
    const glowPolyline = L.polyline(draftPathCoordinates, {
      color: customColor,
      weight: customWeight + 6,
      opacity: 0.35,
      lineCap: "round",
      lineJoin: "round",
      interactive: false,
    });
    group.addLayer(glowPolyline);

    // Main draft line
    const draftPolyline = L.polyline(draftPathCoordinates, {
      color: customColor,
      weight: customWeight,
      opacity: customOpacity,
      dashArray: dash,
      lineCap: "round",
      lineJoin: "round",
      interactive: true,
    });

    draftPolyline.bindTooltip(
      `<div class="px-2 py-1 text-xs font-sans">
        <span class="font-semibold text-foreground">Jalur Jalan Terpilih (${waypoints.length} Titik)</span>
      </div>`,
      { sticky: true }
    );

    group.addLayer(draftPolyline);
  }, [L, draftPathCoordinates, customColor, customWeight, customOpacity, customLineStyle, waypoints.length]);

  // Render Multi-Point Waypoint Markers
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !waypointsLayerGroupRef.current) return;
    const group = waypointsLayerGroupRef.current;
    group.clearLayers();

    waypoints.forEach((wp, index) => {
      const isStart = index === 0;
      const isEnd = index === waypoints.length - 1 && waypoints.length > 1;
      const pointNumber = index + 1;

      // Color badge based on position: Start (Emerald), Intermediate (Sky Blue), End (Rose)
      const bgColor = isStart ? "bg-emerald-500" : isEnd ? "bg-rose-500" : "bg-sky-500";
      const ringColor = isStart ? "ring-emerald-500/30" : isEnd ? "ring-rose-500/30" : "ring-sky-500/30";
      const arrowBg = isStart ? "bg-emerald-600" : isEnd ? "bg-rose-600" : "bg-sky-600";

      const wpIcon = L.divIcon({
        className: "custom-waypoint-marker",
        html: `
          <div class="relative group cursor-grab active:cursor-grabbing">
            <div class="w-8 h-8 rounded-full ${bgColor} text-white font-bold text-xs flex items-center justify-center shadow-lg ring-4 ${ringColor} transition-transform transform group-hover:scale-110">
              ${pointNumber}
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 ${arrowBg} rotate-45"></div>
            <span class="absolute top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 backdrop-blur border border-border text-[10px] font-medium px-2 py-0.5 rounded shadow text-foreground pointer-events-none">
              Titik ${pointNumber}: ${wp.name || "Titik Rute"}
            </span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([wp.lat, wp.lng], {
        icon: wpIcon,
        draggable: true,
        title: `Titik ${pointNumber}: ${wp.name || ""}`,
      });

      marker.on("dragend", (e: LType.DragEndEvent) => {
        const { lat, lng } = e.target.getLatLng();
        callbacksRef.current.onWaypointDragEnd?.(index, lat, lng);
      });

      marker.bindPopup(`
        <div class="p-1 text-xs">
          <strong>Titik ${pointNumber} ${isStart ? "(Awal)" : isEnd ? "(Tujuan Akhir)" : "(Pemberhentian)"}</strong><br />
          ${wp.name || "Titik Jalan"}<br />
          <span class="font-mono text-[10px] text-muted-foreground">${wp.lat.toFixed(5)}, ${wp.lng.toFixed(5)}</span>
        </div>
      `);

      group.addLayer(marker);
    });
  }, [L, waypoints]);

  // Fit bounds when focusedRouteId changes
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (focusedRouteId) {
      const targetRoute = routes.find((r) => r.id === focusedRouteId);
      if (targetRoute && targetRoute.geojson?.coordinates) {
        const bounds = L.latLngBounds(
          targetRoute.geojson.coordinates.map((c) => [c[1], c[0]])
        );
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      }
    }
  }, [L, focusedRouteId, routes]);

  return (
    <div className={`relative bg-background overflow-hidden ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-120 bg-muted/20 z-0" />

      {/* Floating Status / Coordinates Indicator */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="bg-background/85 backdrop-blur-md border border-border px-3 py-1 rounded-lg text-[11px] font-mono text-muted-foreground shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Jaringan Jalan Aktif</span>
          {mapCenterCoords && (
            <span className="hidden sm:inline text-foreground font-medium">
              | {mapCenterCoords.lat}, {mapCenterCoords.lng}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
