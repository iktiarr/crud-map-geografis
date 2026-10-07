"use client";

import * as React from "react";
import { Search, MapPin, X, Loader2, Plus, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SearchPlaceResult {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lng: number;
}

interface PencarianLokasiProps {
  onSelectLocation?: (lat: number, lng: number, name: string) => void;
  onAddWaypointDirectly?: (lat: number, lng: number, name: string) => void;
  isAddMode?: boolean;
}

export function PencarianLokasi({
  onSelectLocation,
  onAddWaypointDirectly,
  isAddMode = false,
}: PencarianLokasiProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<SearchPlaceResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounce pencarian tempat
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      const resetTimer = setTimeout(() => {
        setResults([]);
        setIsLoading(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Coba Photon API (Komoot OpenStreetMap search, cepat dan relevan)
        const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
          query.trim()
        )}&limit=6&lang=id`;
        const res = await fetch(photonUrl);

        if (res.ok) {
          const data = await res.json();
          if (data.features && data.features.length > 0) {
            const mapped: SearchPlaceResult[] = data.features.map((f: any, idx: number) => {
              const p = f.properties || {};
              const name = p.name || p.street || p.city || "Lokasi Ditemukan";
              const sub = [p.street, p.district, p.city, p.state, p.country]
                .filter(Boolean)
                .join(", ");
              return {
                id: `loc-${idx}-${f.geometry.coordinates[0]}`,
                name,
                subtitle: sub || "Koordinat Peta",
                lat: f.geometry.coordinates[1],
                lng: f.geometry.coordinates[0],
              };
            });
            setResults(mapped);
            setIsLoading(false);
            setIsOpen(true);
            return;
          }
        }

        // Fallback ke OSM Nominatim jika Photon tidak menghasilkan data
        const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query.trim()
        )}&format=json&addressdetails=1&limit=5`;
        const nomRes = await fetch(nomUrl, {
          headers: {
            "Accept-Language": "id,en",
            "User-Agent": "GlobalStudioGeographicSearch/1.0",
          },
        });
        if (nomRes.ok) {
          const nomData = await nomRes.json();
          const mapped: SearchPlaceResult[] = nomData.map((item: any) => ({
            id: `nom-${item.place_id}`,
            name: item.name || item.display_name.split(",")[0],
            subtitle: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          }));
          setResults(mapped);
        }
      } catch (err) {
        console.warn("Pencarian lokasi:", err);
      } finally {
        setIsLoading(false);
        setIsOpen(true);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  // Klik di luar dropdown untuk menutup
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handlePick = (item: SearchPlaceResult, action: "view" | "add") => {
    if (action === "add" && onAddWaypointDirectly) {
      onAddWaypointDirectly(item.lat, item.lng, item.name);
      setIsOpen(false);
    } else if (onSelectLocation) {
      onSelectLocation(item.lat, item.lng, item.name);
      // Saat aksi "view", dropdown tetap terbuka agar pengguna bisa mengecek lokasi lain
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-1 z-30">
      <div className="flex items-center justify-between px-0.5">
        <label className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
          <Search className="w-3 h-3 text-primary" />
          <span>Cari Lokasi Anda</span>
        </label>
      </div>

      {/* Input Search Bar */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted-foreground pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Cari jalan, tempat, gedung, kota..."
          className="w-full h-9 pl-9 pr-8 rounded-xl bg-background border border-border text-foreground text-xs placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-2xs"
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Dropdown Hasil Pencarian */}
      {isOpen && (query.trim().length >= 2 || results.length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto divide-y divide-border/60">
          {isLoading && results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Mencari lokasi di seluruh peta...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Tidak ada lokasi yang cocok dengan kata kunci.
            </div>
          ) : (
            results.map((item) => (
              <div
                key={item.id}
                className="p-2.5 hover:bg-secondary/60 transition-colors flex items-center justify-between gap-2.5 group"
              >
                <div
                  className="min-w-0 flex-1 cursor-pointer flex items-start gap-2.5"
                  onClick={() => handlePick(item, "view")}
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-2xs">
                    <MapPin className="w-3.5 h-3.5 text-inherit" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={() => handlePick(item, "view")}
                    className="h-7 w-7 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary transition-all shadow-2xs"
                    title="Lihat / Arahkan peta ke tempat ini"
                  >
                    <Navigation className="w-3.5 h-3.5 text-primary" />
                  </Button>

                  {isAddMode && onAddWaypointDirectly && (
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => handlePick(item, "add")}
                      className="h-7 w-7 rounded-lg cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-2xs"
                      title="Tambah lokasi ini sebagai titik rute baru"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
