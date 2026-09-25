import { 
  Sparkles, 
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HomeFeatures } from "@/components/home-features";

export const metadata = {
  title: "GeoSpatial Studio - GIS & Global Maps",
  description: "Platform Geografis modern dengan modul Global Maps, Spatial CRUD, Analisis Poligon, GeoJSON Tools, dan Heatmap Density.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20 selection:text-primary">
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-80 bg-linear-to-tr from-primary/10 via-primary/5 to-transparent blur-[120px] pointer-events-none -z-10" />

      <SiteHeader />

      <section className="pt-8 sm:pt-14 pb-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative">
        <div className="typeset typeset-docs max-w-[46em] mx-auto text-center">
          <div className="not-typeset inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-card border border-border text-foreground mb-5 shadow-xs">
            <Sparkles className="w-4 h-4 text-primary fill-primary/30" />
            <span>Sistem Informasi Geografis &amp; Peta Interaktif Terpadu</span>
          </div>

          <h1 className="tracking-tight text-foreground text-3xl sm:text-5xl lg:text-6xl font-black leading-[1.08] mb-4">
            Pusat Layanan <span className="underline decoration-primary decoration-4 underline-offset-4">Peta &amp; Geospasial</span>
          </h1>

          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg max-w-2xl mx-auto m-0">
            Silakan pilih modul layanan geospasial di bawah ini untuk memulai penjelajahan peta, pengelolaan titik fasilitas, analisis wilayah, hingga pengolahan berkas spasial.
          </p>

          <div className="not-typeset mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm text-foreground">
            <span className="px-4 py-2 rounded-full bg-card border border-border flex items-center gap-2 shadow-2xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Peta Interaktif Responsif
            </span>
            <span className="px-4 py-2 rounded-full bg-card border border-border flex items-center gap-2 shadow-2xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Pengelolaan Data Mandiri
            </span>
            <span className="px-4 py-2 rounded-full bg-card border border-border flex items-center gap-2 shadow-2xs font-semibold">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Penyimpanan Terpadu Aman
            </span>
          </div>
        </div>
      </section>

      <section className="py-4 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Daftar Modul Layanan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pilih salah satu modul di bawah untuk membuka halaman fitur
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono rounded-full px-3 py-1 shrink-0 font-semibold border-border">
            6 Modul Tersedia
          </Badge>
        </div>

        <HomeFeatures />
      </section>

      <SiteFooter />
    </div>
  );
}
