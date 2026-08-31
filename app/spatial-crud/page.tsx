import Link from "next/link";
import { ArrowLeft, MapPin, Plus, Search, Edit3, Trash2, Database, School } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "CRUD Data Spasial & Titik Geografis - GeoSpatial Suite",
  description: "Manajemen data koordinat, fasilitas pendidikan, dan titik lokasi dengan fungsi Create, Read, Update, Delete.",
};

const sampleMarkers = [
  { id: 1, name: "SMAN 1 Kota Utama", category: "Sekolah (SMA)", lat: -6.2088, lng: 106.8456, address: "Jl. Pendidikan No. 45", color: "#678a40" },
  { id: 2, name: "SMP Negeri 03", category: "Sekolah (SMP)", lat: -6.2140, lng: 106.8320, address: "Jl. Pemuda Merdeka No. 12", color: "#597a36" },
  { id: 3, name: "RSUD Geografis Medika", category: "Kesehatan", lat: -6.1950, lng: 106.8510, address: "Jl. Kesehatan Terpadu No. 8", color: "#455e2d" },
  { id: 4, name: "Kantor Camat Wilayah 1", category: "Pemerintahan", lat: -6.2201, lng: 106.8600, address: "Jl. Protocol Barat No. 100", color: "#394c28" },
];

export default function SpatialCrudPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Top Navigation */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className={buttonVariants({ variant: "outline", size: "sm", className: "inline-flex items-center gap-2 text-xs" })}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight">CRUD Data Spasial</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              PostgreSQL / PostGIS Ready
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Header Hero with Typeset */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="typeset typeset-notes max-w-[48em]">
            <div className="not-typeset inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border mb-3">
              <Database className="w-3.5 h-3.5 text-primary" />
              Point & Marker Management
            </div>
            <h1 className="tracking-tight text-foreground mb-2">
              CRUD Data Geografis & Fasilitas
            </h1>
            <p className="text-muted-foreground">
              Kelola data titik koordinat, fasilitas sekolah, layanan publik, dan penanda lokasi dengan operasi database PostGIS (<code>ST_MakePoint</code>, <code>ST_SetSRID</code>).
            </p>
          </div>
          <div className="flex items-center gap-3 not-typeset">
            <Button className="shadow-xs">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Titik Lokasi
            </Button>
          </div>
        </div>

        {/* Data Table & Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <School className="w-4 h-4 text-primary" />
                    Daftar Titik Spasial ({sampleMarkers.length} Terdaftar)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground font-mono">
                    Data koordinat SRID:4326 WGS84
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari nama atau alamat..."
                    className="w-full bg-background border border-border rounded-xl py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                      <tr>
                        <th className="p-3 font-medium">Nama Fasilitas</th>
                        <th className="p-3 font-medium">Kategori</th>
                        <th className="p-3 font-medium">Koordinat (Lat, Lng)</th>
                        <th className="p-3 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {sampleMarkers.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-50">{item.address}</div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="p-3 font-mono text-[11px] text-muted-foreground">
                            {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground">
                              <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Quick Add */}
          <div>
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Form Input Koordinat Cepat
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Simpan langsung ke tabel geospasial
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <label className="text-foreground block mb-1 font-medium">Nama Lokasi / Fasilitas</label>
                  <input
                    type="text"
                    placeholder="Contoh: SMAN 2 Kota"
                    className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-foreground block mb-1 font-medium">Kategori</label>
                  <select className="w-full bg-background border border-border rounded-xl p-2 text-foreground focus:outline-none focus:border-primary">
                    <option>Sekolah (SD/SMP/SMA)</option>
                    <option>Kesehatan (RS/Puskesmas)</option>
                    <option>Pemerintahan</option>
                    <option>Tempat Ibadah</option>
                    <option>Pariwisata / Lainnya</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-foreground block mb-1 font-medium">Latitude (Y)</label>
                    <input
                      type="text"
                      placeholder="-6.2088"
                      className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-foreground block mb-1 font-medium">Longitude (X)</label>
                    <input
                      type="text"
                      placeholder="106.8456"
                      className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-foreground block mb-1 font-medium">Alamat Lengkap</label>
                  <textarea
                    rows={2}
                    placeholder="Alamat jalan atau keterangan lokasi..."
                    className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <Button className="w-full mt-2">
                  Simpan Data Spasial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
