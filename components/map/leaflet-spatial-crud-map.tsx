"use client";

import * as React from "react";
import type * as LType from "leaflet";
import { BASEMAP_OPTIONS } from "./basemap-config";

export interface SpatialFeature {
  id: number;
  name: string;
  group_name?: string;
  type: string;
  category?: string;
  description?: string;
  color?: string;
  geojson?: any;
  geom_geojson?: any;
  properties?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface LeafletSpatialCrudMapProps {
  features: SpatialFeature[];
  activeBasemapId: string;
  onBasemapChange?: (id: string) => void;
  drawMode: "none" | "point" | "linestring" | "polygon";
  draftPoints: [number, number][]; // [lat, lng]
  onDraftPointsChange: (points: [number, number][]) => void;
  onDraftGeometryChange: (geom: any | null) => void;
  onSelectFeature?: (feature: SpatialFeature) => void;
  onEditFeature?: (feature: SpatialFeature) => void;
  onDeleteFeature?: (feature: SpatialFeature) => void;
  focusedFeatureId?: number | null;
  activeColor?: string;
  className?: string;
}

export function LeafletSpatialCrudMap({
  features,
  activeBasemapId,
  drawMode,
  draftPoints,
  onDraftPointsChange,
  onDraftGeometryChange,
  onSelectFeature,
  onEditFeature,
  onDeleteFeature,
  focusedFeatureId,
  activeColor = "#10b981",
  className = "w-full h-full",
}: LeafletSpatialCrudMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<LType.Map | null>(null);
  const currentTileLayerRef = React.useRef<LType.TileLayer | null>(null);
  const initialBasemapRef = React.useRef<string>(activeBasemapId);
  const lastBasemapIdRef = React.useRef<string>(activeBasemapId);
  const featuresLayerGroupRef = React.useRef<LType.FeatureGroup | null>(null);
  const draftLayerGroupRef = React.useRef<LType.LayerGroup | null>(null);
  const [L, setL] = React.useState<typeof LType | null>(null);
  const [mouseCoords, setMouseCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  // Keep references to latest callbacks and state to avoid stale closures in Leaflet events
  const callbacksRef = React.useRef({
    drawMode,
    draftPoints,
    onDraftPointsChange,
    onDraftGeometryChange,
    onSelectFeature,
    onEditFeature,
    onDeleteFeature,
    activeColor,
  });

  React.useEffect(() => {
    callbacksRef.current = {
      drawMode,
      draftPoints,
      onDraftPointsChange,
      onDraftGeometryChange,
      onSelectFeature,
      onEditFeature,
      onDeleteFeature,
      activeColor,
    };
  });

  // Guard: Ensure leaflet-container class is NEVER removed from DOM container
  React.useEffect(() => {
    if (mapContainerRef.current && !mapContainerRef.current.classList.contains("leaflet-container")) {
      mapContainerRef.current.classList.add("leaflet-container");
    }
  });

  // Dynamically load Leaflet on client side only
  React.useEffect(() => {
    import("leaflet").then((leafletModule) => {
      setL(leafletModule.default || leafletModule);
    });
  }, []);

  // Helper to create fresh TileLayer instances
  const createTileLayer = React.useCallback(
    (leaflet: typeof LType, basemapId: string) => {
      const basemapConfig =
        BASEMAP_OPTIONS.find((b) => b.id === basemapId) || BASEMAP_OPTIONS[0];

      return leaflet.tileLayer(basemapConfig.url, {
        attribution: basemapConfig.attribution,
        maxZoom: basemapConfig.maxZoom,
        maxNativeZoom: basemapConfig.maxNativeZoom ?? basemapConfig.maxZoom,
        subdomains: basemapConfig.subdomains || ["a", "b", "c"],
        keepBuffer: 8,
        updateWhenIdle: false,
        updateWhenZooming: true,
        tileSize: 256,
      });
    },
    []
  );

  // Helper to handle drawing clicks
  const handleDrawClick = React.useCallback(
    (lat: number, lng: number) => {
      const mode = callbacksRef.current.drawMode;
      if (mode === "none") return;

      const clickLat = Number(lat.toFixed(6));
      const clickLng = Number(lng.toFixed(6));
      if (isNaN(clickLat) || isNaN(clickLng)) return;

      if (mode === "point") {
        const newPoints: [number, number][] = [[clickLat, clickLng]];
        callbacksRef.current.onDraftPointsChange(newPoints);
        callbacksRef.current.onDraftGeometryChange({
          type: "Point",
          coordinates: [clickLng, clickLat],
        });
      } else if (mode === "linestring") {
        const prev = callbacksRef.current.draftPoints;
        const next: [number, number][] = [...prev, [clickLat, clickLng]];
        callbacksRef.current.onDraftPointsChange(next);

        if (next.length >= 2) {
          const coords = next.map(([la, ln]) => [ln, la]);
          callbacksRef.current.onDraftGeometryChange({
            type: "LineString",
            coordinates: coords,
          });
        }
      } else if (mode === "polygon") {
        const prev = callbacksRef.current.draftPoints;
        const next: [number, number][] = [...prev, [clickLat, clickLng]];
        callbacksRef.current.onDraftPointsChange(next);

        if (next.length >= 3) {
          const ring = next.map(([la, ln]) => [ln, la]);
          ring.push([next[0][1], next[0][0]]);
          callbacksRef.current.onDraftGeometryChange({
            type: "Polygon",
            coordinates: [ring],
          });
        }
      }
    },
    []
  );

  // Initialize Map ONCE (Never destroy on basemap or drawing change)
  React.useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 12,
      maxZoom: 21,
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true,
      preferCanvas: true,
      trackResize: true,
    });

