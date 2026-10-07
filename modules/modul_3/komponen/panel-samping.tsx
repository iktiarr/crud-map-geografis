import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, AlertTriangle } from "lucide-react";
import { BasemapCombobox } from "@/components/ui/basemap-combobox";

interface PanelSampingProps {
  isOpen: boolean;
  onClose: () => void;
  activeBasemapId: string;
  onBasemapChange: (id: string) => void;
  dbError: string | null;
  children: React.ReactNode;
}

export function PanelSamping({
  isOpen,
  onClose,
  activeBasemapId,
  onBasemapChange,
  dbError,
  children,
}: PanelSampingProps) {
  return (
    <aside
      className={`h-full flex flex-col bg-card/95 backdrop-blur-md border-r border-border/80 z-20 shadow-xl transition-all duration-300 ease-in-out shrink-0 ${
        isOpen
          ? "w-full md:w-96 lg:w-105 xl:w-md"
          : "w-0 md:w-0 overflow-hidden border-r-0"
      }`}
    >
      {/* HEADER PANEL SAMPING */}
      <div className="p-3.5 border-b border-border/80 bg-muted/20 flex flex-col gap-2.5 shrink-0">
        {/* Tombol Beranda & Tutup Panel */}
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-all border border-border shadow-xs group"
            title="Kembali ke Beranda"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-primary transition-transform group-hover:-translate-x-1" />
            <span>Beranda</span>
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground md:flex hidden cursor-pointer"
            title="Tutup Panel Samping"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* PETA DASAR COMBOBOX */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between px-0.5">
            <span>Peta Dasar</span>
          </label>
          <BasemapCombobox
            value={activeBasemapId}
            onChange={onBasemapChange}
          />
        </div>
      </div>

      {/* BODY PANEL SAMPING (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
        {dbError && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{dbError}</span>
          </div>
        )}

        {children}
      </div>
    </aside>
  );
}
