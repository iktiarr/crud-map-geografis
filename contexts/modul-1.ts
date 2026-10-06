/**
 * KONTEKS MODUL 1: GLOBAL MAPS & SPATIAL EXPLORATION
 * 
 * File ini menyimpan seluruh konteks sistem, basis data geospasial,
 * aturan prompt AI, penyesuaian level zoom cerdas, dan aksi kontrol peta.
 * Anda dapat mengedit file ini kapan saja untuk menambah referensi atau mengubah gaya respon AI.
 */

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

/**
 * Basis Data Referensi Tempat & Optimal Zoom Level (Modul 1)
 */
export const POPULAR_LOCATIONS: LocationReference[] = [
  // Kota & Wilayah Utama Indonesia
  {
    name: "Surabaya",
    category: "city",
    lat: -7.2575,
    lng: 112.7521,
    zoom: 13,
    aliases: ["kota pahlawan", "sby", "surabaya timur", "surabaya barat"],
    description: "Ibu kota Provinsi Jawa Timur, kota terbesar kedua di Indonesia.",
  },
  {
    name: "Jakarta",
    category: "city",
    lat: -6.2088,
    lng: 106.8456,
    zoom: 12,
    aliases: ["dki jakarta", "ibukota jakarta", "monas jakarta"],
    description: "Pusat pemerintahan dan ekonomi Indonesia.",
  },
  {
    name: "IKN Nusantara",
    category: "landmark",
    lat: -0.9556,
    lng: 116.7042,
    zoom: 14,
    aliases: ["ibu kota nusantara", "ikn", "penajam paser utara", "sepaku"],
    description: "Ibu Kota Negara masa depan Indonesia di Kalimantan Timur.",
  },
  {
    name: "Bandung",
    category: "city",
    lat: -6.9175,
    lng: 107.6191,
    zoom: 13,
    aliases: ["kota bandung", "paris van java", "bandung juara"],
    description: "Ibu kota Provinsi Jawa Barat yang dikelilingi pegunungan sejuk.",
  },
  {
    name: "Semarang",
    category: "city",
    lat: -6.9667,
    lng: 110.4167,
    zoom: 13,
    aliases: ["kota semarang", "simpang lima semarang"],
    description: "Ibu kota Provinsi Jawa Tengah di pesisir utara pulau Jawa.",
  },
  {
    name: "Yogyakarta",
    category: "city",
    lat: -7.7956,
    lng: 110.3695,
    zoom: 14,
    aliases: ["jogja", "diy", "malioboro", "keraton jogja"],
    description: "Kota budaya dan pelajar di Daerah Istimewa Yogyakarta.",
  },
  {
    name: "Malang",
    category: "city",
    lat: -7.9797,
    lng: 112.6304,
    zoom: 13,
    aliases: ["kota malang", "ngalam"],
    description: "Kota sejuk di Jawa Timur dekat kawasan Bromo dan Semeru.",
  },
  {
    name: "Denpasar",
    category: "city",
    lat: -8.6705,
    lng: 115.2126,
    zoom: 13,
    aliases: ["bali", "pulau dewata", "kuta", "sanur"],
    description: "Ibu kota Provinsi Bali dan pusat pariwisata internasional.",
  },
  {
    name: "Medan",
    category: "city",
    lat: 3.5952,
    lng: 98.6722,
    zoom: 13,
    aliases: ["kota medan", "sumut"],
    description: "Kota metropolitan terbesar di pulau Sumatera.",
  },
  {
    name: "Makassar",
    category: "city",
    lat: -5.1477,
    lng: 119.4327,
    zoom: 13,
    aliases: ["ujung pandang", "pantai losari"],
    description: "Pusat pertumbuhan ekonomi dan pelabuhan utama di Indonesia Timur.",
  },

  // Objek Wisata, Candi, Alam & Landmark
  {
    name: "Candi Borobudur",
    category: "landmark",
    lat: -7.6079,
    lng: 110.2038,
    zoom: 16,
    aliases: ["borobudur", "candi budha magelang"],
    description: "Candi Buddha terbesar di dunia yang terletak di Magelang, Jawa Tengah.",
  },
  {
    name: "Candi Prambanan",
    category: "landmark",
    lat: -7.7520,
    lng: 110.4914,
    zoom: 16,
    aliases: ["prambanan", "candi roro jonggrang"],
    description: "Kompleks candi Hindu terindah di perbatasan Sleman dan Klaten.",
  },
  {
    name: "Monumen Nasional (Monas)",
    category: "landmark",
    lat: -6.1754,
    lng: 106.8272,
    zoom: 16,
    aliases: ["monas", "tugu monas"],
    description: "Monumen peringatan kemerdekaan di pusat Kota Jakarta.",
  },
  {
    name: "Gunung Bromo",
    category: "nature",
    lat: -7.9425,
    lng: 112.9530,
    zoom: 14,
    aliases: ["bromo", "taman nasional bromo tengger semeru"],
    description: "Gunung berapi aktif dengan kaldera dan lautan pasir spektakuler di Jawa Timur.",
  },
  {
    name: "Danau Toba",
    category: "nature",
    lat: 2.6145,
    lng: 98.6722,
    zoom: 11,
    aliases: ["toba", "pulau samosir", "danau toba sumatera"],
    description: "Danau vulkanik raksasa terbesar di Asia Tenggara di Sumatera Utara.",
  },
  {
    name: "Gunung Rinjani",
    category: "nature",
    lat: -8.4167,
    lng: 116.4583,
    zoom: 13,
    aliases: ["rinjani", "danau segara anak", "lombok"],
    description: "Gunung tertinggi kedua di Indonesia yang berada di Pulau Lombok, NTB.",
  },

  // Landmark Dunia
  {
    name: "Menara Eiffel",
    category: "landmark",
    lat: 48.8584,
    lng: 2.2945,
    zoom: 17,
    aliases: ["eiffel tower", "paris", "menara eiffel paris"],
    description: "Menara besi tempa ikonik di Champ de Mars, Paris, Prancis.",
  },
  {
    name: "Gunung Fuji",
    category: "nature",
    lat: 35.3606,
    lng: 138.7274,
    zoom: 13,
    aliases: ["fujisan", "mount fuji jepang"],
    description: "Gunung tertinggi dan simbol keindahan negara Jepang.",
  },
  {
    name: "Menara Pisa",
    category: "landmark",
    lat: 43.7230,
    lng: 10.3966,
    zoom: 17,
    aliases: ["leaning tower of pisa", "pisa italia"],
    description: "Menara lonceng miring yang terkenal di Pisa, Italia.",
  },
];

