"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  Check, 
  Map as MapIcon, 
  Layers,
  X,
  ArrowLeft,
  Search,
  Crosshair,
  Copy,
  MapPin,
  Sparkles,
  Compass,
  Send,
  Bot,
  User,
  Zap,
  Navigation
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SettingsSheet } from "@/components/settings-sheet";
import { BASEMAP_OPTIONS, type BasemapOption } from "@/components/map/basemap-config";
import type { TargetLocation } from "@/components/map/leaflet-global-map";
import { 
  findLocalReference, 
  getSmartZoomLevel, 
  parseCoordinates 
} from "@/contexts/modul-1";

const LeafletGlobalMap = dynamic(
  () => import("@/components/map/leaflet-global-map").then((mod) => mod.LeafletGlobalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-background flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-xs w-full space-y-3 text-center">
          <Skeleton className="w-14 h-14 rounded-2xl" />
          <Skeleton className="h-4 w-40 rounded-md" />
          <Skeleton className="h-3.5 w-56 rounded-md" />
        </div>
      </div>
    ),
  }
);

interface SearchResultItem {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
  zoom?: number;
  isAi?: boolean;
}

interface PhotonFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties?: {
    name?: string;
    street?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    type?: string;
    osm_value?: string;
  };
}

interface NominatimFeature {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
  class?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  modelName?: string;
  configName?: string;
  action?: {
    type: "fly_to" | "set_basemap" | "locate_user" | "reset_indonesia";
    param: string;
    label: string;
  };
}

let messageCounter = 0;
function createMessageId(prefix: string): string {
  messageCounter += 1;
  return `${prefix}-${messageCounter}-${Date.now()}`;
}

