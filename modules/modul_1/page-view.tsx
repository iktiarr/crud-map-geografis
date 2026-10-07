"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { BASEMAP_OPTIONS } from "@/components/map/basemap-config";
import { LeafletGlobalMap, type TargetLocation } from "./components/leaflet-global-map";
import { GlobalMapSearch } from "./components/global-map-search";
import { GlobalMapAiDrawer } from "./components/global-map-ai-drawer";
import { BasemapSelectorModal } from "./components/basemap-selector-modal";
import { QuickToolbar } from "./components/quick-toolbar";
import { POPULAR_LOCATIONS, parseCoordinates } from "./contexts/modul-1-constants";
import type { SearchResultItem, ChatMessage } from "./types";

export function Modul1PageView() {
  const [activeBasemapId, setActiveBasemapId] = React.useState<string>("google-hybrid");
  const [targetLocation, setTargetLocation] = React.useState<TargetLocation | null>(null);
  const [multipleLocations, setMultipleLocations] = React.useState<TargetLocation[]>([]);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);

  // Live Map Coordinates Tracker (Neutral World View / Restored from localStorage / Auto-detected)
  const [mapCenter, setMapCenter] = React.useState<{ lat: number; lng: number; zoom: number }>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("map_last_view_center");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && parsed?.lng) {
            return {
              lat: parsed.lat,
              lng: parsed.lng,
              zoom: parsed.zoom || 12,
            };
          }
        }
      } catch {
        // ignore
      }
    }
    return {
      lat: 20.0,
      lng: 0.0,
      zoom: 3,
    };
  });
  const mapCenterRef = React.useRef(mapCenter);
  React.useEffect(() => {
    mapCenterRef.current = mapCenter;
  }, [mapCenter]);

  // Auto-detect user's physical location worldwide (Browser GPS + IP Geolocation Fallback)
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserLocation(coords);
          setTargetLocation({
            lat: coords.lat,
            lng: coords.lng,
            zoom: 15,
            title: "Lokasi Anda",
          });
          try {
            localStorage.setItem(
              "map_last_view_center",
              JSON.stringify({ lat: coords.lat, lng: coords.lng, zoom: 15 })
            );
          } catch {
            // ignore
          }
        },
        async () => {
          // If browser GPS is denied or unavailable, detect user city via IP Geolocation
          const hasSaved = localStorage.getItem("map_last_view_center");
          if (!hasSaved) {
            try {
              const res = await fetch("https://ipapi.co/json/");
              if (res.ok) {
                const data = await res.json();
                if (data?.latitude && data?.longitude) {
                  const ipCoords = {
                    lat: data.latitude,
                    lng: data.longitude,
                  };
                  setTargetLocation({
                    lat: ipCoords.lat,
                    lng: ipCoords.lng,
                    zoom: 12,
                    title: data.city || "Lokasi Anda",
                  });
                  localStorage.setItem(
                    "map_last_view_center",
                    JSON.stringify({ lat: ipCoords.lat, lng: ipCoords.lng, zoom: 12 })
                  );
                }
              }
            } catch {
              // ignore
            }
          }
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  }, []);

  const [cursorCoords, setCursorCoords] = React.useState<{ lat: number; lng: number } | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchCacheRef = React.useRef<Map<string, SearchResultItem[]>>(new Map());

  // Basemap Selector Modal
  const [isBasemapModalOpen, setIsBasemapModalOpen] = React.useState(false);

  // AI Drawer State
  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const [currentActiveAi, setCurrentActiveAi] = React.useState<string>("OpenRouter AI");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Halo! Saya Asisten AI Global Maps.",
      time: "Sekarang",
    },
  ]);
  const [inputMessage, setInputMessage] = React.useState("");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  // Toast State
  const [toastMessage, setToastMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const activeBasemap = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId) || BASEMAP_OPTIONS[0];

  // Fetch initial active AI model name
  React.useEffect(() => {
    fetch("/api/ai-global-maps")
      .then((res) => res.json())
      .then((data) => {
        if (data?.model) {
          setCurrentActiveAi(data.model);
        }
      })
      .catch(() => {});
  }, []);

  // Auto scroll chat to bottom
  React.useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isAiLoading]);

  // Close search dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

