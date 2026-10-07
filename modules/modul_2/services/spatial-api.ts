import type { SpatialLocation } from "../types";

export async function fetchSpatialLocations(search?: string, category?: string): Promise<{ success: boolean; data: SpatialLocation[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (category && category !== "all") params.append("category", category);

    const res = await fetch(`/api/spatial-crud?${params.toString()}`);
    const json = await res.json();
    return json;
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || "Gagal memuat data spasial" };
  }
}

export async function saveSpatialLocation(
  data: Partial<SpatialLocation>,
  id?: number
): Promise<{ success: boolean; data?: SpatialLocation; error?: string }> {
  try {
    const method = id ? "PUT" : "POST";
    const payload = id ? { ...data, id } : data;

    const res = await fetch("/api/spatial-crud", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menyimpan data lokasi" };
  }
}

export async function deleteSpatialLocation(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/spatial-crud?id=${id}`, { method: "DELETE" });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err?.message || "Gagal menghapus data lokasi" };
  }
}
