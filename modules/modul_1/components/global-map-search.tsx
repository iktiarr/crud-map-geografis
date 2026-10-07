"use client";

import * as React from "react";
import { Search, Loader2, MapPin, X } from "lucide-react";
import type { SearchResultItem } from "../types";

interface GlobalMapSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResultItem[];
  isSearching: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  onSelectResult: (item: SearchResultItem) => void;
  onSubmitSearch?: (query: string) => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function GlobalMapSearch({
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  isSearchOpen,
  setIsSearchOpen,
  onSelectResult,
  onSubmitSearch,
  searchContainerRef,
}: GlobalMapSearchProps) {
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSubmitSearch?.(searchQuery.trim());
      setIsSearchOpen(false);
    }
  };

  return (
    <div ref={searchContainerRef} className="relative flex-1 w-full min-w-0">
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => {
            if (searchResults.length > 0) setIsSearchOpen(true);
          }}
          placeholder="Cari disini..."
          className="w-full h-10 pl-10 pr-16 rounded-xl border border-border bg-card/95 backdrop-blur-md text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary shadow-md transition-all"
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="w-5 h-5 rounded-full text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isSearching && (
            <Loader2 className="w-4 h-4 text-primary animate-spin pointer-events-none" />
          )}
        </div>
      </form>

      {/* Dropdown Results */}
      {isSearchOpen && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-3 py-1.5 bg-secondary/40 border-b border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              Ditemukan <strong className="text-foreground font-semibold">{searchResults.length}</strong> lokasi terdekat
            </span>
            <span className="text-[10px] text-primary font-medium hidden sm:inline">
              Tekan Enter untuk semua pin
            </span>
          </div>
          <div className="p-1.5 max-h-80 overflow-y-auto space-y-1 divide-y divide-border/40">
            {searchResults.map((item) => (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectResult(item);
                  setIsSearchOpen(false);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSelectResult(item);
                  setIsSearchOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectResult(item);
                    setIsSearchOpen(false);
                  }
                }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-secondary/90 text-foreground transition-colors flex items-start gap-2.5 group cursor-pointer"
              >
                <div className="p-1.5 rounded-md bg-primary/10 text-primary border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                      {item.name}
                    </span>
                    {item.distanceKm !== undefined && (
                      <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary border border-border/60 transition-colors shrink-0">
                        {item.distanceKm < 1
                          ? `${Math.round(item.distanceKm * 1000)} m`
                          : `${item.distanceKm.toFixed(1)} km`}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
