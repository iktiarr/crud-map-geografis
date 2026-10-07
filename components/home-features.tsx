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
import { useAuth } from "@/contexts/auth-context";

interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  isTelescope?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  iconStyle: string;
  titleHoverStyle: string;
  bulletColor: string;
  borderHoverStyle: string;
  buttonHoverStyle: string;
  featuresList: string[];
}

const features: FeatureItem[] = [
  {
    id: "modul_1",
    title: "Global Maps",
    subtitle: "Eksplorasi Peta Dunia",
    description: "Menyediakan layanan penjelajahan peta interaktif dengan berbagai pilihan gaya visual secara cepat dan mudah.",
    href: "/modul_1",
    isTelescope: true,
    iconStyle: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25 group-hover:bg-sky-500 group-hover:text-white group-hover:border-sky-500",
    titleHoverStyle: "group-hover:text-sky-600 dark:group-hover:text-sky-400",
    bulletColor: "bg-sky-500",
    borderHoverStyle: "hover:border-sky-500/50 hover:shadow-sky-500/10",
    buttonHoverStyle: "hover:bg-sky-500 hover:text-white hover:border-sky-500",
    featuresList: [
      "Berbagai pilihan gaya tampilan peta",
      "Citra satelit dan kontur permukaan bumi",
      "Navigasi penjelajahan wilayah responsif"
    ]
  },
  {
    id: "modul_2",
    title: "CRUD Data Spasial",
    subtitle: "Pengelolaan Data Titik Koordinat",
    description: "Memfasilitasi pencatatan, pembaruan, dan pengelolaan data lokasi fasilitas publik beserta informasi alamat dan titik koordinatnya.",
    href: "/modul_2",
    icon: MapPin,
    iconStyle: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500",
    titleHoverStyle: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
    bulletColor: "bg-emerald-500",
    borderHoverStyle: "hover:border-emerald-500/50 hover:shadow-emerald-500/10",
    buttonHoverStyle: "hover:bg-emerald-500 hover:text-white hover:border-emerald-500",
    featuresList: [
      "Pencatatan data lokasi dan koordinat",
      "Pengelompokan kategori fasilitas",
      "Pembaruan dan penghapusan data mandiri"
    ]
  },
  {
    id: "modul_3",
    title: "Pemetaan Jalan yang Dilalui",
    subtitle: "Gambar Rute Perjalanan di Peta",
    description: "Tandai titik-titik di peta, lalu sistem otomatis menggambar rute mengikuti jalan sebenarnya. Atur warna dan gaya garis, kelompokkan rute ke dalam folder, dan simpan agar bisa dibuka kembali kapan saja.",
    href: "/modul_3",
    icon: Route,
    iconStyle: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-500",
    titleHoverStyle: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400",
    bulletColor: "bg-indigo-500",
    borderHoverStyle: "hover:border-indigo-500/50 hover:shadow-indigo-500/10",
    buttonHoverStyle: "hover:bg-indigo-500 hover:text-white hover:border-indigo-500",
    featuresList: [
      "Buat rute otomatis mengikuti jalan dari beberapa titik",
      "Atur warna, ketebalan, dan gaya garis tiap rute",
      "Simpan rute ke folder dan lihat kembali di peta"
    ]
  },
  {
    id: "modul_4",
    title: "Analisis Wilayah & Poligon",
    subtitle: "Pemetaan Batas Wilayah & Area",
    description: "Membantu memahami pembagian batas administratif wilayah, estimasi cakupan area, serta analisis keberadaan fasilitas di dalam suatu wilayah.",
    href: "/modul_4",
    icon: Shapes,
    iconStyle: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25 group-hover:bg-purple-500 group-hover:text-white group-hover:border-purple-500",
    titleHoverStyle: "group-hover:text-purple-600 dark:group-hover:text-purple-400",
    bulletColor: "bg-purple-500",
    borderHoverStyle: "hover:border-purple-500/50 hover:shadow-purple-500/10",
    buttonHoverStyle: "hover:bg-purple-500 hover:text-white hover:border-purple-500",
    featuresList: [
      "Visualisasi batas poligon wilayah",
      "Estimasi luas dan cakupan area",
      "Identifikasi sebaran fasilitas per wilayah"
    ]
  },
  {
    id: "modul_5",
    title: "GeoJSON Tools & Converter",
    subtitle: "Pengelolaan & Konversi Berkas Spasial",
    description: "Menyediakan sarana untuk melihat, memvalidasi, mengunggah, dan mengunduh data geospasial dalam format standar GeoJSON.",
    href: "/modul_5",
    icon: FileCode,
    iconStyle: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500",
    titleHoverStyle: "group-hover:text-amber-600 dark:group-hover:text-amber-400",
    bulletColor: "bg-amber-500",
    borderHoverStyle: "hover:border-amber-500/50 hover:shadow-amber-500/10",
    buttonHoverStyle: "hover:bg-amber-500 hover:text-white hover:border-amber-500",
    featuresList: [
      "Pemeriksaan struktur data GeoJSON",
      "Impor dan penyimpanan berkas lokal",
      "Ekspor berkas spasial siap pakai"
    ]
  },
  {
    id: "modul_6",
    title: "Peta Kepadatan & Heatmap",
    subtitle: "Visualisasi Konsentrasi Titik Wilayah",
    description: "Menampilkan pola sebaran dan tingkat kepadatan lokasi melalui gradien visual untuk mempermudah identifikasi area konsentrasi keramaian.",
    href: "/modul_6",
    icon: Flame,
    iconStyle: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-500",
    titleHoverStyle: "group-hover:text-rose-600 dark:group-hover:text-rose-400",
    bulletColor: "bg-rose-500",
    borderHoverStyle: "hover:border-rose-500/50 hover:shadow-rose-500/10",
    buttonHoverStyle: "hover:bg-rose-500 hover:text-white hover:border-rose-500",
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
              className={`group border border-border bg-card transition-all duration-200 transform-gpu will-change-transform hover:-translate-y-1 ${item.borderHoverStyle} hover:shadow-xl rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-xs`}
            >
              <div>
                <CardHeader className="p-5 sm:p-6 pb-2">
                  {/* Compact Header: Icon & Title together */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-all duration-200 transform-gpu group-hover:scale-105 ${item.iconStyle}`}>
                      {item.isTelescope ? (
                        <TelescopeIcon size={19} className="text-inherit" />
                      ) : Icon ? (
                        <Icon className="w-5 h-5 text-inherit" />
                      ) : null}
                    </div>

                    <div className="min-w-0 flex-1">
                      <CardTitle className={`text-base sm:text-lg font-bold text-foreground transition-colors truncate ${item.titleHoverStyle}`}>
                        {item.title}
                      </CardTitle>
                    </div>

                    {isLocked && (
                      <div className="p-1 rounded-md bg-secondary/80 border border-border/60 text-muted-foreground shrink-0" title="Terkunci - Masuk untuk Buka">
                        <Lock className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-2 line-clamp-1">
                    {item.subtitle}
                  </div>
                </CardHeader>

                <CardContent className="p-5 sm:p-6 pt-2 space-y-4">
                  <p className="text-muted-foreground leading-relaxed text-xs sm:text-sm line-clamp-3">
                    {item.description}
                  </p>

                  <div className="space-y-2 pt-3 border-t border-border/80">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1.5 font-mono">
                      Kemampuan Utama:
                    </span>
                    {item.featuresList.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-foreground/90 font-medium">
                        <div className={`w-1.5 h-1.5 rounded-full ${item.bulletColor} shrink-0`} />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </div>

              <CardFooter className="p-5 sm:p-6 pt-0">
                {isLocked ? (
                  <button
                    type="button"
                    onClick={() => openAuthModal({ 
                      tab: "login", 
                      redirectTo: item.href, 
                      moduleTitle: item.title 
                    })}
                    className="w-full h-10 px-4 rounded-xl border border-border bg-secondary hover:bg-muted text-foreground transition-colors text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs group/btn cursor-pointer"
                    title={`Masuk untuk membuka modul ${item.title}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5.5 h-5.5 rounded-lg bg-card border border-border flex items-center justify-center text-foreground">
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
                    className={`w-full rounded-xl border border-border bg-card ${item.buttonHoverStyle} transition-all text-xs sm:text-sm flex items-center justify-between h-10 px-4 font-semibold shadow-xs group/link cursor-pointer`}
                  >
                    <span>Buka Modul Fitur</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/link:text-white group-hover/link:translate-x-1 transition-all" />
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
