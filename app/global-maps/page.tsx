import Link from "next/link";
import { ArrowLeft, Globe2, Layers, Compass, Navigation, Eye, MapPin, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Global Maps Explorer - GeoSpatial Suite",
  description: "Eksplorasi peta interaktif dunia dengan visualisasi multi-layer dan koordinat real-time.",
};

export default function GlobalMapsPage() {
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
                <Globe2 className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight">Global Maps</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              Ready to integrate
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
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Modul Utama Peta Spasial
          </div>
          <h1 className="tracking-tight text-foreground mb-2">
            Global Maps Explorer
          </h1>
          <p className="text-muted-foreground">
            Visualisasi peta global interaktif dengan dukungan multi-layer basemap (OpenStreetMap, Satellite, Dark, Topografi), navigasi koordinat presisi tinggi, dan kontrol proyeksi geografis.
          </p>
        </div>

        {/* Map Placeholder / Interactive Canvas Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 border-border bg-card backdrop-blur overflow-hidden flex flex-col">
            <CardHeader className="border-b border-border/80 bg-muted/30 p-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  Peta Tampilan Interaktif (Viewport)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-mono">
                  Koordinat Pusat: Lat -6.2088, Long 106.8456 (Jakarta, Indonesia)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">
                  Zoom: 12x
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0 flex-1 min-h-95 relative bg-muted/20 flex items-center justify-center">
              {/* Simulated Map Grid / Graphics */}
              <div className="absolute inset-0 bg-size-[4rem_4rem] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] opacity-5 pointer-events-none" />
              
              <div className="typeset typeset-notes max-w-[32em] text-center p-6 z-10">
                <div className="not-typeset w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 text-primary mx-auto flex items-center justify-center mb-4 shadow-sm animate-pulse">
                  <Globe2 className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Kanvas Peta Global Siap Dikoneksikan</h3>
                <p className="text-muted-foreground mb-5 text-sm">
                  Modul ini siap dipasangkan dengan Leaflet, Mapbox GL JS, atau OpenLayers untuk merender layer peta lengkap.
                </p>
                <div className="not-typeset flex flex-wrap justify-center gap-2">
                  <Badge variant="outline">Leaflet.js</Badge>
                  <Badge variant="outline">OpenStreetMap</Badge>
                  <Badge variant="outline">GeoJSON Layers</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side Controls / Info Panel */}
          <div className="space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Pilihan Basemap
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Pilih mode visualisasi latar belakang peta
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                <div className="p-2.5 rounded-xl border border-primary/40 bg-primary/10 flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-foreground">OpenStreetMap Standard</span>
                  </div>
                  <Badge className="text-[10px]">Aktif</Badge>
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-card/60 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Satellite Imagery (ESRI/Google)</span>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-card/60 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Dark Matter (CartoDB)</span>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="p-2.5 rounded-xl border border-border bg-card/60 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Topographic Relief</span>
                  </div>
                  <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-primary" />
                  Fitur Cepat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2">
                <Button variant="outline" className="w-full justify-start text-xs">
                  <MapPin className="w-3.5 h-3.5 mr-2 text-primary" />
                  Cari Lokasi / Geocoding
                </Button>
                <Button variant="outline" className="w-full justify-start text-xs">
                  <Layers className="w-3.5 h-3.5 mr-2 text-primary" />
                  Aktifkan Layer Titik Fasilitas
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