function getFormattedTime(): string {
  return new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export default function GlobalMapsPage() {
  const [activeBasemapId, setActiveBasemapId] = React.useState("google-hybrid");
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Map viewport state
  const [mapCenter, setMapCenter] = React.useState({ lat: -6.2088, lng: 106.8456, zoom: 11 });
  const [cursorCoords, setCursorCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [targetLocation, setTargetLocation] = React.useState<TargetLocation | null>(null);
  const [userLocation, setUserLocation] = React.useState<{ lat: number; lng: number } | null>(null);

  // Fast Geocoding Search State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchCacheRef = React.useRef<Map<string, SearchResultItem[]>>(new Map());
  const searchAbortRef = React.useRef<AbortController | null>(null);

  // AI Assistant Chat State (Slide-in Left)
  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const [isAiMapListOpen, setIsAiMapListOpen] = React.useState(false);
  const [aiInput, setAiInput] = React.useState("");
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [currentActiveAi, setCurrentActiveAi] = React.useState<string>("OpenRouter AI (Pool Acak)");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Halo! Saya Asisten AI Global Maps. Tanya apa saja seputar lokasi dunia, koordinat, atau minta saya mengarahkan peta ke tempat tertentu.",
      timestamp: "Baru saja",
      configName: "Global Maps AI",
    },
  ]);
  const chatScrollRef = React.useRef<HTMLDivElement>(null);

  // Toast / Status notification banner
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const activeBasemap = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId) || BASEMAP_OPTIONS[0];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  // Load initial active AI model name
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

  // Auto scroll chat to bottom when message arrives
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Superfast Location Geocoding Search (150ms debounce + In-Memory Cache + AbortController)
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      const resetTimer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    if (searchCacheRef.current.has(trimmed.toLowerCase())) {
      const cached = searchCacheRef.current.get(trimmed.toLowerCase())!;
      setSearchResults(cached);
      setIsSearching(false);
      setIsSearchOpen(true);
      return;
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const localMatches: SearchResultItem[] = [];
        const localRef = findLocalReference(trimmed);
        if (localRef) {
          localMatches.push({
            id: `local-${localRef.name}`,
            name: localRef.name,
            subtitle: localRef.description,
            lat: localRef.lat,
            lng: localRef.lng,
            zoom: localRef.zoom,
          });
        }

        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=6&lang=id`;
        const res = await fetch(photonUrl, { signal: controller.signal });

        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const mapped: SearchResultItem[] = data.features.map((f: PhotonFeature, idx: number) => {
              const p = f.properties || {};
              const name = p.name || p.street || p.city || "Lokasi Ditemukan";
              const sub = [p.street, p.district, p.city, p.state, p.country]
                .filter(Boolean)
                .join(", ");
              const typeStr = p.type || p.osm_value || "";
              return {
                id: `loc-${idx}-${f.geometry.coordinates[0]}`,
                name,
                subtitle: sub || "Koordinat Peta Dunia",
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
                zoom: getSmartZoomLevel(typeStr, 14),
              };
            });
            const combined = [...localMatches, ...mapped.filter((m) => m.name !== localRef?.name)];
            searchCacheRef.current.set(trimmed.toLowerCase(), combined);
            setSearchResults(combined);
            setIsSearching(false);
            setIsSearchOpen(true);
            return;
          }
        }

        // Fallback to OSM Nominatim
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          trimmed
        )}&format=json&addressdetails=1&limit=5`;
        const nomRes = await fetch(nomUrl, {
          headers: {
            "Accept-Language": "id,en",
            "User-Agent": "GlobalMapsStudioSearch/1.0",
          },
          signal: controller.signal,
        });
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          const mapped: SearchResultItem[] = nomData.map((item: NominatimFeature) => ({
            id: `nom-${item.place_id}`,
            name: item.name || item.display_name.split(",")[0],
            subtitle: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            zoom: getSmartZoomLevel(item.type || item.class || "", 14),
          }));
          const combined = [...localMatches, ...mapped.filter((m) => m.name !== localRef?.name)];
          searchCacheRef.current.set(trimmed.toLowerCase(), combined);
          setSearchResults(combined);
          setIsSearchOpen(true);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.warn("Pencarian lokasi:", err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Helper deteksi format koordinat angka
  const detectedCoords = React.useMemo(() => {
    return parseCoordinates(searchQuery);
  }, [searchQuery]);

  // Handle Select Search Result (Direct Map + Background AI preparation)
  const handleSelectSearchResult = async (item: SearchResultItem) => {
    const targetZoom = item.zoom || getSmartZoomLevel(item.name, 14);
    setTargetLocation({
      lat: item.lat,
      lng: item.lng,
      zoom: targetZoom,
      title: item.name,
      subtitle: item.subtitle,
    });
    setSearchQuery(item.name);
    setIsSearchOpen(false);
    showToast(`Menuju ke: ${item.name}`);

    // Jalankan penjelasan AI di belakang layar
    try {
      const res = await fetch("/api/ai-global-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Berikan informasi ringkas tentang lokasi ${item.name} (${item.subtitle}), koordinat geografisnya, dan fakta pentingnya.`,
          context: {
            activeBasemap: activeBasemap.name,
            centerLat: item.lat,
            centerLng: item.lng,
            zoom: targetZoom,
            userLocation: userLocation,
            cursorCoords: cursorCoords,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.usedModel) {
          setCurrentActiveAi(data.usedModel);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId("top-user"),
            sender: "user",
            text: `Informasi lokasi: ${item.name}`,
            timestamp: getFormattedTime(),
          },
          {
            id: createMessageId("top-ai"),
            sender: "ai",
            text: data.reply || `Informasi mengenai ${item.name} di koordinat Lat ${item.lat}, Lng ${item.lng}.`,
            timestamp: getFormattedTime(),
            modelName: data.usedModel,
            configName: data.usedConfigName,
            action: {
              type: "fly_to",
              param: `${item.lat},${item.lng},${targetZoom}`,
              label: item.name,
            },
          },
        ]);
      }
    } catch {
      // Background AI silent fail
    }
  };

  const handleSelectMap = React.useCallback((id: string) => {
    setActiveBasemapId(id);
    const selected = BASEMAP_OPTIONS.find((b) => b.id === id);
    if (selected) {
      showToast(`Gaya peta: ${selected.name}`);
    }
  }, []);

  const handleLocateUser = React.useCallback(() => {
    if (!navigator.geolocation) {
      showToast("Geolokasi tidak didukung oleh browser Anda");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const coords = { lat: Number(latitude.toFixed(5)), lng: Number(longitude.toFixed(5)) };
        setUserLocation(coords);
        showToast(`Lokasi GPS terdeteksi: ${coords.lat}, ${coords.lng}`);
      },
      (err) => {
        console.warn("GPS error:", err);
        showToast("Gagal mendeteksi lokasi. Pastikan izin GPS aktif.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleResetView = React.useCallback(() => {
    setTargetLocation({
      lat: -0.7893,
      lng: 113.9213,
      zoom: 5,
    });
    showToast("Pandangan peta dikembalikan ke Indonesia");
  }, []);

  const handleCopyCoords = () => {
    const text = `${mapCenter.lat.toFixed(5)}, ${mapCenter.lng.toFixed(5)}`;
    navigator.clipboard.writeText(text);
    showToast(`Koordinat disalin: ${text}`);
  };

  // AI Action Execution Parser
  const parseAndExecuteAiAction = React.useCallback((actionStr: string) => {
    const match = actionStr.match(/\[ACTION:(fly_to|set_basemap|locate_user|reset_indonesia):([^:]+):([^\]]+)\]/i);
    if (!match) return null;

    const [, type, param, label] = match;

    const execute = () => {
      if (type === "fly_to") {
        const parts = param.split(",");
        const lat = parseFloat(parts[0]);
        const lng = parseFloat(parts[1]);
        const zoom = parts[2] ? parseInt(parts[2], 10) : 15;
        if (!isNaN(lat) && !isNaN(lng)) {
          setTargetLocation({ lat, lng, zoom, title: label });
          showToast(`AI Mengarahkan ke ${label}`);
        }
      } else if (type === "set_basemap") {
        handleSelectMap(param);
      } else if (type === "locate_user") {
        handleLocateUser();
      } else if (type === "reset_indonesia") {
        handleResetView();
      }
    };

    return {
      type: type as "fly_to" | "set_basemap" | "locate_user" | "reset_indonesia",
      param,
      label,
      execute,
    };
  }, [handleSelectMap, handleLocateUser, handleResetView]);

  // Handle AI Search from Top Search Bar (Background AI + Auto map direct)
  const handleAiSearchTopBar = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    // Jika format koordinat langsung
    if (detectedCoords) {
      setTargetLocation({
        lat: detectedCoords.lat,
        lng: detectedCoords.lng,
        zoom: 16,
        title: `Titik (${detectedCoords.lat}, ${detectedCoords.lng})`,
      });
      setIsSearchOpen(false);
      showToast(`Mengarahkan ke koordinat: ${detectedCoords.lat}, ${detectedCoords.lng}`);
      return;
    }

    setIsSearchOpen(false);
    setIsSearching(true);
    showToast(`Mencari lokasi: "${q}"...`);

    try {
      const res = await fetch("/api/ai-global-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Cari dan arahkan peta ke lokasi, kota, koordinat, atau tempat ini: "${q}". Berikan informasi koordinatnya.`,
          context: {
            activeBasemap: activeBasemap.name,
            centerLat: mapCenter.lat,
            centerLng: mapCenter.lng,
            zoom: mapCenter.zoom,
            userLocation: userLocation,
            cursorCoords: cursorCoords,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.usedModel) {
          setCurrentActiveAi(data.usedModel);
        }

        if (data.action && data.action.type === "fly_to") {
          const parts = data.action.param.split(",");
          const lat = parseFloat(parts[0]);
          const lng = parseFloat(parts[1]);
          const zoom = parts[2] ? parseInt(parts[2], 10) : 15;
          if (!isNaN(lat) && !isNaN(lng)) {
            setTargetLocation({ lat, lng, zoom, title: data.action.label || q });
          }
        }

        // Simpan jawaban di percakapan AI Bot
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId("top-user"),
            sender: "user",
            text: `Pencarian: ${q}`,
            timestamp: getFormattedTime(),
          },
          {
            id: createMessageId("top-ai"),
            sender: "ai",
            text: data.reply || `Menemukan lokasi ${q}`,
            timestamp: getFormattedTime(),
            modelName: data.usedModel,
            configName: data.usedConfigName,
            action: data.action
              ? {
                  type: data.action.type,
                  param: data.action.param,
                  label: data.action.label,
                }
              : undefined,
          },
        ]);

        showToast(data.reply || `Ditemukan: ${q}`);
      } else {
        showToast(data.error || "Pencarian AI tidak menemukan hasil.");
      }
    } catch {
      showToast("Gagal melakukan pencarian AI.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle AI Send Message from Slide-in Left AI Drawer
  const handleSendAiMessage = async (textToSend?: string) => {
    const q = (textToSend || aiInput).trim();
    if (!q || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: createMessageId("user"),
      sender: "user",
      text: q,
      timestamp: getFormattedTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setAiInput("");
    setIsAiLoading(true);

    try {
      const res = await fetch("/api/ai-global-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          context: {
            activeBasemap: activeBasemap.name,
            centerLat: mapCenter.lat,
            centerLng: mapCenter.lng,
            zoom: mapCenter.zoom,
            userLocation: userLocation,
            cursorCoords: cursorCoords,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.reply) {
        if (data.usedModel) {
          setCurrentActiveAi(data.usedModel);
        }

        let cleanText = data.reply;
        let actionObj: ChatMessage["action"] | undefined = undefined;

        if (data.action) {
          actionObj = {
            type: data.action.type,
            param: data.action.param,
            label: data.action.label,
          };
          cleanText = data.reply;

          // Auto-execute the action for instant smooth interaction!
          if (data.rawReply) {
            const parsed = parseAndExecuteAiAction(data.rawReply);
            if (parsed) {
              setTimeout(() => {
                parsed.execute();
              }, 200);
            }
          }
        }

        const aiMsg: ChatMessage = {
          id: createMessageId("ai"),
          sender: "ai",
          text: cleanText || "Aksi telah dijalankan pada peta.",
          timestamp: getFormattedTime(),
          modelName: data.usedModel,
          configName: data.usedConfigName,
          action: actionObj,
        };

        setMessages((prev) => [...prev, aiMsg]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: createMessageId("ai-err"),
            sender: "ai",
            text: data.error || "Maaf, terjadi kendala saat memproses pertanyaan Anda.",
            timestamp: getFormattedTime(),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId("ai-err"),
          sender: "ai",
          text: "Gagal terhubung ke layanan AI. Pastikan koneksi internet aktif.",
          timestamp: getFormattedTime(),
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex relative selection:bg-primary/20 selection:text-primary">
      {/* ========================================================================= */}
      {/* 1. TOP FLOATING NAVIGATION BAR (HEADERLESS & SEAMLESS CONTROLS)            */}
      {/* ========================================================================= */}
      <div className="absolute top-3 sm:top-4 inset-x-3 sm:inset-x-4 z-30 pointer-events-none flex items-center justify-between gap-2.5">
        {/* Left Actions: Back to Home + AI Bot Trigger Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/"
            className="h-10 px-3.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/90 hover:border-zinc-400 hover:bg-card text-foreground shadow-lg flex items-center gap-2 text-xs sm:text-sm font-semibold transition-all duration-200 group cursor-pointer"
            title="Kembali ke Halaman Beranda"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span>Beranda</span>
          </Link>

          {/* AI Bot Trigger next to Back button */}
          <button
            type="button"
            onClick={() => setIsAiOpen(!isAiOpen)}
            className={`h-10 px-3.5 rounded-xl border backdrop-blur-md shadow-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              isAiOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/90 text-foreground border-border/90 hover:border-zinc-400 hover:bg-card"
            }`}
            title="Buka Asisten AI Global Maps"
          >
            <Bot className="w-4 h-4 text-inherit shrink-0" />
            <span className="hidden sm:inline">Asisten AI</span>
            <span className="sm:hidden">AI</span>
            <Zap className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
          </button>
        </div>

        {/* Center: Superfast Location & Background AI Search Bar */}
        <div ref={searchContainerRef} className="pointer-events-auto relative w-full max-w-xs sm:max-w-md mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                handleAiSearchTopBar(searchQuery);
              }
            }}
            className="relative flex items-center"
          >
            <Search className="w-4 h-4 absolute left-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setIsSearchOpen(true);
                }
              }}
              placeholder="Cari lokasi, kota, koordinat..."
              className="w-full h-10 pl-10 pr-16 bg-card/90 backdrop-blur-md border border-border/90 hover:border-zinc-400 focus:border-primary rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground shadow-lg transition-all duration-200 focus:outline-none focus:bg-card"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setIsSearchOpen(false);
                  }}
                  className="w-6 h-6 rounded-md text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer transition-colors"
                  title="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (searchQuery.trim()) {
                    handleAiSearchTopBar(searchQuery);
                  }
                  setIsAiOpen(true);
                }}
                disabled={isSearching}
                className="h-7 px-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                title="Buka Jawaban AI Bot"
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="hidden xs:inline">AI</span>
              </button>
            </div>
          </form>

          {/* Search Dropdown Results (Hanya muncul jika input >= 2 karakter) */}
          {isSearchOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute top-12 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-border/60 max-h-84 overflow-y-auto">
              {/* Option 0: Direct Coordinate Detected */}
              {detectedCoords && (
                <button
                  type="button"
                  onClick={() => {
                    setTargetLocation({
                      lat: detectedCoords.lat,
                      lng: detectedCoords.lng,
                      zoom: 16,
                      title: `Titik (${detectedCoords.lat}, ${detectedCoords.lng})`,
                    });
                    setIsSearchOpen(false);
                    showToast(`Arahkan ke koordinat: ${detectedCoords.lat}, ${detectedCoords.lng}`);
                  }}
                  className="w-full text-left px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-colors flex items-center justify-between gap-2.5 cursor-pointer border-b border-blue-500/20 group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Compass className="w-4 h-4 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold truncate">
                        Arahkan ke Koordinat: {detectedCoords.lat}, {detectedCoords.lng}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Koordinat angka presisi pada peta dunia
                      </div>
                    </div>
                  </div>
                  <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                </button>
              )}

              {/* Geocoding Location Matches */}
              {isSearching && searchResults.length === 0 ? (
                <div className="p-3 space-y-2">
                  <Skeleton className="h-5 w-full rounded-md" />
                  <Skeleton className="h-5 w-4/5 rounded-md" />
                  <Skeleton className="h-5 w-3/5 rounded-md" />
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="px-3.5 py-1.5 bg-secondary text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Lokasi Ditemukan</span>
                    <span>{searchResults.length} Hasil</span>
                  </div>
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-secondary/70 transition-colors flex items-start gap-2.5 cursor-pointer group"
                    >
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground space-y-1">
                  <div>Lokasi standar tidak ditemukan.</div>
                  <div className="text-[11px] text-primary font-medium">
                    Gunakan tombol &ldquo;Tanya & Arahkan AI&rdquo; di atas untuk pencarian cerdas.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Layer Switcher Trigger & Settings */}
        <div className="pointer-events-auto flex items-center gap-2">
          <Button
            type="button"
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
              if (isAiOpen) setIsAiOpen(false);
            }}
            className={`h-10 px-3.5 rounded-xl border backdrop-blur-md shadow-lg text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
              isSidebarOpen
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card/90 text-foreground border-border/90 hover:border-zinc-400 hover:bg-card"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline truncate max-w-32">{activeBasemap.name}</span>
            <span className="sm:hidden">Peta</span>
          </Button>

          <div className="rounded-xl shadow-lg bg-card/90 backdrop-blur-md border border-border/90">
            <SettingsSheet />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SIDEBAR PANEL: GAYA TAMPILAN PETA (CLEAN LIST ONLY)                     */}
      {/* ========================================================================= */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:absolute top-16 sm:top-18 md:top-20 bottom-16 sm:bottom-18 left-3 sm:left-4 z-40 w-[calc(100vw-1.5rem)] sm:w-84 md:w-92 max-w-md bg-card/95 backdrop-blur-xl border border-border/90 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
          isSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full md:translate-x-[-110%] opacity-0 pointer-events-none"
        }`}
      >
        {/* Panel Header */}
        <div className="p-3.5 sm:p-4 border-b border-border/80 flex items-center justify-between shrink-0 bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
              <MapIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">
                Gaya Tampilan Peta
              </h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsSidebarOpen(false)}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            title="Tutup Panel"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Clean Basemap List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {BASEMAP_OPTIONS.map((mapOption: BasemapOption) => {
            const isSelected = activeBasemapId === mapOption.id;

            return (
              <div
                key={mapOption.id}
                onClick={() => handleSelectMap(mapOption.id)}
                className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer group ${
                  isSelected
                    ? "border-primary bg-card ring-1.5 ring-primary shadow-sm"
                    : "border-border/80 bg-card hover:border-zinc-400 hover:bg-secondary/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: mapOption.previewColor }}
                    />
                    <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors truncate">
                      {mapOption.name}
                    </span>
                  </div>
                  {isSelected ? (
                    <Badge className="text-[10px] font-mono bg-primary text-primary-foreground h-5 px-2 font-semibold rounded-full shrink-0 flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 stroke-3" />
                      <span>Aktif</span>
                    </Badge>
                  ) : (
                    <span className="text-[10px] uppercase font-mono font-semibold text-muted-foreground bg-secondary px-1.5 py-0.5 rounded border border-border shrink-0">
                      {mapOption.type}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-4.5">
                  {mapOption.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Panel Footer */}
        <div className="p-3 border-t border-border/80 bg-card text-center text-[11px] text-muted-foreground shrink-0 font-mono">
          Layer Aktif: <span className="font-semibold text-foreground">{activeBasemap.name}</span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. SLIDE-IN LEFT AI ASSISTANT BOT PANEL (ANIMASI BUKA DARI SEBELAH KIRI)  */}
      {/* ========================================================================= */}
      {isAiOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsAiOpen(false)}
        />
      )}

      <aside
        className={`fixed md:absolute top-16 sm:top-18 md:top-20 bottom-16 sm:bottom-18 left-3 sm:left-4 z-40 w-[calc(100vw-1.5rem)] sm:w-92 md:w-96 max-w-md bg-card/95 backdrop-blur-xl border border-border/90 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
          isAiOpen ? "translate-x-0 opacity-100" : "-translate-x-full md:translate-x-[-110%] opacity-0 pointer-events-none"
        }`}
      >
        {/* Chat Header */}
        <div className="p-3.5 border-b border-border/80 flex items-start justify-between bg-secondary/40 shrink-0">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs sm:text-sm text-foreground">
                Asisten AI Global Maps
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">
                Pencarian & Kontrol Peta Pintar
              </div>
              {/* Badge Model AI Simple di bawah deskripsi judul */}
              <div className="mt-1.5 flex items-center">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/25 text-[10px] font-mono font-semibold text-primary shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="truncate max-w-[210px] sm:max-w-[250px]">{currentActiveAi || "OpenRouter AI"}</span>
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsAiOpen(false)}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0 -mr-1 -mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Message Scroller */}
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 text-xs min-h-60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {m.sender === "ai" && (
                <div className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`max-w-[84%] space-y-1.5 ${m.sender === "user" ? "text-right" : "text-left"}`}>
                <div
                  className={`p-2.5 rounded-xl leading-relaxed ${
                    m.sender === "user"
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                      : "bg-secondary/70 border border-border text-foreground rounded-tl-xs whitespace-pre-line"
                  }`}
                >
                  {m.text ? m.text.replace(/\*\*/g, "").replace(/\*/g, "") : ""}
                </div>

                {/* Interactive AI Action Button */}
                {m.action && (
                  <button
                    type="button"
                    onClick={() => {
                      if (m.action?.type === "fly_to") {
                        const parts = m.action.param.split(",");
                        setTargetLocation({
                          lat: parseFloat(parts[0]),
                          lng: parseFloat(parts[1]),
                          zoom: parts[2] ? parseInt(parts[2], 10) : 15,
                        });
                        showToast(`Menuju ke ${m.action.label}`);
                      } else if (m.action?.type === "set_basemap") {
                        handleSelectMap(m.action.param);
                      } else if (m.action?.type === "locate_user") {
                        handleLocateUser();
                      } else if (m.action?.type === "reset_indonesia") {
                        handleResetView();
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                  >
                    <Navigation className="w-3 h-3 shrink-0" />
                    <span>{m.action.label}</span>
                  </button>
                )}

                <div className="text-[9px] text-muted-foreground font-mono">{m.timestamp}</div>
              </div>
              {m.sender === "user" && (
                <div className="w-6 h-6 rounded-md bg-secondary text-foreground border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {isAiLoading && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-2.5 rounded-xl bg-secondary/70 border border-border max-w-[80%] space-y-1.5">
                <Skeleton className="h-3 w-36 rounded" />
                <Skeleton className="h-3 w-28 rounded" />
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Chips (Cek Lokasi Saya & Ganti Peta) */}
        <div className="px-3 py-2 bg-secondary/40 border-t border-border/70 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleLocateUser();
                handleSendAiMessage("Periksa dan beritahukan koordinat lokasi GPS saya saat ini");
              }}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-card hover:bg-secondary border border-border hover:border-zinc-400 text-[11px] font-semibold text-foreground flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs group"
            >
              <Crosshair className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform shrink-0" />
              <span>Cek Lokasi Saya</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiMapListOpen(!isAiMapListOpen)}
              className={`flex-1 py-1.5 px-2.5 rounded-lg border text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isAiMapListOpen
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-secondary border-border hover:border-zinc-400 text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Ganti Peta</span>
            </button>
          </div>

          {/* Dropdown List saat "Ganti Peta" ditekan */}
          {isAiMapListOpen && (
            <div className="mt-1 p-2 rounded-xl bg-card border border-border/90 shadow-lg space-y-1 max-h-48 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 pb-1">
                Pilih Gaya Peta:
              </div>
              {BASEMAP_OPTIONS.map((m) => {
                const isSelected = activeBasemapId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      handleSelectMap(m.id);
                      setIsAiMapListOpen(false);
                      handleSendAiMessage(`Ganti gaya peta ke ${m.name}`);
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : "hover:bg-secondary/80 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: m.previewColor }}
                      />
                      <span className="truncate">{m.name}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Chat Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendAiMessage();
          }}
          className="p-2.5 border-t border-border/80 bg-card flex items-center gap-1.5 shrink-0"
        >
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder="Tanya asisten AI peta..."
            disabled={isAiLoading}
            className="flex-1 h-8 pl-3 pr-2 text-xs rounded-lg bg-background border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground transition-colors"
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={!aiInput.trim() || isAiLoading}
            className="h-8 w-8 rounded-lg shrink-0 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
          </Button>
        </form>
      </aside>

      {/* ========================================================================= */}
      {/* 4. MAIN MAP VIEWPORT                                                      */}
      {/* ========================================================================= */}
      <main className="w-full h-full relative overflow-hidden bg-background">
        <LeafletGlobalMap
          activeBasemapId={activeBasemapId}
          targetLocation={targetLocation}
          userLocation={userLocation}
          onMapCenterChange={setMapCenter}
          onCursorMove={setCursorCoords}
          className="w-full h-full"
        />

        {/* ========================================================================= */}
        {/* 5. LIVE COORDINATES PILL (BOTTOM LEFT)                                    */}
        {/* ========================================================================= */}
        <div className="absolute left-3 sm:left-4 bottom-3 sm:bottom-4 z-20 pointer-events-none flex items-center gap-2">
          {/* Live Center Coordinates Pill */}
          <div
            onClick={handleCopyCoords}
            className="pointer-events-auto px-3 py-1.5 rounded-xl bg-card/90 backdrop-blur-md border border-border/90 shadow-lg flex items-center gap-2 text-xs text-foreground font-mono cursor-pointer hover:border-zinc-400 transition-all duration-200 group"
            title="Klik untuk menyalin koordinat tengah peta"
          >
            <Compass className="w-3.5 h-3.5 text-primary shrink-0 group-hover:rotate-45 transition-transform" />
            <span>
              {mapCenter.lat >= 0 ? `${mapCenter.lat}° N` : `${Math.abs(mapCenter.lat)}° S`},{" "}
              {mapCenter.lng >= 0 ? `${mapCenter.lng}° E` : `${Math.abs(mapCenter.lng)}° W`}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-muted-foreground">Z: {mapCenter.zoom}</span>
            <Copy className="w-3 h-3 text-muted-foreground group-hover:text-primary shrink-0 transition-colors ml-0.5" />
          </div>

          {cursorCoords && (
            <div className="hidden lg:flex pointer-events-auto px-2.5 py-1.5 rounded-xl bg-card/85 backdrop-blur-md border border-border/80 shadow-md text-[11px] text-muted-foreground font-mono items-center gap-1.5">
              <span className="text-foreground font-semibold">Kursor:</span>
              <span>{cursorCoords.lat}, {cursorCoords.lng}</span>
            </div>
          )}
        </div>

        {/* Alert Notification Toast Banner */}
        {toastMessage && (
          <div className="absolute top-18 sm:top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-top-3 duration-200 max-w-sm w-full px-4">
            <Alert variant="default" className="shadow-2xl backdrop-blur-md bg-card/95 border-border py-2.5 px-3.5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0 static transform-none" />
              <AlertDescription className="text-xs sm:text-sm font-medium text-foreground m-0 p-0">
                {toastMessage}
              </AlertDescription>
            </Alert>
          </div>
        )}
      </main>
    </div>
  );
}

