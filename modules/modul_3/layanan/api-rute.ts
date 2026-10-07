import { TraversedRoadRecord } from "../tipe";

const BASE_API = "/api/traversed-roads";

// Helper aman untuk parse JSON
async function safeJsonParse(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Respons server tidak valid (Status: ${res.status})`);
  }
}

// Ambil semua rute dan daftar folder dari database
export async function ambilSemuaRuteDanFolder(): Promise<{
  routes: TraversedRoadRecord[];
  folderNames: string[];
  errorMessage?: string;
}> {
  try {
    const [routesRes, foldersRes] = await Promise.all([
      fetch(BASE_API, { cache: "no-store" }),
      fetch(`${BASE_API}/folders`, { cache: "no-store" }),
    ]);

    if (!routesRes.ok || !foldersRes.ok) {
      throw new Error(`Gagal memuat data dari server (HTTP ${routesRes.status}/${foldersRes.status})`);
    }

    const routesData = await safeJsonParse(routesRes);
    const foldersData = await safeJsonParse(foldersRes);

    const routes: TraversedRoadRecord[] =
      routesData.status === "success" && Array.isArray(routesData.data)
        ? routesData.data.map((item: TraversedRoadRecord) => ({
            ...item,
            isVisible: true,
          }))
        : [];

    const folderNames: string[] =
      foldersData.status === "success" && Array.isArray(foldersData.folderNames)
        ? foldersData.folderNames
        : [];

    return { routes, folderNames };
  } catch (error) {
    console.error("ambilSemuaRuteDanFolder error:", error);
    return {
      routes: [],
      folderNames: [],
      errorMessage: error instanceof Error ? error.message : "Koneksi database terganggu. Silakan periksa koneksi Anda.",
    };
  }
}

// Simpan rute baru ke database
export async function simpanRuteBaru(payload: Record<string, unknown>): Promise<{
  success: boolean;
  message?: string;
  data?: TraversedRoadRecord;
}> {
  try {
    const res = await fetch(BASE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await safeJsonParse(res);
    return {
      success: json.status === "success",
      message: json.message,
      data: json.data,
    };
  } catch (error) {
    console.error("simpanRuteBaru error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan rute" };
  }
}

// Update kustomisasi rute (nama, warna, tebal, gaya garis, folder)
export async function updateKustomisasiRute(
  id: number,
  payload: Partial<TraversedRoadRecord>
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await safeJsonParse(res);
    return { success: json.status === "success", message: json.message };
  } catch (error) {
    console.error("updateKustomisasiRute error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Gagal memperbarui rute" };
  }
}

// Hapus rute dari database
export async function hapusRute(id: number): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_API}/${id}`, {
      method: "DELETE",
    });
    const json = await safeJsonParse(res);
    return { success: json.status === "success", message: json.message };
  } catch (error) {
    console.error("hapusRute error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Gagal menghapus rute" };
  }
}

// Buat folder baru
export async function buatFolderBaru(
  name: string
): Promise<{ success: boolean; message?: string; folderName?: string }> {
  try {
    const res = await fetch(`${BASE_API}/folders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const json = await safeJsonParse(res);
    return {
      success: json.status === "success",
      message: json.message,
      folderName: name.trim(),
    };
  } catch (error) {
    console.error("buatFolderBaru error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Gagal membuat folder" };
  }
}

// Ubah nama folder
export async function ubahNamaFolder(
  oldName: string,
  newName: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(`${BASE_API}/folders`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName }),
    });
    const json = await safeJsonParse(res);
    return { success: json.status === "success", message: json.message };
  } catch (error) {
    console.error("ubahNamaFolder error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Gagal mengubah nama folder" };
  }
}

// Hapus folder
export async function hapusFolder(
  name: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const url = `${BASE_API}/folders?name=${encodeURIComponent(name.trim())}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const json = await safeJsonParse(res);
    return { success: json.status === "success", message: json.message };
  } catch (error) {
    console.error("hapusFolder error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Gagal menghapus folder" };
  }
}
