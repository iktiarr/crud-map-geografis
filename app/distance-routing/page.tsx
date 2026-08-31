import Link from "next/link";
import { ArrowLeft, Route, Navigation2, Calculator, MapPin, Gauge } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "Pengukuran Jarak & Rute Spasial - GeoSpatial Suite",
  description: "Hitung jarak antar titik koordinat (Haversine Formula), radius buffer jangkauan, dan estimasi rute perjalanan.",
};

export default function DistanceRoutingPage() {
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
                <Route className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm sm:text-base tracking-tight">Jarak & Rute Spasial</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="font-mono text-xs hidden sm:inline-flex">
              Haversine & OSRM
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
            <Route className="w-3.5 h-3.5 text-primary" />
            Distance Matrix & Buffer Analysis
          </div>
          <h1 className="tracking-tight text-foreground mb-2">
            Pengukuran Jarak & Perutean
          </h1>
          <p className="text-muted-foreground">
            Hitung jarak geodesik akurat antar titik koordinat, visualisasikan zona buffer jangkauan fasilitas (radius 1km, 3km, 5km), serta kalkulasi rute terdekat.
          </p>
        </div>

        {/* Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Calculator Card */}
          <Card className="lg:col-span-2 border-border bg-card backdrop-blur">
            <CardHeader className="p-4 border-b border-border/80">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Kalkulator Jarak Geodesik (Formula Haversine)
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-mono">
                Kalkulasi presisi kelengkungan bumi (WGS84 Earth Radius = 6,371 km)
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Point A */}
                <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Titik Asal (Point A)
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Asal
                    </Badge>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Nama Titik</label>
                    <input
                      type="text"
                      defaultValue="SMAN 1 Kota Utama"
                      className="w-full bg-background border border-border rounded-xl p-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Lat</label>
                      <input
                        type="text"
                        defaultValue="-6.2088"
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Lng</label>
                      <input
                        type="text"
                        defaultValue="106.8456"
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Point B */}
                <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Titik Tujuan (Point B)
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Tujuan
                    </Badge>
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Nama Titik</label>
                    <input
                      type="text"
                      defaultValue="RSUD Geografis Medika"
                      className="w-full bg-background border border-border rounded-xl p-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Lat</label>
                      <input
                        type="text"
                        defaultValue="-6.1950"
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Lng</label>
                      <input
                        type="text"
                        defaultValue="106.8510"
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculated Result Box */}
              <div className="p-4 rounded-2xl bg-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Hasil Jarak Garis Lurus (Straight Line Distance):</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-primary mt-0.5">
                    1.65 km <span className="text-xs font-normal text-muted-foreground">(1,650 meter)</span>
                  </div>
                </div>
                <Button size="sm" className="text-xs whitespace-nowrap not-typeset">
                  <Navigation2 className="w-3.5 h-3.5 mr-1.5" />
                  Kalkulasi Ulang
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Buffer & Range Settings */}
          <div className="space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Radius Buffer Jangkauan
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Visualisasi zona cakupan lingkaran
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-3 text-xs text-foreground">
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Radius 1 km (Jalan Kaki)</span>
                  <Badge variant="secondary" className="text-[10px]">
                    ~12 menit
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Radius 3 km (Sepeda Motor)</span>
                  <Badge variant="secondary" className="text-[10px]">
                    ~8 menit
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Radius 5 km (Mobil / Transit)</span>
                  <Badge variant="secondary" className="text-[10px]">
                    ~15 menit
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
