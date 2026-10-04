"use client";

import * as React from "react";
import {
  Download,
  Image,
  Globe,
  Navigation,
  MapPin,
  Table,
  FileCode,
  Code,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { TraversedRoadRecord } from "../tipe";
import {
  EXPORT_FORMAT_OPTIONS,
  ExportFormat,
  exportAsGeoJSON,
  exportAsJSON,
  exportAsGPX,
  exportAsKML,
  exportAsCSV,
  exportAsSVG,
  exportAsMapImage,
} from "@/lib/route-export";

interface ModalEksporProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  routes: TraversedRoadRecord[];
  onSuccessToast?: (msg: string) => void;
}

export function ModalEkspor({
  isOpen,
  onClose,
  title,
  routes,
  onSuccessToast,
}: ModalEksporProps) {
  const [isExporting, setIsExporting] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat | null>(null);

  if (!isOpen) return null;

  const handleExport = async (format: ExportFormat) => {
    if (routes.length === 0) {
      alert("Tidak ada rute yang tersedia untuk diekspor.");
      return;
    }

    setSelectedFormat(format);
    setIsExporting(true);

    try {
      if (format === "png" || format === "jpeg") {
        await exportAsMapImage(routes, title, format);
      } else if (format === "svg") {
        exportAsSVG(routes, title);
      } else if (format === "geojson") {
        exportAsGeoJSON(routes, title);
      } else if (format === "gpx") {
        exportAsGPX(routes, title);
      } else if (format === "kml") {
        exportAsKML(routes, title);
      } else if (format === "csv") {
        exportAsCSV(routes, title);
      } else if (format === "json") {
        exportAsJSON(routes, title);
      }

      onSuccessToast?.(`Berhasil mengekspor format ${format.toUpperCase()}!`);
      setTimeout(() => {
        setIsExporting(false);
        setSelectedFormat(null);
        onClose();
      }, 500);
    } catch (err) {
      console.error("Gagal ekspor data:", err);
      alert("Gagal melakukan ekspor berkas. Silakan coba lagi.");
      setIsExporting(false);
      setSelectedFormat(null);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "Image":
        return <Image className="w-4 h-4 text-emerald-500" />;
      case "FileCode":
        return <FileCode className="w-4 h-4 text-purple-500" />;
      case "Globe":
        return <Globe className="w-4 h-4 text-blue-500" />;
      case "Navigation":
        return <Navigation className="w-4 h-4 text-amber-500" />;
      case "MapPin":
        return <MapPin className="w-4 h-4 text-red-500" />;
      case "Table":
        return <Table className="w-4 h-4 text-teal-500" />;
      case "Code":
        return <Code className="w-4 h-4 text-indigo-500" />;
      default:
        return <Download className="w-4 h-4 text-primary" />;
    }
  };

  const imageFormats = EXPORT_FORMAT_OPTIONS.filter((f) => f.category === "image");
  const spatialFormats = EXPORT_FORMAT_OPTIONS.filter((f) => f.category === "spatial");
  const dataFormats = EXPORT_FORMAT_OPTIONS.filter((f) => f.category === "data");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-card border border-border rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
              <Download className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                Ekspor Berkas: {title}
              </h3>
              <p className="text-xs text-muted-foreground">
                Pilih format berkas untuk mengunduh {routes.length} rute terpilih
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content / Options List */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1 text-xs">
          {/* Kategori 1: Gambar & Visual Peta */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <span>🖼️ Tampilan Gambar & Peta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {imageFormats.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleExport(opt.id)}
                  disabled={isExporting}
                  className="p-3 rounded-xl border border-border bg-background hover:border-primary hover:bg-secondary/40 text-left transition-all flex items-start gap-2.5 group cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(opt.iconName)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isExporting && selectedFormat === opt.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Kategori 2: Format Spasial GIS */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <span>🗺️ Format Spasial GIS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {spatialFormats.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleExport(opt.id)}
                  disabled={isExporting}
                  className="p-3 rounded-xl border border-border bg-background hover:border-primary hover:bg-secondary/40 text-left transition-all flex items-start gap-2.5 group cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(opt.iconName)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isExporting && selectedFormat === opt.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Kategori 3: Tabel & Data Mentah */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1 flex items-center gap-1.5">
              <span>📊 Tabel & Format Data Mentah</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dataFormats.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleExport(opt.id)}
                  disabled={isExporting}
                  className="p-3 rounded-xl border border-border bg-background hover:border-primary hover:bg-secondary/40 text-left transition-all flex items-start gap-2.5 group cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <div className="mt-0.5 shrink-0">{renderIcon(opt.iconName)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                      <span>{opt.label}</span>
                      {isExporting && selectedFormat === opt.id ? (
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                      ) : null}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>Format didukung penuh untuk software GIS & GPS</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isExporting}
            className="h-8 px-3 rounded-lg text-xs cursor-pointer"
          >
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
}
