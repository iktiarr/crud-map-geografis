"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ChevronRight, Loader2 } from "lucide-react";
import { TraversedRoadRecord, WaypointItem, LineStyle } from "../tipe";

// Dynamic import Leaflet map (non-SSR)
const LeafletTraversedRoadsMap = dynamic(
  () =>
    import("@/components/map/leaflet-traversed-roads-map").then(
      (m) => m.LeafletTraversedRoadsMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-xs font-mono">Memuat Peta Geografis Leaflet...</span>
      </div>
    ),
  }
);

interface PetaRuteProps {
  isSidePanelOpen: boolean;
  onOpenSidePanel: () => void;
  routes: TraversedRoadRecord[];
  waypoints: WaypointItem[];
  draftPathCoordinates: [number, number][];
  customColor: string;
  customWeight: number;
  customOpacity: number;
  customLineStyle: LineStyle;
  isAddPointMode: boolean;
  onMapClickAddWaypoint: (lat: number, lng: number) => void;
  onWaypointDragEnd: (index: number, lat: number, lng: number) => void;
  basemapId: string;
  focusedRouteId: number | null;
  onRouteClick: (route: TraversedRoadRecord) => void;
}

export function PetaRute({
  isSidePanelOpen,
  onOpenSidePanel,
  routes,
  waypoints,
  draftPathCoordinates,
  customColor,
  customWeight,
  customOpacity,
  customLineStyle,
  isAddPointMode,
  onMapClickAddWaypoint,
  onWaypointDragEnd,
  basemapId,
  focusedRouteId,
  onRouteClick,
}: PetaRuteProps) {
  return (
    <main className="flex-1 h-full w-full relative overflow-hidden bg-muted/10">
      {/* Floating Button to Re-Open Side Panel (When Collapsed) */}
      {!isSidePanelOpen && (
        <button
          type="button"
          onClick={onOpenSidePanel}
          className="absolute top-4 left-4 z-30 p-2.5 rounded-lg bg-card/90 backdrop-blur-md border border-border shadow-lg text-foreground hover:bg-muted transition-all flex items-center gap-2 font-semibold text-xs cursor-pointer"
          title="Buka Panel Pemetaan"
        >
          <ChevronRight className="w-4 h-4 text-primary" />
          <span>Buka Panel Rute</span>
        </button>
      )}

      {/* Interactive Leaflet Map */}
      <LeafletTraversedRoadsMap
        routes={routes}
        waypoints={waypoints}
        draftPathCoordinates={draftPathCoordinates}
        customColor={customColor}
        customWeight={customWeight}
        customOpacity={customOpacity}
        customLineStyle={customLineStyle}
        isAddPointMode={isAddPointMode}
        onMapClickAddPoint={onMapClickAddWaypoint}
        onWaypointDragEnd={onWaypointDragEnd}
        activeBasemapId={basemapId}
        focusedRouteId={focusedRouteId}
        onSelectRoute={onRouteClick}
      />
    </main>
  );
}
