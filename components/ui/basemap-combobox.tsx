"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { BASEMAP_OPTIONS, type BasemapOption } from "@/components/map/basemap-config";

export interface BasemapComboboxProps {
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function BasemapCombobox({ value, onChange, className = "" }: BasemapComboboxProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const selectedMap =
    BASEMAP_OPTIONS.find((b) => b.id === value) || BASEMAP_OPTIONS[0];

  // Close when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const googleMaps = BASEMAP_OPTIONS.filter((b) => b.id.startsWith("google"));
  const esriMaps = BASEMAP_OPTIONS.filter((b) => b.id.startsWith("esri"));
  const otherMaps = BASEMAP_OPTIONS.filter(
    (b) => !b.id.startsWith("google") && !b.id.startsWith("esri")
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Combobox Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-background hover:bg-muted/60 border border-border/80 hover:border-primary/50 text-foreground transition-all shadow-2xs group focus:outline-hidden focus:ring-1 focus:ring-primary/30"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3 h-3 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: selectedMap.previewColor }}
          />
          <div className="text-left min-w-0">
            <div className="font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
              {selectedMap.name}
            </div>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-50 bg-popover/95 backdrop-blur-xl border border-border rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* List of Maps Grouped Directly (No Search, Simple & Clean) */}
          <div className="max-h-72 overflow-y-auto p-1.5 space-y-2">
            {/* 1. Google Maps Group */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">
                Google Maps ({googleMaps.length})
              </div>
              <div className="space-y-0.5">
                {googleMaps.map((map) => (
                  <BasemapItem
                    key={map.id}
                    map={map}
                    isSelected={map.id === value}
                    onSelect={() => handleSelect(map.id)}
                  />
                ))}
              </div>
            </div>

            {/* 2. ESRI ArcGIS Group */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono pt-1 border-t border-border/50">
                ESRI ArcGIS ({esriMaps.length})
              </div>
              <div className="space-y-0.5">
                {esriMaps.map((map) => (
                  <BasemapItem
                    key={map.id}
                    map={map}
                    isSelected={map.id === value}
                    onSelect={() => handleSelect(map.id)}
                  />
                ))}
              </div>
            </div>

            {/* 3. OpenStreetMap & Relief Group */}
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono pt-1 border-t border-border/50">
                OpenStreetMap & Relief ({otherMaps.length})
              </div>
              <div className="space-y-0.5">
                {otherMaps.map((map) => (
                  <BasemapItem
                    key={map.id}
                    map={map}
                    isSelected={map.id === value}
                    onSelect={() => handleSelect(map.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BasemapItem({
  map,
  isSelected,
  onSelect,
}: {
  map: BasemapOption;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center justify-between gap-2 p-2 rounded-lg text-left transition-all ${
        isSelected
          ? "bg-primary/10 text-primary border border-primary/30"
          : "hover:bg-muted/70 text-foreground border border-transparent"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
          style={{ backgroundColor: map.previewColor }}
        />
        <div className="min-w-0">
          <div className="font-bold text-xs truncate leading-tight">{map.name}</div>
          <div className="text-[10px] text-muted-foreground truncate">{map.description}</div>
        </div>
      </div>

      {isSelected && <Check className="w-4 h-4 text-primary shrink-0 stroke-[2.5]" />}
    </button>
  );
}
