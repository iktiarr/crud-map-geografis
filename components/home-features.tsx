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
  Lock,
  LogIn,
  ShieldCheck
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
    id: "area-analysis",
    title: "3. Analisis Wilayah & Poligon",
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
    title: "4. GeoJSON Tools & Converter",
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
    id: "distance-routing",
    title: "5. Jarak & Rute Spasial",
    subtitle: "Pengukuran Jarak & Estimasi Jangkauan",
    description: "Menghitung estimasi jarak antar titik lokasi secara akurat serta memvisualisasikan radius jangkauan layanan dari suatu fasilitas.",
    href: "/distance-routing",
    icon: Route,
    badge: "Geodesik",
    accentBg: "bg-secondary text-foreground border-border",
    borderHover: "hover:border-zinc-500/80 hover:shadow-lg hover:shadow-black/50",
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
  const { user, isAuthenticated, isLoading, openAuthModal } = useAuth();

  return (
    <>
      {/* Status banner */}
      {!isLoading && !isAuthenticated && (
        <div className="mb-6 p-4.5 rounded-3xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground shrink-0">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-foreground flex items-center gap-2">
                <span>Modul Terkunci untuk Mode Tamu</span>
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-secondary border border-border text-foreground font-semibold">
                  Perlu Masuk
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Silakan masuk melalui tombol pengaturan atau tekan tombol gembok pada modul untuk membuka akses.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal({ tab: "login" })}
            className="self-end sm:self-auto px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-[#cdffad] hover:text-[#0e0f0c] transition-all flex items-center gap-2 shadow-xs shrink-0 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk Sekarang</span>
          </button>
        </div>
      )}

      {!isLoading && isAuthenticated && user && (
        <div className="mb-6 p-4 rounded-3xl border border-border bg-card flex items-center justify-between gap-3.5 shadow-xs">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#e2f6d5] dark:bg-[#1f3016] text-[#054d28] dark:text-[#cdffad] border border-border flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-foreground flex items-center gap-2 truncate">
                <span>Selamat Datang, {user.name}</span>
                <span className="text-[11px] font-mono px-3 py-0.5 rounded-full bg-[#e2f6d5] dark:bg-[#1f3016] text-[#054d28] dark:text-[#cdffad] border border-border font-semibold shrink-0">
                  Semua Modul Terbuka
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Akses penuh ke seluruh 6 modul geospasial telah aktif.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid of 6 modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {features.map((item) => {
          const Icon = item.icon;
          const isLocked = !isLoading && !isAuthenticated;

          return (
            <Card 
              key={item.id} 
              className="group border border-border bg-card transition-all duration-200 hover:-translate-y-1 hover:border-primary/80 hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/40 rounded-3xl flex flex-col justify-between overflow-hidden relative shadow-xs"
            >
              <div>
                <CardHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-full border border-border bg-secondary flex items-center justify-center text-foreground shadow-2xs transition-transform duration-200 group-hover:scale-105 group-hover:border-primary group-hover:bg-[#cdffad]/20 group-hover:text-[#0e0f0c]">
                      {item.isTelescope ? (
                        <TelescopeIcon size={20} className="text-inherit" />
                      ) : Icon ? (
                        <Icon className="w-5 h-5 text-inherit" />
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isLocked ? (
                        <Badge 
                          variant="outline" 
                          className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border-border bg-secondary text-foreground flex items-center gap-1 shadow-2xs animate-in fade-in"
                        >
                          <Lock className="w-3 h-3 text-muted-foreground" />
                          <span>Terkunci</span>
                        </Badge>
                      ) : null}

                      <Badge variant="secondary" className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full border border-border">
                        {item.badge}
                      </Badge>
                    </div>
                  </div>

                  <CardTitle className="text-lg sm:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
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
                    className="w-full h-11 px-4.5 rounded-full border border-border bg-secondary hover:bg-muted text-foreground transition-all text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs group/btn cursor-pointer"
                    title={`Masuk untuk membuka modul ${item.title}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-foreground">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                      <span>Masuk untuk Buka Modul</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/btn:translate-x-1 group-hover/btn:text-foreground transition-all" />
                  </button>
                ) : (
                  <Link 
                    href={item.href}
                    className={buttonVariants({ 
                      variant: "outline", 
                      size: "default",
                      className: "w-full rounded-full border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all text-xs sm:text-sm justify-between h-11 font-semibold shadow-xs" 
                    })}
                  >
                    <span>Buka Modul Fitur</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary-foreground group-hover:translate-x-1 transition-all" />
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
