import Link from "next/link";
import { 
  MapPin, 
  Shapes, 
  FileCode, 
  Route, 
  Flame, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2
} from "lucide-react";
import { TelescopeIcon } from "@/components/ui/telescope";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata = {
  title: "GeoSpatial Studio - GIS & Global Maps",
  description: "Platform Geografis modern dengan modul Global Maps, Spatial CRUD, Analisis Poligon, GeoJSON Tools, dan Heatmap Density.",
};

const features = [
  {
    id: "global-maps",
    title: "1. Global Maps Explorer",
    subtitle: "Eksplorasi Peta Dunia & Pilihan Tampilan",
    description: "Menyediakan layanan penjelajahan peta interaktif dengan berbagai pilihan gaya visual seperti peta jalan, citra satelit, dan topografi secara cepat dan mudah.",
    href: "/global-maps",
    isTelescope: true,
    badge: "Utama",
    accentBg: "bg-primary/10 text-primary border-primary/20",
    borderHover: "hover:border-primary/60 hover:shadow-md",
    featuresList: [
      "Berbagai pilihan gaya tampilan peta",
      "Citra satelit dan kontur permukaan bumi",
      "Navigasi penjelajahan wilayah responsif"
    ]
  },
  {
    id: "spatial-crud",
    title: "2. CRUD Data Spasial",
    subtitle: "Pengelolaan Data Titik Koordinat",
    description: "Memfasilitasi pencatatan, pembaruan, dan pengelolaan data lokasi fasilitas publik beserta informasi alamat dan titik koordinatnya.",
    href: "/spatial-crud",
    icon: MapPin,
    badge: "Database",
    accentBg: "bg-primary/10 text-primary border-primary/20",
    borderHover: "hover:border-primary/60 hover:shadow-md",
    featuresList: [
      "Pencatatan data lokasi dan koordinat",
      "Pengelompokan kategori fasilitas",
      "Pembaruan dan penghapusan data mandiri"
    ]
  },
  {
    id: "area-analysis",
    title: "3. Analisis Wilayah & Poligon",
    subtitle: "Pemetaan Batas Wilayah & Area",
    description: "Membantu memahami pembagian batas administratif wilayah, estimasi cakupan area, serta analisis keberadaan fasilitas di dalam suatu wilayah.",
    href: "/area-analysis",
    icon: Shapes,
    badge: "Analitik",
    accentBg: "bg-primary/10 text-primary border-primary/20",
    borderHover: "hover:border-primary/60 hover:shadow-md",
    featuresList: [
      "Visualisasi batas poligon wilayah",
      "Estimasi luas dan cakupan area",
      "Identifikasi sebaran fasilitas per wilayah"
    ]
  },
  {
    id: "geojson-tools",
    title: "4. GeoJSON Tools & Converter",
    subtitle: "Pengelolaan & Konversi Berkas Spasial",
    description: "Menyediakan sarana untuk melihat, memvalidasi, mengunggah, dan mengunduh data geospasial dalam format standar GeoJSON.",
    href: "/geojson-tools",
    icon: FileCode,
    badge: "Konversi",
    accentBg: "bg-primary/10 text-primary border-primary/20",
    borderHover: "hover:border-primary/60 hover:shadow-md",
    featuresList: [
      "Pemeriksaan struktur data GeoJSON",
      "Impor dan penyimpanan berkas lokal",
      "Ekspor berkas spasial siap pakai"
    ]
  },
  {
    id: "distance-routing",
    title: "5. Jarak & Rute Spasial",
    subtitle: "Pengukuran Jarak & Estimasi Jangkauan",
    description: "Menghitung estimasi jarak antar titik lokasi secara akurat serta memvisualisasikan radius jangkauan layanan dari suatu fasilitas.",
    href: "/distance-routing",
    icon: Route,
    badge: "Geodesik",
    accentBg: "bg-primary/10 text-primary border-primary/20",
    borderHover: "hover:border-primary/60 hover:shadow-md",
    featuresList: [
      "Pengukuran jarak langsung antar lokasi",
      "Simulasi radius jangkauan area",
      "Pencatatan riwayat perhitungan"
    ]
  },
  {
    id: "heatmap-density",
    title: "6. Peta Kepadatan & Heatmap",
    subtitle: "Visualisasi Konsentrasi Titik Wilayah",
    description: "Menampilkan pola sebaran dan tingkat kepadatan lokasi melalui gradien visual untuk mempermudah identifikasi area konsentrasi keramaian.",
    href: "/heatmap-density",
    icon: Flame,
    badge: "Visualisasi",
    accentBg: "bg-primary/10 text-primary border-primary/20",
    borderHover: "hover:border-primary/60 hover:shadow-md",
    featuresList: [
      "Peta gradien intensitas sebaran",
      "Penyesuaian parameter visualisasi",
      "Identifikasi konsentrasi keramaian"
    ]
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Ambient Glows */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-80 bg-linear-to-tr from-primary/10 via-primary/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      {/* Header Reusable Component */}
      <SiteHeader />

      {/* Hero Section */}
      <section className="pt-10 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative">
        <div className="typeset typeset-notes max-w-[46em] mx-auto text-center">
          <div className="not-typeset inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-secondary border border-border text-foreground mb-4 shadow-xs">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Sistem Informasi Geografis & Peta Interaktif Terpadu</span>
          </div>

          <h1 className="tracking-tight text-foreground text-3xl sm:text-4xl font-bold leading-tight mb-3">
            Pusat Layanan <span className="text-primary">Peta & Data Geospasial</span>
          </h1>

          <p className="text-muted-foreground leading-relaxed text-sm sm:text-base m-0">
            Silakan pilih modul layanan geospasial di bawah ini untuk memulai penjelajahan peta, pengelolaan titik fasilitas, analisis wilayah, hingga pengolahan berkas spasial.
          </p>

          {/* Quick Tech Badges */}
          <div className="not-typeset mt-5 flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <span className="px-3 py-1 rounded-xl bg-secondary border border-border flex items-center gap-1.5 shadow-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Peta Interaktif Responsif
            </span>
            <span className="px-3 py-1 rounded-xl bg-secondary border border-border flex items-center gap-1.5 shadow-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Pengelolaan Data Mandiri
            </span>
            <span className="px-3 py-1 rounded-xl bg-secondary border border-border flex items-center gap-1.5 shadow-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Penyimpanan Lokal Aman
            </span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-4 pb-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/80">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Daftar Modul Layanan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pilih salah satu modul di bawah untuk membuka halaman fitur
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono rounded-lg px-2.5 py-1">
            {features.length} Modul Tersedia
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <Card 
                key={item.id} 
                className={`group border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${item.borderHover} rounded-xl flex flex-col justify-between overflow-hidden relative shadow-xs`}
              >
                <div>
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between mb-2.5">
                      <div className={`p-2.5 rounded-xl border ${item.accentBg} shadow-xs transition-transform duration-200 group-hover:scale-105`}>
                        {item.isTelescope ? (
                          <TelescopeIcon size={22} className="text-primary" />
                        ) : Icon ? (
                          <Icon className="w-5.5 h-5.5 text-primary" />
                        ) : null}
                      </div>
                      <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5 rounded-md">
                        {item.badge}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </CardTitle>
                    <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
                      {item.subtitle}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1.5 space-y-3.5">
                    <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                      {item.description}
                    </p>

                    <div className="space-y-1.5 pt-2.5 border-t border-border/60">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1 font-mono">
                        Kemampuan Utama:
                      </span>
                      {item.featuresList.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/90 font-medium">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="p-4 pt-0">
                  <Link 
                    href={item.href}
                    className={buttonVariants({ 
                      variant: "outline", 
                      size: "sm",
                      className: "w-full rounded-xl hover:bg-primary hover:text-primary-foreground transition-colors text-xs sm:text-sm justify-between group-hover:border-primary/50 h-9 font-medium shadow-xs" 
                    })}
                  >
                    <span>Buka Modul Fitur</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Footer Reusable Component */}
      <SiteFooter />
    </div>
  );
}
