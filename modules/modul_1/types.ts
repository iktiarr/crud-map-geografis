export interface MapContextLive {
  activeBasemap?: string;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  cursorCoords?: { lat: number; lng: number } | null;
}

export interface LocationReference {
  name: string;
  category: "city" | "landmark" | "nature" | "province" | "country" | "tourism";
  lat: number;
  lng: number;
  zoom: number;
  aliases: string[];
  description: string;
}

export interface SearchResultItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  category: string;
  description: string;
  source: "local" | "nominatim";
  distanceKm?: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
  action?: {
    type: string;
    param: string;
    label: string;
    raw: string;
  } | null;
}
