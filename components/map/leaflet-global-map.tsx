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
  name?: string;
  description?: string;
  category?: string;
  distanceKm?: number;
}

export interface LeafletGlobalMapProps {
  activeBasemapId: string;
  targetLocation?: TargetLocation | null;
  multipleLocations?: TargetLocation[] | null;
  userLocation?: { lat: number; lng: number } | null;
  onMapCenterChange?: (coords: { lat: number; lng: number; zoom: number }) => void;
  onCursorMove?: (coords: { lat: number; lng: number } | null) => void;
  onSelectPin?: (location: TargetLocation) => void;
  className?: string;
}

export function LeafletGlobalMap({
  activeBasemapId,
  targetLocation,
  multipleLocations,
  userLocation,
  onMapCenterChange,
  onCursorMove,
  onSelectPin,
  className = "w-full h-full",
}: LeafletGlobalMapProps) {
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const mapInstanceRef = React.useRef<LType.Map | null>(null);
  const currentLayerRef = React.useRef<LType.TileLayer | null>(null);
  const layerCacheRef = React.useRef<Map<string, LType.TileLayer>>(new Map());
  const searchMarkerRef = React.useRef<LType.Marker | null>(null);
  const multiMarkersLayerRef = React.useRef<LType.LayerGroup | null>(null);
  const userLocationMarkerRef = React.useRef<LType.LayerGroup | null>(null);
  const [L, setL] = React.useState<typeof LType | null>(null);

  const onMapCenterChangeRef = React.useRef(onMapCenterChange);
  const onCursorMoveRef = React.useRef(onCursorMove);
  const onSelectPinRef = React.useRef(onSelectPin);

  React.useEffect(() => {
    onMapCenterChangeRef.current = onMapCenterChange;
  }, [onMapCenterChange]);

  React.useEffect(() => {
    onCursorMoveRef.current = onCursorMove;
  }, [onCursorMove]);

  React.useEffect(() => {
    onSelectPinRef.current = onSelectPin;
  }, [onSelectPin]);

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

  const initialBasemapRef = React.useRef(activeBasemapId);

  // Initialize Map (Runs strictly once when L is loaded)
  React.useEffect(() => {
    if (!L || !mapContainerRef.current || mapInstanceRef.current) return;

    let initialCenter: [number, number] = [20.0, 0.0]; // Neutral Global World View
    let initialZoom = 3;

    try {
      const saved = typeof window !== "undefined" ? localStorage.getItem("map_last_view_center") : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.lat && parsed?.lng) {
          initialCenter = [parsed.lat, parsed.lng];
          initialZoom = parsed.zoom || 12;
        }
      }
    } catch {
      // ignore
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
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

    let lastCoords = { lat: 0, lng: 0, zoom: 0 };
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      const newLat = Number(center.lat.toFixed(5));
      const newLng = Number(center.lng.toFixed(5));
      if (lastCoords.lat !== newLat || lastCoords.lng !== newLng || lastCoords.zoom !== zoom) {
        lastCoords = { lat: newLat, lng: newLng, zoom };
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("map_last_view_center", JSON.stringify({ lat: newLat, lng: newLng, zoom }));
          }
        } catch {
          // ignore storage errors
        }
        onMapCenterChangeRef.current?.({
          lat: newLat,
          lng: newLng,
          zoom,
        });
      }
    };

    const handleMouseMove = (e: LType.LeafletMouseEvent) => {
      onCursorMoveRef.current?.({
        lat: Number(e.latlng.lat.toFixed(5)),
        lng: Number(e.latlng.lng.toFixed(5)),
      });
    };

    const handleMouseOut = () => {
      onCursorMoveRef.current?.(null);
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

    // Report initial center once
    handleMoveEnd();

    const layerCache = layerCacheRef.current;

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      layerCache.clear();
    };
  }, [L, createTileLayer]);

  // Update Basemap Layer Smoothly
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

  // Helper to create pin icon and rich interactive popup
  const createPinPopup = React.useCallback(
    (item: {
      lat: number;
      lng: number;
      name?: string;
      title?: string;
      description?: string;
      category?: string;
      distanceKm?: number;
    }) => {
      const lat = item.lat;
      const lng = item.lng;
      const placeName = item.title || item.name || "Titik Lokasi";
      const placeDesc = item.description && item.description !== placeName ? item.description : "";
      const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      const copySvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
      const checkSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;

      const container = document.createElement("div");
      container.style.cssText =
        "min-width:200px;max-width:270px;padding:3px;font-family:system-ui,-apple-system,sans-serif;color:#0f172a;";

      // 1. Header: Name (Bold & Crisp)
      const titleEl = document.createElement("div");
      titleEl.style.cssText = "font-size:13px;font-weight:700;color:#0f172a;line-height:1.35;margin-bottom:4px;";
      titleEl.textContent = placeName;
      container.appendChild(titleEl);

      // 2. Distance info (if available)
      if (item.distanceKm !== undefined && item.distanceKm !== null) {
        const distEl = document.createElement("div");
        distEl.style.cssText = "font-size:11px;color:#ef4444;font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:3px;";
        distEl.innerHTML = `<span>📍</span><span>${item.distanceKm < 1 ? `${Math.round(item.distanceKm * 1000)} m` : `${item.distanceKm} km`} dari Anda</span>`;
        container.appendChild(distEl);
      }

      // 3. Description / Address (if available)
      if (placeDesc) {
        const descEl = document.createElement("div");
        descEl.style.cssText =
          "font-size:11px;color:#475569;line-height:1.4;margin-bottom:8px;max-height:45px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;";
        descEl.textContent = placeDesc;
        container.appendChild(descEl);
      }

      // 4. Coordinates Bar + Copy Button
      const coordBar = document.createElement("div");
      coordBar.style.cssText =
        "display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 8px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;";

      const coordText = document.createElement("span");
      coordText.style.cssText =
        "font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-weight:600;color:#334155;";
      coordText.textContent = coordStr;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.title = "Salin Koordinat";
      btn.style.cssText =
        "display:flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid #cbd5e1;border-radius:6px;background:#ffffff;color:#475569;cursor:pointer;transition:all 0.15s ease;padding:0;";
      btn.innerHTML = copySvg;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(coordStr);
        btn.innerHTML = checkSvg;
        btn.style.borderColor = "#10b981";
        btn.style.backgroundColor = "#ecfdf5";
        setTimeout(() => {
          btn.innerHTML = copySvg;
          btn.style.borderColor = "#cbd5e1";
          btn.style.backgroundColor = "#ffffff";
        }, 2000);
      });

      coordBar.appendChild(coordText);
      coordBar.appendChild(btn);
      container.appendChild(coordBar);

      return container;
    },
    []
  );

  // Handle Single Target Location (FlyTo & Pin Marker with permanent label and rich popup)
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
    }

    if (targetLocation && (!multipleLocations || multipleLocations.length === 0)) {
      const { lat, lng, zoom = 15 } = targetLocation;
      map.flyTo([lat, lng], zoom, {
        animate: true,
        duration: 1.5,
      });

      const icon = L.divIcon({
        className: "custom-search-pin",
        html: `
          <div style="position: relative; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4)); cursor: pointer;">
            <div style="width: 26px; height: 26px; background-color: #ef4444; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;">
              <div style="width: 7px; height: 7px; background: white; border-radius: 50%;"></div>
            </div>
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26],
      });

      const placeLabel = targetLocation.title || targetLocation.name || "Titik Lokasi";

      const popupContainer = createPinPopup({
        lat,
        lng,
        name: placeLabel,
        title: placeLabel,
        description: targetLocation.description || targetLocation.subtitle,
        category: targetLocation.category,
      });

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(popupContainer, { offset: [0, 2], closeButton: true })
        .bindTooltip(placeLabel, {
          permanent: true,
          direction: "top",
          offset: [0, -28],
          className: "custom-map-pin-label",
        })
        .addTo(map);

      // Buka popup otomatis agar nama dan detail langsung tampil
      marker.openPopup();

      searchMarkerRef.current = marker;
    } else if (targetLocation && multipleLocations && multipleLocations.length > 0) {
      map.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom || 15, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [L, targetLocation, multipleLocations, createPinPopup]);

  // Handle Multiple Search Result Pins (e.g. searching "alun alun malang", "restoran", "toko")
  React.useEffect(() => {
    if (!L || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (multiMarkersLayerRef.current) {
      map.removeLayer(multiMarkersLayerRef.current);
      multiMarkersLayerRef.current = null;
    }

    if (multipleLocations && multipleLocations.length > 0) {
      // Clear single marker to strictly prevent double / stacked pins
      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
        searchMarkerRef.current = null;
      }

      const group = L.layerGroup();
      const bounds = L.latLngBounds([]);

      multipleLocations.forEach((loc, idx) => {
        const icon = L.divIcon({
          className: "custom-multi-search-pin",
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.4)); cursor: pointer;">
              <div style="width: 26px; height: 26px; background-color: #ef4444; border: 2.5px solid #ffffff; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;">
                <div style="width: 7px; height: 7px; background: white; border-radius: 50%;"></div>
              </div>
            </div>
          `,
          iconSize: [26, 26],
          iconAnchor: [13, 26],
          popupAnchor: [0, -26],
        });

        const placeLabel = loc.name || loc.title || "Titik Lokasi";

        const popupEl = createPinPopup({
          lat: loc.lat,
          lng: loc.lng,
          name: placeLabel,
          title: placeLabel,
          description: loc.description,
          category: loc.category,
          distanceKm: loc.distanceKm,
        });

        const m = L.marker([loc.lat, loc.lng], { icon })
          .bindPopup(popupEl, { offset: [0, 2], closeButton: true })
          .bindTooltip(placeLabel, {
            permanent: true,
            direction: "top",
            offset: [0, -28],
            className: "custom-map-pin-label",
          });

        m.on("click", () => {
          m.openPopup();
          onSelectPinRef.current?.(loc);
        });

        // Buka popup pin pertama / paling relevan secara otomatis
        if (idx === 0) {
          setTimeout(() => {
            m.openPopup();
          }, 300);
        }

        group.addLayer(m);
        bounds.extend([loc.lat, loc.lng]);
      });

      group.addTo(map);
      multiMarkersLayerRef.current = group;

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
      }
    }
  }, [L, multipleLocations, createPinPopup]);

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

      const userMarker = L.marker([lat, lng], { icon: pulseIcon });
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
