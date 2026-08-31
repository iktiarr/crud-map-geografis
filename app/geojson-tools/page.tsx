import Link from "next/link";
import { ArrowLeft, FileCode, Upload, Download, Copy, Terminal } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "GeoJSON Tools & Exporter - GeoSpatial Suite",
  description: "Impor, ekspor, validasi struktur spasial GeoJSON, dan konversi format shapefile.",
};

const sampleGeoJson = {
  "type": "FeatureCollection",
  "name": "Titik_Fasilitas_Sample",
  "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
  "features": [
    {
      "type": "Feature",
      "properties": { "id": 1, "nama": "SMAN 1 Kota Utama", "kategori": "Sekolah", "warna": "#678a40" },
      "geometry": { "type": "Point", "coordinates": [106.8456, -6.2088] }
    },
    {
      "type": "Feature",
      "properties": { "id": 2, "nama": "RSUD Geografis", "kategori": "Kesehatan", "warna": "#455e2d" },
      "geometry": { "type": "Point", "coordinates": [106.8510, -6.1950] }
    }
  ]
};

export default function GeoJsonToolsPage() {
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
                <FileCode className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight">GeoJSON Tools & Converter</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              RFC 7946 Standard
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
            <FileCode className="w-3.5 h-3.5 text-primary" />
            Spatial Format Converter & Validator
          </div>
          <h1 className="tracking-tight text-foreground mb-2">
            GeoJSON & Shapefile Converter
          </h1>
          <p className="text-muted-foreground">
            Alat bantu konversi dan validasi berkas geospasial (GeoJSON, KML, TopoJSON, Shapefile, CSV Koordinat) dengan inspeksi struktur payload langsung.
          </p>
        </div>

        {/* Tools Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* JSON Viewer with Typeset */}
          <Card className="border-border bg-card backdrop-blur">
            <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  Live GeoJSON Payload Viewer
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  FeatureCollection valid (2 fitur terdeteksi)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 not-typeset">
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Copy className="w-3 h-3 mr-1" />
                  Salin
                </Button>
                <Button size="sm" className="h-7 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Unduh .geojson
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="typeset typeset-notes max-w-none">
                <pre className="max-h-95 overflow-x-auto text-xs">
                  <code>{JSON.stringify(sampleGeoJson, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Upload & Conversion Options */}
          <div className="space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Unggah Berkas Geospasial
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Mendukung .geojson, .json, .kml, .shp (.zip), atau .csv berkolom Lat/Lng
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 text-center">
                <div className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-8 transition-colors cursor-pointer bg-muted/20">
                  <Upload className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
                    Seret & letakkan berkas ke sini, atau klik untuk memilih
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Maksimal 25MB per berkas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Status Validasi Format
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Sistem Koordinat (CRS)</span>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    EPSG:4326 (WGS 84)
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Geometri Valid</span>
                  <Badge variant="outline" className="text-[10px]">
                    Valid (Point & Polygon)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
