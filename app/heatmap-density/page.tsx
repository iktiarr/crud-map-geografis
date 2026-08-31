import Link from "next/link";
import { ArrowLeft, Flame, Activity, Sliders } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Peta Kepadatan & Heatmap - GeoSpatial Suite",
  description: "Visualisasi intensitas titik persebaran spasial, analisis konsentrasi kepadatan, dan heatmap gradien.",
};

export default function HeatmapDensityPage() {
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
                <Flame className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight">Peta Kepadatan & Heatmap</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              Kernel Density Estimation
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
            <Flame className="w-3.5 h-3.5 text-primary" />
            Spatial Density & Hotspot Visualization
          </div>
          <h1 className="tracking-tight text-foreground mb-2">
            Peta Kepadatan & Heatmap
          </h1>
          <p className="text-muted-foreground">
            Analisis persebaran titik spasial secara dinamis dengan layer heatmap intensitas warna, clustering kepadatan fasilitas, dan identifikasi area hotspot.
          </p>
        </div>

        {/* Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Heatmap Preview Visualizer with Typeset */}
          <Card className="lg:col-span-2 border-border bg-card backdrop-blur">
            <CardHeader className="p-4 border-b border-border/80">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                Simulasi Canvas Heatmap
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Visualisasi spektrum warna gradien (Olive ➔ Kuning ➔ Merah Hotspot)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 min-h-87.5 relative bg-muted/20 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Decorative Heatmap Glows */}
              <div className="absolute top-1/4 left-1/3 w-40 h-40 bg-olive-drab-400/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-olive-drab-600/25 rounded-full blur-3xl pointer-events-none" />

              <div className="typeset typeset-notes max-w-[32em] relative z-10 text-center">
                <div className="not-typeset w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 text-primary mx-auto flex items-center justify-center mb-4 shadow-sm animate-bounce">
                  <Flame className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Layer Heatmap Terkonfigurasi</h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Modul ini siap menerima ribuan data koordinat untuk dikomputasi menjadi intensitas visual berbasis Leaflet.heat atau Mapbox heatmap layer.
                </p>
                <div className="not-typeset flex justify-center gap-3">
                  <Button size="sm" className="text-xs">
                    Generate Heatmap Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Controls Panel */}
          <div className="space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Parameter Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-foreground mb-1">
                    <span>Radius Titik (Blur Radius):</span>
                    <span className="font-mono text-primary">25 px</span>
                  </div>
                  <input type="range" min="5" max="50" defaultValue="25" className="w-full accent-primary" />
                </div>
                <div>
                  <div className="flex justify-between text-foreground mb-1">
                    <span>Opasitas Maksimum:</span>
                    <span className="font-mono text-primary">80%</span>
                  </div>
                  <input type="range" min="10" max="100" defaultValue="80" className="w-full accent-primary" />
                </div>
                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block mb-2 font-medium">Skema Gradien Warna:</span>
                  <div className="h-4 rounded-md bg-linear-to-r from-olive-drab-200 via-olive-drab-500 to-olive-drab-900 shadow-inner" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>Rendah (0.0)</span>
                    <span>Tinggi (1.0)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