    // Zoom and scale controls
    L.control.zoom({ position: "topright" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(map);

    // Initial basemap layer
    const initialLayer = createTileLayer(L, initialBasemapRef.current);
    initialLayer.addTo(map);
    currentTileLayerRef.current = initialLayer;
    lastBasemapIdRef.current = initialBasemapRef.current;

    // Layer groups for features and drawing drafts
    const featuresGroup = L.featureGroup().addTo(map);
    const draftGroup = L.layerGroup().addTo(map);

    featuresLayerGroupRef.current = featuresGroup;
    draftLayerGroupRef.current = draftGroup;
    mapInstanceRef.current = map;

    // Track mouse coordinates
    map.on("mousemove", (e: LType.LeafletMouseEvent) => {
      setMouseCoords({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    });

    // Handle map click for drawing
    map.on("click", (e: LType.LeafletMouseEvent) => {
      handleDrawClick(e.latlng.lat, e.latlng.lng);
    });

    // Resize observer to handle side-panel collapse/expand
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Initial size invalidation
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [L, createTileLayer, handleDrawClick]);

  // Smooth Basemap Switch (Add new layer first, remove old layer without white flash)
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    if (lastBasemapIdRef.current === activeBasemapId) return;
    lastBasemapIdRef.current = activeBasemapId;

    const map = mapInstanceRef.current;
    const oldLayer = currentTileLayerRef.current;
    const newLayer = createTileLayer(L, activeBasemapId);

    newLayer.addTo(map);
    currentTileLayerRef.current = newLayer;

    if (oldLayer && map.hasLayer(oldLayer)) {
      let cleaned = false;
      const removeOld = () => {
        if (cleaned) return;
        cleaned = true;
        if (map.hasLayer(oldLayer)) {
          map.removeLayer(oldLayer);
        }
      };

      // Keep previous layer visible until new tiles start rendering
      newLayer.once("load", removeOld);
      newLayer.once("tileerror", removeOld);
      setTimeout(removeOld, 1200);
    }
  }, [L, activeBasemapId, createTileLayer]);

  // Invalidate size on drawMode changes without breaking container
  React.useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [drawMode]);

  // Helper to create HTML popup content
  const createPopupContent = React.useCallback(
    (feature: SpatialFeature) => {
      const color = feature.color || "#10b981";
      const name = feature.name || "Tanpa Nama";
      const group = feature.group_name || "Utama";
      const type = feature.type || "Objek";
      const category = feature.category || "Umum";
      const desc = feature.description || "-";

      let customPropsHtml = "";
      if (feature.properties && typeof feature.properties === "object") {
        const keys = Object.keys(feature.properties).filter(
          (k) => !["id", "name", "group_name", "type", "category", "description", "color", "created_at", "updated_at"].includes(k)
        );
        if (keys.length > 0) {
          customPropsHtml = `
            <div style="margin-top: 8px; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 6px; font-size: 11px; max-height: 80px; overflow-y: auto;">
              <strong style="color: #64748b;">Atribut Ekstra:</strong>
              ${keys
                .slice(0, 5)
                .map((k) => `<div><span style="font-weight:600;">${k}:</span> ${String(feature.properties![k])}</div>`)
                .join("")}
            </div>
          `;
        }
      }

      return `
        <div style="font-family: inherit; font-size: 13px; min-width: 210px; max-width: 280px; padding: 2px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
            <span style="width: 10px; height: 10px; border-radius: 50%; background-color: ${color}; display: inline-block; flex-shrink: 0;"></span>
            <strong style="font-size: 14px; color: #0f172a; line-height: 1.2;">${name}</strong>
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            <span style="background: rgba(139, 92, 246, 0.15); color: #7c3aed; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">📁 ${group}</span>
            <span style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">${type}</span>
            <span style="background: rgba(59, 130, 246, 0.15); color: #2563eb; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px;">${category}</span>
          </div>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #475569; line-height: 1.4;">${desc}</p>
          ${customPropsHtml}
          <div style="margin-top: 10px; display: flex; gap: 6px; border-top: 1px solid rgba(128,128,128,0.2); padding-top: 8px;">
            <button id="btn-edit-${feature.id}" style="flex: 1; background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
              ✏️ Edit
            </button>
            <button id="btn-del-${feature.id}" style="flex: 1; background: #ef4444; color: white; border: none; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
              🗑️ Hapus
            </button>
          </div>
        </div>
      `;
    },
    []
  );

