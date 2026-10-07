"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { ChevronRight, Loader2 } from "lucide-react";
import { 
  TraversedRoadRecord, 
  WaypointItem, 
  LineStyle,
  MarkerStyle,
  AlternativeRouteOption,
} from "../tipe";

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
  draftPathCoordinates: [number, number][] | [number, number][][];
  alternativeRoutes?: AlternativeRouteOption[];
  selectedAlternativeId?: string | null;
  onSelectAlternativeRoute?: (id: string | null) => void;
  customColor: string;
  customWeight: number;
  customOpacity: number;
  customLineStyle: LineStyle;
  markerStyle?: MarkerStyle;
  isAddPointMode: boolean;
  onMapClickAddWaypoint: (lat: number, lng: number) => void;
  onWaypointDragEnd: (index: number, lat: number, lng: number) => void;
  onRouteLineClick?: (lat: number, lng: number) => void;
  insertModeInfo?: {
    fromIndex: number;
    toIndex: number;
    fromName: string;
    toName: string;
  } | null;
  onCancelInsertMode?: () => void;
  basemapId: string;
  focusedRouteId: number | null;
  focusedFolder?: string | null;
  zoomTargetRouteId?: { id: number; timestamp: number } | null;
  zoomTargetFolder?: { name: string; timestamp: number } | null;
  zoomTargetPoint?: { lat: number; lng: number; timestamp: number } | null;
  zoomTargetDraftRoute?: { timestamp: number } | null;
  onClearZoomTarget?: (type: "route" | "folder" | "point" | "draft") => void;
  activeRouteId?: number | null;
  isCalculatingRoute?: boolean;
  onRouteClick: (route: TraversedRoadRecord) => void;
  onRemoveWaypoint?: (index: number) => void;
  onMoveWaypoint?: (index: number, direction: "up" | "down") => void;
  onToggleDisconnectWaypoint?: (index: number) => void;
  onConnectWaypointToNearest?: (index: number, mode?: "road" | "direct") => void;
  onUpdateWaypointName?: (index: number, newName: string) => void;
  hideWaypointsOnMap?: boolean;
  isPositionLocked?: boolean;
}

export function PetaRute({
  isSidePanelOpen,
  onOpenSidePanel,
  routes,
  waypoints,
  draftPathCoordinates,
  alternativeRoutes,
  selectedAlternativeId,
  onSelectAlternativeRoute,
  customColor,
  customWeight,
  customOpacity,
  customLineStyle,
  markerStyle,
  isAddPointMode,
  onMapClickAddWaypoint,
  onWaypointDragEnd,
  onRouteLineClick,
  insertModeInfo,
  onCancelInsertMode,
  basemapId,
  focusedRouteId,
  focusedFolder,
  zoomTargetRouteId,
  zoomTargetFolder,
  zoomTargetPoint,
  zoomTargetDraftRoute,
  onClearZoomTarget,
  activeRouteId,
  isCalculatingRoute,
  onRouteClick,
  onRemoveWaypoint,
  onMoveWaypoint,
  onToggleDisconnectWaypoint,
  onConnectWaypointToNearest,
  onUpdateWaypointName,
  hideWaypointsOnMap,
  isPositionLocked = true,
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
        alternativeRoutes={alternativeRoutes}
        selectedAlternativeId={selectedAlternativeId}
        onSelectAlternativeRoute={onSelectAlternativeRoute}
        customColor={customColor}
        customWeight={customWeight}
        customOpacity={customOpacity}
        customLineStyle={customLineStyle}
        markerStyle={markerStyle}
        isAddPointMode={isAddPointMode}
        onMapClickAddPoint={onMapClickAddWaypoint}
        onWaypointDragEnd={onWaypointDragEnd}
        onRemoveWaypoint={onRemoveWaypoint}
        onMoveWaypoint={onMoveWaypoint}
        onToggleDisconnectWaypoint={onToggleDisconnectWaypoint}
        onConnectWaypointToNearest={onConnectWaypointToNearest}
        onUpdateWaypointName={onUpdateWaypointName}
        hideWaypointsOnMap={hideWaypointsOnMap}
        isPositionLocked={isPositionLocked}
        onRouteLineClick={onRouteLineClick}
        insertModeInfo={insertModeInfo}
        onCancelInsertMode={onCancelInsertMode}
        activeBasemapId={basemapId}
        focusedRouteId={focusedRouteId}
        focusedFolder={focusedFolder}
        zoomTargetRouteId={zoomTargetRouteId}
        zoomTargetFolder={zoomTargetFolder}
        zoomTargetPoint={zoomTargetPoint}
        zoomTargetDraftRoute={zoomTargetDraftRoute}
        onClearZoomTarget={onClearZoomTarget}
        activeRouteId={activeRouteId}
        isCalculatingRoute={isCalculatingRoute}
        onSelectRoute={onRouteClick}
      />
    </main>
  );
}

