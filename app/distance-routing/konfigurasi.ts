import { ColorPaletteItem, TravelMode, ConnectionMode, MarkerStyle } from "./tipe";

// Palet Warna Desain Aether Modul 5
export const COLOR_PALETTE: ColorPaletteItem[] = [
  { name: "Biru Indigo", hex: "#2563eb" },
  { name: "Cyan Elektrik", hex: "#06b6d4" },
  { name: "Hijau Emerald", hex: "#10b981" },
  { name: "Kuning Amber", hex: "#f59e0b" },
  { name: "Merah Crimson", hex: "#ef4444" },
  { name: "Ungu Violet", hex: "#8b5cf6" },
  { name: "Pink Fuchsia", hex: "#ec4899" },
  { name: "Oranye Sunset", hex: "#f97316" },
  { name: "Abu Slate", hex: "#475569" },
];

export const DEFAULT_ROUTE_CONFIG = {
  color: "#2563eb",
  weight: 6,
  opacity: 0.9,
  lineStyle: "solid" as const,
  travelMode: "driving" as TravelMode,
  connectionMode: "sequential" as ConnectionMode,
  markerStyle: "numbers" as MarkerStyle,
  category: "Jalan Terhubung",
  basemapId: "carto-voyager",
};
