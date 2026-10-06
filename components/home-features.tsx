"use client";

import * as React from "react";
import Link from "next/link";
import { 
  MapPin, 
  Shapes, 
  FileCode, 
  Route, 
  Flame, 
  ArrowRight, 
  Lock
} from "lucide-react";
import { TelescopeIcon } from "@/components/ui/telescope";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  isTelescope?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  badge: string;
  accentBg: string;
  borderHover: string;
  featuresList: string[];
}

const features: FeatureItem[] = [
  {
    id: "global-maps",
    title: "1. Global Maps",
    subtitle: "Eksplorasi Peta Dunia & Pilih Tampilan Sesuai Dengan Yang Anda Inginkan.",
    description: "Menyediakan layanan penjelajahan peta interaktif dengan berbagai pilihan gaya visual secara cepat dan mudah.",
    href: "/global-maps",
    isTelescope: true,
    badge: "Standar",
    accentBg: "bg-secondary text-foreground border-border",
    borderHover: "hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/50",
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
    accentBg: "bg-secondary text-foreground border-border",
    borderHover: "hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/50",
    featuresList: [
      "Pencatatan data lokasi dan koordinat",
      "Pengelompokan kategori fasilitas",
      "Pembaruan dan penghapusan data mandiri"
    ]
  },
  {
    id: "distance-routing",
    title: "3. Pemetaan Jalan yang Dilalui",
    subtitle: "Gambar Rute Perjalanan di Peta",
    description: "Tandai titik-titik di peta, lalu sistem otomatis menggambar rute mengikuti jalan sebenarnya. Atur warna dan gaya garis, kelompokkan rute ke dalam folder, dan simpan agar bisa dibuka kembali kapan saja.",
    href: "/distance-routing",
    icon: Route,
    badge: "Database",
    accentBg: "bg-secondary text-foreground border-border",
    borderHover: "hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/50",
    featuresList: [
      "Buat rute otomatis mengikuti jalan dari beberapa titik",
      "Atur warna, ketebalan, dan gaya garis tiap rute",
      "Simpan rute ke folder dan lihat kembali di peta"
    ]
  },
  {
    id: "area-analysis",
    title: "4. Analisis Wilayah & Poligon",
    subtitle: "Pemetaan Batas Wilayah & Area",
    description: "Membantu memahami pembagian batas administratif wilayah, estimasi cakupan area, serta analisis keberadaan fasilitas di dalam suatu wilayah.",
    href: "/area-analysis",
    icon: Shapes,
    badge: "Analitik",
    accentBg: "bg-secondary text-foreground border-border",
    borderHover: "hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/50",
    featuresList: [
      "Visualisasi batas poligon wilayah",
      "Estimasi luas dan cakupan area",
      "Identifikasi sebaran fasilitas per wilayah"
    ]
  },
  {
    id: "geojson-tools",
    title: "5. GeoJSON Tools & Converter",
    subtitle: "Pengelolaan & Konversi Berkas Spasial",
    description: "Menyediakan sarana untuk melihat, memvalidasi, mengunggah, dan mengunduh data geospasial dalam format standar GeoJSON.",
    href: "/geojson-tools",
    icon: FileCode,
    badge: "Konversi",
    accentBg: "bg-secondary text-foreground border-border",
    borderHover: "hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/50",
    featuresList: [
      "Pemeriksaan struktur data GeoJSON",
      "Impor dan penyimpanan berkas lokal",
      "Ekspor berkas spasial siap pakai"
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
    accentBg: "bg-secondary text-foreground border-border",
    borderHover: "hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/50",
    featuresList: [
      "Peta gradien intensitas sebaran",
      "Penyesuaian parameter visualisasi",
      "Identifikasi konsentrasi keramaian"
    ]
  },
];

export function HomeFeatures() {
  const { isAuthenticated, isLoading, openAuthModal } = useAuth();

  return (
    <>
      {/* Grid of 6 modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {features.map((item) => {
          const Icon = item.icon;
          const isLocked = !isLoading && !isAuthenticated;

          return (
            <Card 
              key={item.id} 
              className="group border border-border bg-card transition-[transform,border-color,box-shadow] duration-200 transform-gpu will-change-transform hover:-translate-y-1 hover:border-zinc-500 hover:shadow-xl hover:shadow-black/30 dark:hover:shadow-black/70 rounded-lg flex flex-col justify-between overflow-hidden relative shadow-xs"
            >
              <div>
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg border border-border bg-secondary flex items-center justify-center text-foreground shadow-2xs transition-[transform,border-color,background-color,color] duration-200 transform-gpu group-hover:scale-105 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                      {item.isTelescope ? (
                        <TelescopeIcon size={18} className="text-inherit" />
                      ) : Icon ? (
                        <Icon className="w-4.5 h-4.5 text-inherit" />
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLocked ? (
                        <Badge 
                          variant="outline" 
                          className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border-border bg-secondary text-muted-foreground flex items-center gap-1 shadow-2xs animate-in fade-in"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Terkunci</span>
                        </Badge>
                      ) : null}

                      <Badge variant="secondary" className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border border-border">
                        {item.badge}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                    <span>{item.title}</span>
                  </CardTitle>

                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">
                    {item.subtitle}
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-2 space-y-4">
                  <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm">
                    {item.description}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-border">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 font-mono">
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

              <CardFooter className="p-6 pt-0">
                {isLocked ? (
                  <button
                    type="button"
                    onClick={() => openAuthModal({ 
                    tab: "login", 
                    redirectTo: item.href, 
                    moduleTitle: item.title 
                  })}
                    className="w-full h-10 px-4 rounded-lg border border-border bg-secondary hover:bg-muted text-foreground transition-colors text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs group/btn cursor-pointer"
                    title={`Masuk untuk membuka modul ${item.title}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5.5 h-5.5 rounded-md bg-card border border-border flex items-center justify-center text-foreground">
                        <Lock className="w-3 h-3" />
                      </div>
                      <span>Masuk untuk Buka Modul</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:translate-x-1 group-hover/btn:text-foreground transition-transform" />
                  </button>
                ) : (
                  <Link 
                    href={item.href}
                    prefetch={true}
                    className={buttonVariants({ 
                      variant: "outline", 
                      size: "default",
                      className: "w-full rounded-lg border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-[color,background-color,border-color] text-xs sm:text-sm justify-between h-10 font-medium shadow-xs" 
                    })}
                  >
                    <span>Buka Modul Fitur</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </>
  );
}
