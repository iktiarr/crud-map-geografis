export interface SpatialLocation {
  id: number;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  imageUrl?: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ViewMode = "split" | "map" | "table";

export interface SpatialFilter {
  search: string;
  category: string;
  sortBy: "name" | "category" | "id";
  sortOrder: "asc" | "desc";
}

export interface SpatialStats {
  total: number;
  categoriesCount: number;
  verifiedCount: number;
}
