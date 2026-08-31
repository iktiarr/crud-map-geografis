import Link from "next/link";
import { ArrowLeft, Shapes, Eye, BarChart3, Map } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Analisis Wilayah & Poligon - GeoSpatial Suite",
  description: "Analisis batas wilayah administratif, poligon kecamatan, perhitungan luas area, dan relasi spasial ST_Contains.",
};

const districts = [
  { id: 1, name: "Kecamatan Menteng", area: "6.53 km²", pointsCount: 24, density: "Tinggi", color: "#678a40" },
  { id: 2, name: "Kecamatan Tanah Abang", area: "9.30 km²", pointsCount: 38, density: "Sangat Tinggi", color: "#597a36" },
  { id: 3, name: "Kecamatan Gambir", area: "7.59 km²", pointsCount: 19, density: "Sedang", color: "#455e2d" },
  { id: 4, name: "Kecamatan Senen", area: "4.23 km²", pointsCount: 15, density: "Sedang", color: "#394c28" },
];

export default function AreaAnalysisPage() {
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
                <Shapes className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight">Analisis Poligon & Wilayah</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              Polygon & ST_Contains
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Header Hero with Typeset */}
        <div className="typeset typeset-notes max-w-[48em] mb-8">
          <div className="not-typeset inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border mb-3">
            <Shapes className="w-3.5 h-3.5 text-primary" />
            Boundary & Spatial Query Analysis
          </div>
          <h1 className="tracking-tight text-foreground mb-2">
            Analisis Wilayah & Batas Administratif
          </h1>
          <p className="text-muted-foreground">
            Olah data poligon batas kecamatan, hitung luas wilayah (<code>ST_Area</code>), perimeter, serta deteksi relasi spasial titik fasilitas yang berada di dalam area (<code>ST_Contains</code>).
          </p>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Territory List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80">
                <CardTitle className="text-base text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Map className="w-4 h-4 text-primary" />
                    Batas Wilayah Terdaftar ({districts.length} Kecamatan)
                  </span>
                  <Button size="sm" className="text-xs not-typeset">
                    Upload Shapefile / GeoJSON
                  </Button>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-mono">
                  Data poligon MultiPolygon SRID:4326
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {districts.map((dist) => (
                  <div
                    key={dist.id}
                    className="p-4 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all group shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                        {dist.name}
                      </h4>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: dist.color }}
                      />
                    </div>
                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Luas Wilayah:</span>
                        <span className="font-mono text-foreground">{dist.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fasilitas Terdeteksi:</span>
                        <span className="font-mono text-primary">{dist.pointsCount} Titik</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Kepadatan Spasial:</span>
                        <Badge variant="outline" className="text-[10px]">
                          {dist.density}
                        </Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-3 text-xs not-typeset">
                      <Eye className="w-3 h-3 mr-1.5 text-primary" />
                      Sorot Poligon di Peta
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Spatial Containment Query Inspector with Typeset */}
          <div className="space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Uji Relasi Spasial (ST_Contains)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Filter titik sekolah berdasarkan poligon wilayah
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <label className="text-foreground block mb-1 font-medium">Pilih Wilayah Target</label>
                  <select className="w-full bg-background border border-border rounded-xl p-2 text-foreground focus:outline-none focus:border-primary">
                    <option>Semua Kecamatan</option>
                    <option>Kecamatan Menteng</option>
                    <option>Kecamatan Tanah Abang</option>
                    <option>Kecamatan Gambir</option>
                    <option>Kecamatan Senen</option>
                  </select>
                </div>
                <div className="typeset typeset-notes max-w-none">
                  <p className="text-xs text-muted-foreground m-0">
                    Query PostGIS yang dieksekusi:
                  </p>
                  <pre>
{`SELECT s.* FROM sekolah s
JOIN kecamatan k 
  ON ST_Contains(k.geom, s.geom)
WHERE k.id = :id;`}
                  </pre>
                </div>
                <Button className="w-full not-typeset">
                  Jalankan Analisis Spasial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
