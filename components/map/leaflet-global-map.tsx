"use client";

import * as React from "react";
import type * as LType from "leaflet";
import { BASEMAP_OPTIONS } from "./basemap-config";

export interface TargetLocation {
  lat: number;
  lng: number;
  zoom?: number;
  title?: string;
  subtitle?: string;
}

export interface LeafletGlobalMapProps {
  activeBasemapId: string;
  targetLocation?: TargetLocation | null;
  userLocation?: { lat: number; lng: number } | null;
  onMapCenterChange?: (coords: { lat: number; lng: number; zoom: number }) => void;
  onCursorMove?: (coords: { lat: number; lng: number } | null) => void;
  className?: string;
}

export function LeafletGlobalMap({
  activeBasemapId,
  targetLocation,
  userLocation,
  onMapCenterChange,
  onCursorMove,
  className = "w-full h-full",
}: LeafletGlobalMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<LType.Map | null>(null);
  const currentLayerRef = React.useRef<LType.TileLayer | null>(null);
  const layerCacheRef = React.useRef<Map<string, LType.TileLayer>>(new Map());
  const searchMarkerRef = React.useRef<LType.Marker | null>(null);
  const userLocationMarkerRef = React.useRef<LType.LayerGroup | null>(null);
  const [L, setL] = React.useState<typeof LType | null>(null);

  React.useEffect(() => {
    import("leaflet").then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

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
        keepBuffer: 16,
        updateWhenIdle: false,
        updateWhenZooming: false,
        crossOrigin: "anonymous",
        tileSize: 256,
        zoomOffset: 0,
      });

      layerCacheRef.current.set(basemapId, layer);
      return layer;
    },
    []
  );

  // Capture Initial Basemap ID once for map creation
  const initialBasemapRef = React.useRef(activeBasemapId);

  React.useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 11,
      maxZoom: 21,
      zoomControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      markerZoomAnimation: true,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 2000,
      easeLinearity: 0.2,
      zoomSnap: 1,
      zoomDelta: 1,
      wheelPxPerZoomLevel: 120,
      trackResize: true,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

    const initialLayer = createTileLayer(L, initialBasemapRef.current);
    initialLayer.addTo(map);
    currentLayerRef.current = initialLayer;
    mapInstanceRef.current = map;

    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapCenterChange?.({
        lat: Number(center.lat.toFixed(5)),
        lng: Number(center.lng.toFixed(5)),
        zoom,
      });
    };

    const handleMouseMove = (e: LType.LeafletMouseEvent) => {
      onCursorMove?.({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    };

    const handleMouseOut = () => {
      onCursorMove?.(null);
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleMoveEnd);
    map.on("mousemove", handleMouseMove);
    map.on("mouseout", handleMouseOut);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    handleMoveEnd();

    const layerCache = layerCacheRef.current;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layerCache.clear();
    };
  }, [L, createTileLayer, onMapCenterChange, onCursorMove]);

  // Update Basemap Layer Smoothly (Preserves current center, zoom, and location!)
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const oldLayer = currentLayerRef.current;
    const newLayer = createTileLayer(L, activeBasemapId);

    if (oldLayer === newLayer) return;

    newLayer.addTo(map);
    currentLayerRef.current = newLayer;

    if (oldLayer) {
      const removeTimer = setTimeout(() => {
        if (map.hasLayer(oldLayer)) {
          map.removeLayer(oldLayer);
        }
      }, 150);

      newLayer.once("load", () => {
        clearTimeout(removeTimer);
        if (map.hasLayer(oldLayer)) {
          map.removeLayer(oldLayer);
        }
      });
    }
  }, [L, activeBasemapId, createTileLayer]);

  // Handle Target Location (Search / FlyTo)
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    if (targetLocation) {
      const { lat, lng, zoom = 15 } = targetLocation;
      map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1.5,
      });

      const icon = L.divIcon({
        className: "custom-search-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="width: 28px; height: 28px; background-color: #ef4444; border: 3px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
              <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      searchMarkerRef.current = marker;
    }
  }, [L, targetLocation]);

  // Handle User GPS Location
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userLocationMarkerRef.current) {
      map.removeLayer(userLocationMarkerRef.current);
      userLocationMarkerRef.current = null;
    }

    if (userLocation) {
      const { lat, lng } = userLocation;
      const group = L.layerGroup();

      const pulseIcon = L.divIcon({
        className: "user-gps-pulse-marker",
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 50%; background: #3b82f6; border: 2.5px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const userMarker = L.marker([lat, lng], { icon: pulseIcon }).bindPopup(
        `<div style="font-weight: 600; font-size: 12px; color: #1e40af;">Lokasi Anda Saat Ini</div>
         <div style="font-size: 11px; color: #64748b; font-family: monospace;">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>`
      );

      group.addLayer(userMarker);
      group.addTo(map);
      userLocationMarkerRef.current = group;

      map.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
    }
  }, [L, userLocation]);

  return (
    <div className={`relative bg-background ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-100 bg-muted/20 z-0" />
    </div>
  );
}
