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
  const layerCacheRef = React.useRef<Map<string, LType.TileLayer>>(new Map());
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

    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

    const initialLayer = createTileLayer(L, activeBasemapId);
    initialLayer.addTo(map);
    currentLayerRef.current = initialLayer;
    mapInstanceRef.current = map;

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
  }, [L, createTileLayer, activeBasemapId, onMapCenterChange]);

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
