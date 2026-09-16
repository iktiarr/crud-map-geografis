"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { 
  Globe2, 
  Check, 
  Map as MapIcon, 
  Layers,
  X,
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { BASEMAP_OPTIONS } from "@/components/map/basemap-config";

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
  const [activeBasemapId, setActiveBasemapId] = React.useState("google-hybrid");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = React.useState(false);
  const activeBasemap = BASEMAP_OPTIONS.find((b) => b.id === activeBasemapId) || BASEMAP_OPTIONS[0];

  const handleSelectMap = (id: string) => {
    setActiveBasemapId(id);
    setIsMobilePanelOpen(false);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-foreground flex flex-col">
      <SiteHeader
        title="Global Maps"
        icon={Globe2}
        badge={activeBasemap.name}
      />

      <div className="flex-1 relative flex overflow-hidden">
        {isMobilePanelOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-xs"
            onClick={() => setIsMobilePanelOpen(false)}
          />
        )}

        <aside
          className={`fixed md:relative top-16 md:top-0 bottom-0 left-0 z-40 md:z-10 w-72 sm:w-76 h-[calc(100%-4rem)] md:h-full bg-card border-r border-border/80 flex flex-col shrink-0 shadow-lg md:shadow-sm transition-transform duration-200 ${
            isMobilePanelOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
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
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsMobilePanelOpen(false)}
              className="md:hidden h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-3 border-b border-border/60">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all group"
            >
              <Home className="w-4 h-4 text-primary group-hover:scale-110 transition-transform shrink-0" />
              <span>Kembali ke Beranda</span>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {BASEMAP_OPTIONS.map((mapOption) => {
              const isSelected = activeBasemapId === mapOption.id;

              return (
                <div
                  key={mapOption.id}
                  onClick={() => handleSelectMap(mapOption.id)}
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

        <main className="flex-1 h-full relative bg-background overflow-hidden">
          <div className="md:hidden absolute top-3 left-3 z-30">
            <Button
              size="sm"
              onClick={() => setIsMobilePanelOpen(true)}
              className="rounded-xl shadow-lg text-xs font-semibold h-9 px-3 gap-1.5 bg-card/95 backdrop-blur-md text-foreground border border-border hover:bg-card hover:border-primary/50"
            >
              <Layers className="w-4 h-4 text-primary" />
              <span>Gaya Peta ({activeBasemap.name})</span>
            </Button>
          </div>

          <LeafletGlobalMap
            activeBasemapId={activeBasemapId}
            className="w-full h-full"
          />
        </main>
      </div>
    </div>
  );
}
