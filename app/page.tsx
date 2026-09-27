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
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-200 h-80 bg-linear-to-b from-white/5 via-zinc-800/10 to-transparent blur-[140px] pointer-events-none -z-10 transform-gpu will-change-transform contain-strict" />

      <SiteHeader />

      <section className="pt-10 sm:pt-16 pb-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center relative">
        <div className="typeset typeset-docs max-w-[48em] mx-auto text-center">
          <h1 className="tracking-tight text-foreground text-3xl sm:text-5xl lg:text-6xl font-medium leading-[1.04] mb-5 text-balance">
            Pusat Layanan Peta &amp; Analisis Spasial
          </h1>

          <p className="text-muted-foreground leading-relaxed text-base sm:text-lg max-w-2xl mx-auto m-0 font-normal text-pretty">
            Platform komprehensif modular untuk penjelajahan peta dunia, pengelolaan data koordinat fasilitas, analisis poligon wilayah, hingga konversi data spasial standar.
          </p>
    
        </div>
      </section>

      <section className="py-4 pb-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full flex-1">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/80">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Daftar Modul Layanan
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Pilih salah satu modul di bawah untuk membuka halaman fitur
            </p>
          </div>
        </div>

        <HomeFeatures />
      </section>

      <SiteFooter />
    </div>
  );
}
