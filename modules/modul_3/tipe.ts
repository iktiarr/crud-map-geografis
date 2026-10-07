export type { TraversedRoadRecord, RouteGeoJsonObject } from "@/components/map/leaflet-traversed-roads-map";
export { parseRouteGeoJSON } from "@/components/map/leaflet-traversed-roads-map";
export type { WaypointItem, MultiPointRouteResult, AlternativeRouteOption } from "@/lib/road-routing";

export type TravelMode = "driving" | "bike" | "foot";
export type LineStyle = "solid" | "dashed" | "dotted";
export type ConnectionMode =
  | "sequential"
  | "nearest"
  | "direct_line"
  | "loop_closed"
  | "smart_direct";
export type MarkerStyle = "numbers" | "letters" | "none" | "icon" | "pin" | "dot" | "random";

export function getLetterLabel(index: number): string {
  let label = "";
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
}

export interface ToastMessage {
  text: string;
  type: "success" | "error";
}

export interface ColorPaletteItem {
  name: string;
  hex: string;
}