// Haversine formula to calculate accurate distance between two points in km
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

  // Superfast Location & POI Geocoding Search (prioritizing max 100km from current position/center)
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const currentCenter = mapCenterRef.current;
    const refLat = userLocation?.lat ?? currentCenter.lat;
    const refLng = userLocation?.lng ?? currentCenter.lng;

    const cacheKey = `${trimmed.toLowerCase()}_${refLat.toFixed(2)}_${refLng.toFixed(2)}`;
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey)!;
      const timer = setTimeout(() => {
        setSearchResults(cached);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    setIsSearching(true);
    const abortCtrl = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const localMatches: SearchResultItem[] = [];
        const norm = trimmed.toLowerCase();

        // 1. Cek jika input adalah koordinat angka langsung
        const directCoords = parseCoordinates(trimmed);
        if (directCoords) {
          const dist = calculateHaversineKm(refLat, refLng, directCoords.lat, directCoords.lng);
          localMatches.push({
            id: `coord-${directCoords.lat}-${directCoords.lng}`,
            name: `Koordinat: ${directCoords.lat}, ${directCoords.lng}`,
            lat: directCoords.lat,
            lng: directCoords.lng,
            zoom: 16,
            category: "Koordinat Presisi",
            description: "Arahkan kamera tepat ke titik koordinat",
            source: "local",
            distanceKm: dist,
          });
        }

        // 2. Cek basis data referensi lokal
        for (const loc of POPULAR_LOCATIONS) {
          if (loc.name.toLowerCase().includes(norm) || loc.aliases.some((a) => a.toLowerCase().includes(norm))) {
            const dist = calculateHaversineKm(refLat, refLng, loc.lat, loc.lng);
            localMatches.push({
              id: `local-${loc.name}`,
              name: loc.name,
              lat: loc.lat,
              lng: loc.lng,
              zoom: loc.zoom,
              category: loc.category,
              description: loc.description,
              source: "local",
              distanceKm: dist,
            });
          }
        }

        let combined = [...localMatches];

        // 3. Query internal high-speed multi-source Search API (Komoot Photon + OSM Nominatim + Overpass)
        try {
          const res = await fetch(
            `/api/search-places?q=${encodeURIComponent(trimmed)}&lat=${refLat}&lng=${refLng}`,
            { signal: abortCtrl.signal }
          );

          if (res.ok) {
            const data: { results?: SearchResultItem[] } = await res.json();
            if (Array.isArray(data?.results) && data.results.length > 0) {
              combined = [...combined, ...data.results];
            }
          }
        } catch {
          // ignore abort or fetch errors
        }

        // Compute relevance score & deduplicate
        const uniqueMap = new Map<string, SearchResultItem>();
        const qNorm = trimmed.toLowerCase();
        const qWords = Array.from(new Set(qNorm.split(/[\s,.-]+/).filter((w) => w.length >= 2)));

        const computeScore = (item: SearchResultItem): number => {
          const name = (item.name || "").toLowerCase();
          const desc = (item.description || "").toLowerCase();
          const cat = (item.category || "").toLowerCase();
          let score = 0;

          if (name === qNorm) score += 2500;
          else if (name.startsWith(qNorm)) score += 1800;
          else if (name.includes(qNorm)) score += 1400;
          else if (desc.includes(qNorm)) score += 800;

          let matched = 0;
          for (const w of qWords) {
            if (name.includes(w)) {
              matched++;
              score += 300;
            } else if (desc.includes(w)) {
              matched++;
              score += 120;
            } else if (cat.includes(w)) {
              score += 50;
            }
          }

          if (matched >= qWords.length) score += 600;

          const missing = qWords.filter((w) => !name.includes(w) && !desc.includes(w) && !cat.includes(w)).length;
          if (missing > 0) score -= missing * 500;

          if (item.distanceKm !== undefined) {
            score += Math.max(0, 120 - item.distanceKm * 1.2);
          }
          return score;
        };

        combined.forEach((item) => {
          if (!uniqueMap.has(item.id)) {
            uniqueMap.set(item.id, item);
          }
        });

        const finalResults = Array.from(uniqueMap.values());
        finalResults.sort((a, b) => {
          const scoreA = computeScore(a);
          const scoreB = computeScore(b);
          const diff = scoreB - scoreA;
          if (Math.abs(diff) > 50) return diff;
          return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
        });

        searchCacheRef.current.set(cacheKey, finalResults);
        setSearchResults(finalResults);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Search error:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      abortCtrl.abort();
    };
  }, [searchQuery, userLocation]);

  // Handle Select Single Location from Search
  const handleSelectLocation = (item: SearchResultItem) => {
    setMultipleLocations([]);
    setTargetLocation({
      lat: item.lat,
      lng: item.lng,
      zoom: item.zoom,
      title: item.name,
      name: item.name,
      description: item.description,
      category: item.category,
      distanceKm: item.distanceKm,
    });
    setSearchQuery(item.name);
    setIsSearchOpen(false);
    showToast(`Peta diarahkan ke: ${item.name}`);
  };

  // Handle Submit Search (Pressing Enter: shows all matching places on map like Google Maps)
  const handleSubmitSearch = (query: string) => {
    if (searchResults.length > 0) {
      const pins: TargetLocation[] = searchResults.map((r) => ({
        lat: r.lat,
        lng: r.lng,
        zoom: r.zoom,
        title: r.name,
        name: r.name,
        description: r.description,
        category: r.category,
        distanceKm: r.distanceKm,
      }));

      // Clear single target to strictly avoid double / stacked pins
      setTargetLocation(null);
      setMultipleLocations(pins);
      setIsSearchOpen(false);
      showToast(`Menampilkan ${pins.length} lokasi untuk "${query}"`);
    } else {
      showToast(`Mencari "${query}"...`);
    }
  };

  // Handle Locate User GPS
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      showToast("Peramban Anda tidak mendukung GPS / Geolocation", "error");
      return;
    }

    setIsLocating(true);
    showToast("Mendeteksi posisi GPS Anda...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        setMultipleLocations([]);
        setTargetLocation({
          lat: coords.lat,
          lng: coords.lng,
          zoom: 16,
          title: "Lokasi Anda",
        });
        showToast("Posisi GPS berhasil ditemukan!");
      },
      (err) => {
        setIsLocating(false);
        showToast(`Gagal mendapatkan lokasi GPS (${err.message})`, "error");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle AI Action Execution
  const handleExecuteAction = (action: NonNullable<ChatMessage["action"]>) => {
    if (action.type === "fly_to") {
      const parts = action.param.split(",");
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      const zoom = parts[2] ? parseInt(parts[2], 10) : 14;
      if (!isNaN(lat) && !isNaN(lng)) {
        setMultipleLocations([]);
        setTargetLocation({ lat, lng, zoom, title: action.label });
        showToast(`Menuju: ${action.label}`);
      }
    } else if (action.type === "set_basemap") {
      const basemapExists = BASEMAP_OPTIONS.some((b) => b.id === action.param);
      if (basemapExists) {
        setActiveBasemapId(action.param);
        showToast(`Gaya peta diubah: ${action.label}`);
      }
    } else if (action.type === "locate_user") {
      handleLocateUser();
    } else if (action.type === "reset_indonesia") {
      setMultipleLocations([]);
      setTargetLocation({
        lat: -2.5,
        lng: 118.0,
        zoom: 5,
        title: "Kepulauan Indonesia",
      });
      showToast("Tampilan peta diatur ulang ke Kepulauan Indonesia");
    }
  };

  // Handle Send Message to AI Assistant
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputMessage("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai-global-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          context: {
            activeBasemap: activeBasemap.name,
            centerLat: mapCenter.lat,
            centerLng: mapCenter.lng,
            zoom: mapCenter.zoom,
            userLocation,
            cursorCoords,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.usedModel) {
          setCurrentActiveAi(data.usedModel);
        }

        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action: data.action || null,
        };

        setMessages((prev) => [...prev, aiMsg]);

        // Auto execute action if available
        if (data.action) {
          handleExecuteAction(data.action);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-err-${Date.now()}`,
            sender: "ai",
            text: data.error || "Maaf, terjadi kendala saat memproses jawaban AI.",
            time: "Baru saja",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: "ai",
          text: "Gagal terhubung ke server asisten AI. Periksa koneksi internet Anda.",
          time: "Baru saja",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden bg-background">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 duration-150 ${
            toastMessage.type === "success"
              ? "bg-card/95 backdrop-blur-md border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-card/95 backdrop-blur-md border-destructive/30 text-destructive"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Floating Top Bar (Header Nav, Search, Quick Toolbar) */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-30 flex items-center justify-between gap-2 sm:gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto flex-1 min-w-0 mr-2 sm:mr-3">
          <Link
            href="/"
            className="h-10 px-3 rounded-xl border border-border bg-card/90 backdrop-blur-md hover:bg-card text-foreground text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline">Beranda</span>
          </Link>

          {/* Search Box */}
          <GlobalMapSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            isSearchOpen={isSearchOpen}
            setIsSearchOpen={setIsSearchOpen}
            onSelectResult={handleSelectLocation}
            onSubmitSearch={handleSubmitSearch}
            searchContainerRef={searchContainerRef}
          />
        </div>

        {/* Quick Toolbar */}
        <div className="pointer-events-auto shrink-0">
          <QuickToolbar
            onOpenBasemap={() => setIsBasemapModalOpen(true)}
            onLocateUser={handleLocateUser}
            onOpenAi={() => setIsAiOpen(true)}
            isLocating={isLocating}
            activeBasemapName={activeBasemap.name}
          />
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full relative z-0">
        <LeafletGlobalMap
          activeBasemapId={activeBasemapId}
          targetLocation={targetLocation}
          multipleLocations={multipleLocations}
          userLocation={userLocation}
          onMapCenterChange={setMapCenter}
          onCursorMove={setCursorCoords}
          onSelectPin={(loc) => {
            setTargetLocation(loc);
          }}
          className="w-full h-full"
        />
      </div>

      {/* Backdrop for open drawers */}
      {(isBasemapModalOpen || isAiOpen) && (
        <div
          onClick={() => {
            setIsBasemapModalOpen(false);
            setIsAiOpen(false);
          }}
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40 animate-in fade-in-0 duration-150"
        />
      )}

      {/* Basemap Selector Drawer */}
      <BasemapSelectorModal
        isOpen={isBasemapModalOpen}
        onClose={() => setIsBasemapModalOpen(false)}
        activeBasemapId={activeBasemapId}
        onSelectBasemap={(id) => {
          setActiveBasemapId(id);
          showToast(`Tampilan peta diubah ke: ${BASEMAP_OPTIONS.find((b) => b.id === id)?.name || id}`);
        }}
      />

      {/* AI Assistant Drawer */}
      <GlobalMapAiDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        messages={messages}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        isAiLoading={isAiLoading}
        currentActiveAi={currentActiveAi}
        onSendMessage={handleSendMessage}
        onExecuteAction={handleExecuteAction}
        chatScrollRef={chatScrollRef}
      />
    </div>
  );
}
