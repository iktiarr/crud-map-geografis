export type { TraversedRoadRecord } from "@/components/map/leaflet-traversed-roads-map";
export type { WaypointItem, MultiPointRouteResult, AlternativeRouteOption } from "@/lib/road-routing";

export type TravelMode = "driving" | "bike" | "foot";
export type LineStyle = "solid" | "dashed" | "dotted";

export interface ToastMessage {
  text: string;
  type: "success" | "error";
}

export interface ColorPaletteItem {
  name: string;
  hex: string;
}
