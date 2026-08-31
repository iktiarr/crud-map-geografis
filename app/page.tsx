import Link from "next/link";
import { 
  Globe2, 
  MapPin, 
  Shapes, 
  FileCode, 
  Route, 
  Flame, 
  ArrowRight, 
  Sparkles, 
  Database, 
  Map as MapIcon, 
  CheckCircle2
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "GeoSpatial Studio - GIS & Global Maps",
  description: "Platform Geografis modern dengan modul Global Maps, Spatial CRUD, Analisis Poligon, GeoJSON Tools, dan Heatmap Density.",
};

const features = [
  {
    id: "global-maps",
    title: "1. Global Maps Explorer",
    subtitle: "Peta Interaktif Dunia & Multi-Basemap",
    description: "Eksplorasi peta global interaktif dengan layer OpenStreetMap, Citra Satelit, Topografi, dan Dark Mode dengan navigasi koordinat presisi.",
    href: "/global-maps",
    icon: Globe2,
    badge: "Utama",
    accentBg: "bg-olive-drab-500/10 text-olive-drab-600 dark:text-olive-drab-300 border-olive-drab-500/20",
    borderHover: "hover:border-olive-drab-500/60 hover:shadow-olive-drab-500/10",
    featuresList: ["Multi-layer basemap switcher", "Geocoding & koordinat realtime", "Kontrol zoom & proyeksi WGS84"]
  },
  {
    id: "spatial-crud",
    title: "2. CRUD Data Spasial",
    subtitle: "Manajemen Titik Fasilitas & Sekolah",
    description: "Kelola database titik lokasi (sekolah, RS, instansi) secara lengkap dengan fungsi Create, Read, Update, Delete dan integrasi query PostGIS.",
    href: "/spatial-crud",
    icon: MapPin,
    badge: "Database",
    accentBg: "bg-olive-drab-600/10 text-olive-drab-700 dark:text-olive-drab-300 border-olive-drab-600/20",
    borderHover: "hover:border-olive-drab-500/60 hover:shadow-olive-drab-500/10",
    featuresList: ["Input koordinat Latitude/Longitude", "Kategori & penanda warna dinamis", "Operasi ST_MakePoint & ST_SetSRID"]
  },
  {
    id: "area-analysis",
    title: "3. Analisis Wilayah & Poligon",
    subtitle: "Batas Administratif & Relasi Spasial",
    description: "Analisis batas poligon kecamatan/wilayah, hitung luas area (km²), perimeter, dan uji spasial titik yang berada di dalam area (ST_Contains).",
    href: "/area-analysis",
    icon: Shapes,
    badge: "Analitik",
    accentBg: "bg-olive-drab-500/10 text-olive-drab-600 dark:text-olive-drab-300 border-olive-drab-500/20",
    borderHover: "hover:border-olive-drab-500/60 hover:shadow-olive-drab-500/10",
    featuresList: ["Hitung luas (ST_Area) & keliling", "Filter titik dengan ST_Contains", "Kustomisasi warna batas poligon"]
  },
  {
    id: "geojson-tools",
    title: "4. GeoJSON Tools & Converter",
    subtitle: "Impor, Ekspor & Validasi Format Spasial",
    description: "Konversi berkas spasial GeoJSON, KML, Shapefile, CSV koordinat dengan penampil payload JSON langsung dan validasi standar RFC 7946.",
    href: "/geojson-tools",
    icon: FileCode,
    badge: "Konversi",
    accentBg: "bg-olive-drab-500/10 text-olive-drab-600 dark:text-olive-drab-300 border-olive-drab-500/20",
    borderHover: "hover:border-olive-drab-500/60 hover:shadow-olive-drab-500/10",
    featuresList: ["Live GeoJSON code viewer", "Drag & drop upload file", "Download & ekspor GeoJSON"]
  },
  {
    id: "distance-routing",
    title: "5. Jarak & Rute Spasial",
    subtitle: "Formula Haversine & Zona Buffer",
    description: "Hitung jarak geodesik akurat antar titik koordinat, visualisasikan zona buffer jangkauan fasilitas (radius 1km, 3km, 5km), serta jalur rute.",
    href: "/distance-routing",
    icon: Route,
    badge: "Geodesik",
    accentBg: "bg-olive-drab-500/10 text-olive-drab-600 dark:text-olive-drab-300 border-olive-drab-500/20",
    borderHover: "hover:border-olive-drab-500/60 hover:shadow-olive-drab-500/10",
    featuresList: ["Kalkulator formula Haversine", "Simulasi radius buffer jangkauan", "Estimasi jarak garis lurus & rute"]
  },
  {
    id: "heatmap-density",
    title: "6. Peta Kepadatan & Heatmap",
    subtitle: "Visualisasi Hotspot & Intensitas Titik",
    description: "Visualisasikan kepadatan sebaran titik spasial dengan spektrum warna dinamis untuk mengidentifikasi konsentrasi wilayah tinggi secara intuitif.",
    href: "/heatmap-density",
    icon: Flame,
    badge: "Visualisasi",
    accentBg: "bg-olive-drab-500/10 text-olive-drab-600 dark:text-olive-drab-300 border-olive-drab-500/20",
    borderHover: "hover:border-olive-drab-500/60 hover:shadow-olive-drab-500/10",
    featuresList: ["Gradien warna dinamis (Olive-Red)", "Pengaturan radius & blur", "Deteksi kluster kepadatan spasial"]
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-87.5 bg-linear-to-tr from-olive-drab-400/15 via-olive-drab-500/10 to-olive-drab-600/10 blur-[130px] pointer-events-none -z-10" />

      {/* Header */}
      <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-olive-drab-600 to-olive-drab-400 p-px shadow-sm">
              <div className="w-full h-full bg-card rounded-[15px] flex items-center justify-center">
                <Globe2 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight bg-linear-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                GeoSpatial Studio
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-border">
                Olive GIS
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link 
              href="/global-maps"
              className={buttonVariants({ variant: "outline", size: "sm", className: "hidden sm:inline-flex text-xs" })}
            >
              <MapIcon className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Peta Global
            </Link>
            <Link 
              href="/spatial-crud"
              className={buttonVariants({ size: "sm", className: "text-xs shadow-xs" })}
            >
              <Database className="w-3.5 h-3.5 mr-1.5" />
              Data Spasial
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section with Typeset */}
      <section className="pt-12 sm:pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center relative">
        <div className="typeset typeset-notes max-w-[48em] mx-auto text-center">
          <div className="not-typeset inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-secondary border border-border text-secondary-foreground mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Sistem Informasi Geografis & Peta Interaktif Modern</span>
          </div>

          <h1 className="tracking-tight text-foreground leading-tight">
            Pusat Kendali <span className="bg-linear-to-r from-olive-drab-600 via-olive-drab-500 to-olive-drab-400 dark:from-olive-drab-300 dark:via-olive-drab-400 dark:to-olive-drab-500 bg-clip-text text-transparent">Peta & Data Geospasial</span> Terpadu
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            Pilih modul fitur geospasial di bawah ini untuk memulai eksplorasi peta dunia, pengelolaan titik koordinat fasilitas, analisis batas poligon wilayah, hingga konversi GeoJSON.
          </p>

          {/* Quick Tech Badges */}
          <div className="not-typeset mt-8 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-muted-foreground">
            <span className="px-3 py-1 rounded-full bg-secondary/80 border border-border flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              Next.js 16 + Tailwind v4
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary/80 border border-border flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              shadcn/typeset (Preset Notes)
            </span>
            <span className="px-3 py-1 rounded-full bg-secondary/80 border border-border flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              PostGIS & WGS84 Ready
            </span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border/80">
          <div className="typeset typeset-notes max-w-[36em]">
            <h2 className="text-foreground tracking-tight m-0">
              Modul Fitur Geografis
            </h2>
            <p className="text-muted-foreground mt-1">
              Klik salah satu kartu di bawah ini untuk membuka halaman masing-masing modul
            </p>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex text-xs">
            {features.length} Modul Tersedia
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.id} 
                className={`group border-border/80 bg-card backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${item.borderHover} flex flex-col justify-between overflow-hidden relative`}
              >
                {/* Top Subtle Gradient Light */}
                <div className="absolute top-0 inset-x-0 h-24 bg-linear-to-b from-primary/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none" />

                <div>
                  <CardHeader className="p-5 pb-3 relative z-10">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-2xl border ${item.accentBg} shadow-xs group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {item.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <div className="text-xs font-medium text-muted-foreground">
                      {item.subtitle}
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-4 relative z-10">
                    <div className="typeset typeset-notes max-w-[42em]">
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {item.description}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-border/60">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1 font-mono">
                        Kemampuan Utama:
                      </span>
                      {item.featuresList.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-foreground/80">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-5 pt-0 relative z-10">
                  <Link 
                    href={item.href}
                    className={buttonVariants({ variant: "outline", className: "w-full hover:bg-primary hover:text-primary-foreground transition-all text-xs justify-between group-hover:border-primary/50" })}
                  >
                    <span>Buka Modul Fitur</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-1 transition-all" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-16 border-t border-border/80 bg-background/60 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-primary" />
            <span className="font-semibold text-foreground">GeoSpatial Studio</span>
            <span>- Global Maps & Geographic Management Suite</span>
          </div>
          <div>
            Built with Next.js, Tailwind CSS & shadcn/typeset
          </div>
        </div>
      </footer>
    </div>
  );
}