/**
 * Deteksi cerdas level zoom berdasarkan kategori objek geografis
 */
export function getSmartZoomLevel(type?: string, fallback = 14): number {
  if (!type) return fallback;
  const lower = type.toLowerCase();
  
  if (lower.includes("country") || lower.includes("negara")) return 6;
  if (lower.includes("state") || lower.includes("province") || lower.includes("provinsi")) return 9;
  if (lower.includes("city") || lower.includes("kota") || lower.includes("kabupaten") || lower.includes("county")) return 13;
  if (lower.includes("district") || lower.includes("kecamatan") || lower.includes("subdistrict")) return 14;
  if (lower.includes("village") || lower.includes("desa") || lower.includes("kelurahan")) return 15;
  if (lower.includes("mountain") || lower.includes("gunung") || lower.includes("lake") || lower.includes("danau")) return 13;
  if (lower.includes("landmark") || lower.includes("building") || lower.includes("street") || lower.includes("jalan") || lower.includes("tourism")) return 16;
  
  return fallback;
}

/**
 * Helper deteksi format koordinat angka
 */
export function parseCoordinates(query: string): { lat: number; lng: number } | null {
  const clean = query.trim().replace(/[°NSEWnsew]/g, "");
  const match = clean.match(/^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/);
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[3]);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Cari di database referensi lokal sebelum geocoding eksternal
 */
export function findLocalReference(query: string): LocationReference | null {
  const q = query.toLowerCase().trim();
  for (const item of POPULAR_LOCATIONS) {
    if (item.name.toLowerCase() === q) return item;
    if (item.aliases.some((alias) => q.includes(alias) || alias.includes(q))) return item;
  }
  return null;
}

/**
 * System Prompt Utama untuk Modul 1 (Global Maps)
 */
export function buildModul1SystemPrompt(context?: MapContextLive): string {
  return `Anda adalah Asisten Pakar Peta Dunia & Geospasial Cerdas (Global Maps AI - Modul 1).

KEAHLIAN & ATURAN UTAMA:
1. PENCARIAN TEMPAT DUNIA:
   - Temukan lokasi apapun yang ditanyakan (kota, kabupaten, gunung, danau, gedung, cagar budaya, negara, pulau).
   - Berikan informasi ringkas 1-2 kalimat mencakup nama tempat, wilayah administrasi, negara, dan koordinat Latitude Longitude.
   - Selalu sertakan tag aksi [ACTION:fly_to:latitude,longitude,zoom:Nama Tempat] di baris paling akhir.

2. LEVEL ZOOM OTOMATIS:
   - Landmark / Gedung / Tempat Wisata spesifik: Zoom 16-17
   - Kota / Kabupaten / Gunung / Danau: Zoom 12-14
   - Provinsi / Pulau: Zoom 9-10
   - Negara: Zoom 5-6

3. LOKASI SAYA & KOORDINAT:
   - Jika ditanya lokasi saya / koordinat saya:
     * Jika GPS terdeteksi (${context?.userLocation ? `Lat ${context.userLocation.lat}, Lng ${context.userLocation.lng}` : "Belum terdeteksi"}):
       Sebutkan koordinat tersebut dan berikan [ACTION:fly_to:${context?.userLocation?.lat ?? -6.2088},${context?.userLocation?.lng ?? 106.8456},16:Lokasi Saya].
     * Jika belum aktif, beritahu koordinat tengah peta saat ini (Lat ${context?.centerLat ?? -6.2088}, Lng ${context?.centerLng ?? 106.8456}) dan sertakan [ACTION:locate_user:none:Lacak Lokasi GPS Saya].

4. BASEMAP / GAYA PETA:
   - Google Satelit: [ACTION:set_basemap:google-hybrid:Google Satelit Hybrid]
   - Google Terrain: [ACTION:set_basemap:google-terrain:Google Terrain Relief]
   - Google Jalan: [ACTION:set_basemap:google-streets:Google Maps Jalan]
   - Citra ESRI: [ACTION:set_basemap:esri-satellite:Citra Satelit ESRI]
   - OSM Standar: [ACTION:set_basemap:osm-standard:OpenStreetMap Standar]
   - Kontur Topo: [ACTION:set_basemap:opentopomap:OpenTopoMap Kontur]

6. ATURAN GAYA TEKS (PENTING):
   - Gunakan format teks polos yang rapi dan alami.
   - JANGAN PERNAH menggunakan tanda bintang dua (**) atau tanda bintang satu (*) di dalam teks jawaban.
   - Jangan gunakan formatting bold markdown (hindari **kata**). Tuliskan langsung kata-katanya tanpa simbol.
   - Jawaban harus lengkap, jelas, dan tidak terpotong.

FORMAT AKSI WAJIB:
Sertakan tag aksi di baris terakhir: [ACTION:tipe:param:label]`;
}