  // Render Features to Map with Full Dynamic Geometry Support
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !featuresLayerGroupRef.current) return;

    const layerGroup = featuresLayerGroupRef.current;
    layerGroup.clearLayers();

    features.forEach((feat) => {
      try {
        let geom = feat.geom_geojson || feat.geojson;
        if (typeof geom === "string") {
          try {
            geom = JSON.parse(geom);
          } catch {
            return;
          }
        }

        if (!geom || !geom.type || !geom.coordinates) return;

        const color = feat.color || "#10b981";
        const geomType = geom.type;
        let layer: LType.Layer | null = null;

        // 1. POINT
        if (geomType === "Point" && Array.isArray(geom.coordinates)) {
          const [lng, lat] = geom.coordinates;
          if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) return;

          const pinIcon = L.divIcon({
            className: "custom-spatial-pin",
            iconSize: [28, 36],
            iconAnchor: [14, 36],
            popupAnchor: [0, -34],
            html: `
              <div style="position: relative; width: 28px; height: 36px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.35)); transition: transform 0.2s;">
                <svg viewBox="0 0 24 32" width="28" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 0C5.37 0 0 5.37 0 12C0 20.25 12 32 12 32C12 32 24 20.25 24 12C24 5.37 18.63 0 12 0Z" fill="${color}"/>
                  <circle cx="12" cy="12" r="5" fill="#FFFFFF"/>
                </svg>
              </div>
            `,
          });

          layer = L.marker([lat, lng], { icon: pinIcon });
        }

        // 2. LINESTRING
        else if (geomType === "LineString" && Array.isArray(geom.coordinates)) {
          const latLngs = geom.coordinates
            .filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]))
            .map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);

          if (latLngs.length >= 2) {
            layer = L.polyline(latLngs, {
              color,
              weight: 4.5,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            });
          }
        }

        // 3. POLYGON
        else if (geomType === "Polygon" && Array.isArray(geom.coordinates) && geom.coordinates[0]) {
          const exteriorRing = geom.coordinates[0];
          const latLngs = exteriorRing
            .filter((c: any) => Array.isArray(c) && c.length >= 2 && !isNaN(c[0]) && !isNaN(c[1]))
            .map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]);

          if (latLngs.length >= 3) {
            layer = L.polygon(latLngs, {
              color,
              weight: 2.5,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.25,
            });
          }
        }

        // 4. MULTI-POLYGON or MULTI-LINESTRING or MULTI-POINT via GeoJSON standard
        else {
          layer = L.geoJSON(
            { type: "Feature", geometry: geom, properties: {} } as any,
            {
              style: () => ({
                color,
                weight: 3,
                opacity: 0.85,
                fillColor: color,
                fillOpacity: 0.25,
              }),
              pointToLayer: (_geoJsonPoint, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 8,
                  fillColor: color,
                  color: "#ffffff",
                  weight: 2,
                  opacity: 1,
                  fillOpacity: 0.85,
                });
              },
            }
          );
        }

        if (layer) {
          const popup = L.popup({
            maxWidth: 300,
            className: "spatial-feature-popup",
          }).setContent(createPopupContent(feat));

          layer.bindPopup(popup);

          layer.on("popupopen", () => {
            const editBtn = document.getElementById(`btn-edit-${feat.id}`);
            const delBtn = document.getElementById(`btn-del-${feat.id}`);

            if (editBtn) {
              editBtn.onclick = (e) => {
                e.stopPropagation();
                callbacksRef.current.onEditFeature?.(feat);
                layer?.closePopup();
              };
            }
            if (delBtn) {
              delBtn.onclick = (e) => {
                e.stopPropagation();
                callbacksRef.current.onDeleteFeature?.(feat);
                layer?.closePopup();
              };
            }
          });

          layer.on("click", (e: LType.LeafletMouseEvent) => {
            if (callbacksRef.current.drawMode !== "none") {
              handleDrawClick(e.latlng.lat, e.latlng.lng);
              return;
            }
            callbacksRef.current.onSelectFeature?.(feat);
          });

          (layer as any)._featureId = feat.id;
          layerGroup.addLayer(layer);
        }
      } catch (err) {
        console.warn("Could not render feature to map:", feat.id, err);
      }
    });
  }, [L, features, createPopupContent, handleDrawClick]);

  // Handle Focus on Feature
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !featuresLayerGroupRef.current || !focusedFeatureId) return;

    const map = mapInstanceRef.current;
    const group = featuresLayerGroupRef.current;

    let targetLayer: any = null;
    group.eachLayer((layer: any) => {
      if (layer._featureId === focusedFeatureId) {
        targetLayer = layer;
      }
    });

    if (targetLayer) {
      if (targetLayer.getBounds && typeof targetLayer.getBounds === "function") {
        map.flyToBounds(targetLayer.getBounds(), { maxZoom: 16, padding: [60, 60], duration: 1.2 });
      } else if (targetLayer.getLatLng && typeof targetLayer.getLatLng === "function") {
        map.flyTo(targetLayer.getLatLng(), 16, { duration: 1.2 });
      }
      setTimeout(() => {
        targetLayer.openPopup?.();
      }, 700);
    }
  }, [L, focusedFeatureId]);

  // Render Live Draft Layer (While Drawing Point / Line / Polygon)
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current || !draftLayerGroupRef.current) return;

    const draftGroup = draftLayerGroupRef.current;
    draftGroup.clearLayers();

    if (drawMode === "none" || draftPoints.length === 0) return;

    const color = activeColor || "#10b981";

    // 1. DRAFT POINT
    if (drawMode === "point" && draftPoints.length > 0) {
      const [lat, lng] = draftPoints[0];
      const draftMarker = L.circleMarker([lat, lng], {
        radius: 9,
        fillColor: color,
        color: "#ffffff",
        weight: 3,
        fillOpacity: 0.9,
      });
      draftGroup.addLayer(draftMarker);
    }

    // 2. DRAFT LINESTRING
    else if (drawMode === "linestring" && draftPoints.length > 0) {
      draftPoints.forEach(([lat, lng], idx) => {
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: idx === 0 ? "#22c55e" : "#ffffff",
          color: color,
          weight: 2.5,
          fillOpacity: 1,
        });
        draftGroup.addLayer(marker);
      });

      if (draftPoints.length >= 2) {
        const polyline = L.polyline(draftPoints, {
          color,
          weight: 4,
          dashArray: "6, 6",
          opacity: 0.9,
        });
        draftGroup.addLayer(polyline);
      }
    }

    // 3. DRAFT POLYGON
    else if (drawMode === "polygon" && draftPoints.length > 0) {
      draftPoints.forEach(([lat, lng], idx) => {
        const marker = L.circleMarker([lat, lng], {
          radius: 6,
          fillColor: idx === 0 ? "#22c55e" : "#ffffff",
          color: color,
          weight: 2.5,
          fillOpacity: 1,
        });
        draftGroup.addLayer(marker);
      });

      if (draftPoints.length >= 3) {
        const polygon = L.polygon(draftPoints, {
          color,
          weight: 3,
          dashArray: "6, 6",
          fillColor: color,
          fillOpacity: 0.3,
        });
        draftGroup.addLayer(polygon);
      } else if (draftPoints.length === 2) {
        const polyline = L.polyline(draftPoints, {
          color,
          weight: 3,
          dashArray: "6, 6",
        });
        draftGroup.addLayer(polyline);
      }
    }
  }, [L, drawMode, draftPoints, activeColor]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-slate-900 ${className} ${
        drawMode !== "none" ? "spatial-draw-active cursor-crosshair [&_.leaflet-container]:cursor-crosshair" : ""
      }`}
    >
      {/* Map Container - completely static class to protect Leaflet internal DOM classes */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-100 z-0 select-none"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Live Coordinate Status Indicator */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-2 bg-card/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border/70 text-xs text-muted-foreground shadow-sm">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>
          Koordinat:{" "}
          <strong className="text-foreground font-mono">
            {mouseCoords ? `${mouseCoords.lat}, ${mouseCoords.lng}` : "-6.2088, 106.8456"}
          </strong>
        </span>
      </div>
    </div>
  );
}
