"use client";

import * as React from "react";
import type * as LType from "leaflet";
import { BASEMAP_OPTIONS } from "./basemap-config";

export interface LeafletGlobalMapProps {
  activeBasemapId: string;
  onMapCenterChange?: (coords: { lat: number; lng: number; zoom: number }) => void;
  className?: string;
}

export function LeafletGlobalMap({
  activeBasemapId,
  onMapCenterChange,
  className = "w-full h-full",
}: LeafletGlobalMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<LType.Map | null>(null);
  const currentLayerRef = React.useRef<LType.TileLayer | null>(null);
  // Layer instance cache for instant zero-latency switching
  const layerCacheRef = React.useRef<Map<string, LType.TileLayer>>(new Map());
  const [L, setL] = React.useState<typeof LType | null>(null);

  // Dynamically load Leaflet on client
  React.useEffect(() => {
    import("leaflet").then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

  // Helper to create high-performance cached tile layer
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
        subdomains: basemapConfig.subdomains || ["a", "b", "c"],
        keepBuffer: 12, // High buffer for instant panning
        updateWhenIdle: false, // Don't delay tile requests
        updateWhenZooming: false, // Load zoom tiles immediately
        crossOrigin: "anonymous", // Browser CDN caching
      });

      layerCacheRef.current.set(basemapId, layer);
      return layer;
    },
    []
  );

  // Initialize Map
  React.useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Indonesia / Jakarta (-6.2088, 106.8456)
    const map = L.map(mapContainerRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 11,
      zoomControl: false,
      fadeAnimation: false, // Instant tile rendering without blur lag
    });

    // Add zoom control to top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    // Add Scale control to bottom-right
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

    // Initial Base Tile Layer
    const initialLayer = createTileLayer(L, activeBasemapId);
    initialLayer.addTo(map);
    currentLayerRef.current = initialLayer;
    mapInstanceRef.current = map;

    // Map Event listeners
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapCenterChange?.({
        lat: Number(center.lat.toFixed(4)),
        lng: Number(center.lng.toFixed(4)),
        zoom,
      });
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleMoveEnd);

    // ResizeObserver to smoothly handle viewport adjustments
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Initial trigger
    handleMoveEnd();

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layerCacheRef.current.clear();
    };
  }, [L, createTileLayer, activeBasemapId, onMapCenterChange]);

  // Ultra-Fast Seamless Basemap Layer Switching
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    const oldLayer = currentLayerRef.current;
    const newLayer = createTileLayer(L, activeBasemapId);

    if (oldLayer === newLayer) return;

    // Place new layer directly into map
    newLayer.addTo(map);
    currentLayerRef.current = newLayer;

    // Remove old layer once new layer starts rendering or immediately
    if (oldLayer) {
      const removeTimer = setTimeout(() => {
        if (map.hasLayer(oldLayer)) {
          map.removeLayer(oldLayer);
        }
      }, 100);

      newLayer.once("load", () => {
        clearTimeout(removeTimer);
        if (map.hasLayer(oldLayer)) {
          map.removeLayer(oldLayer);
        }
      });
    }
  }, [L, activeBasemapId, createTileLayer]);

  return (
    <div className={`relative bg-background ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-100 bg-muted/20 z-0" />
    </div>
  );
}
