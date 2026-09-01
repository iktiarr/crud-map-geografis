"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { 
  Globe2, 
  Check, 
  Map as MapIcon, 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { BASEMAP_OPTIONS } from "@/components/map/basemap-config";

// Dynamic import for Leaflet map component with clean Skeleton fallback
const LeafletGlobalMap = dynamic(
  () => import("@/components/map/leaflet-global-map").then((mod) => mod.LeafletGlobalMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center max-w-xs w-full space-y-3 text-center">
          <Skeleton className="w-14 h-14 rounded-xl" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-3.5 w-56" />
        </div>
      </div>
    ),
  }
);

export default function GlobalMapsPage() {
  const [activeBasemapId, setActiveBasemapId] = React.useState("osm-standard");
  const activeBasemap = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId) || BASEMAP_OPTIONS[0];

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
      {/* Top Navigation Header */}
      <SiteHeader
        title="Global Maps Explorer"
        icon={Globe2}
        badge={activeBasemap.name}
      />

      {/* Main Viewport Container */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* =========================================================================
         * SLIM FIXED SIDEBAR PANEL (HIGH READABILITY & MIN 12PX TEXT)
         * ========================================================================= */}
        <aside className="w-72 sm:w-76 h-full bg-card border-r border-border/80 flex flex-col shrink-0 z-10 shadow-sm">
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <MapIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  Jenis Tampilan Peta
                </h3>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-mono h-5 px-2 rounded-md">
              {BASEMAP_OPTIONS.length} Peta
            </Badge>
          </div>

          {/* Clean List of Basemaps */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {BASEMAP_OPTIONS.map((mapOption) => {
              const isSelected = activeBasemapId === mapOption.id;

              return (
                <div
                  key={mapOption.id}
                  onClick={() => setActiveBasemapId(mapOption.id)}
                  className={`p-3 rounded-xl border transition-colors cursor-pointer group ${
                    isSelected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-xs"
                      : "border-border/80 bg-card hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: mapOption.previewColor }}
                      />
                      <span className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors">
                        {mapOption.name}
                      </span>
                    </div>
                    {isSelected ? (
                      <Badge className="text-xs bg-primary text-primary-foreground h-4.5 px-1.5 font-medium rounded-md shrink-0">
                        <Check className="w-2.5 h-2.5 mr-0.5" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground font-normal h-4.5 px-1.5 rounded-md shrink-0">
                        {mapOption.type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-4.5">
                    {mapOption.description}
                  </p>
                </div>
              );
            })}
          </div>
        </aside>

        {/* =========================================================================
         * FULL LEAFLET MAP VIEWPORT
         * ========================================================================= */}
        <main className="flex-1 h-full relative bg-background overflow-hidden">
          {/* Pure Leaflet Interactive Map */}
          <LeafletGlobalMap
            activeBasemapId={activeBasemapId}
            className="w-full h-full"
          />
        </main>
      </div>
    </div>
  );
}
