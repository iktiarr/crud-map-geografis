"use client";

import * as React from "react";
import { Layers, Navigation, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickToolbarProps {
  onOpenBasemap: () => void;
  onLocateUser: () => void;
  onOpenAi: () => void;
  isLocating: boolean;
  activeBasemapName: string;
}

export function QuickToolbar({
  onOpenBasemap,
  onLocateUser,
  onOpenAi,
  isLocating,
  activeBasemapName,
}: QuickToolbarProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Basemap Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onOpenBasemap}
        className="h-10 px-3 sm:px-3.5 rounded-xl border-border bg-card/90 backdrop-blur-md hover:bg-card text-foreground text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
        title="Ubah Gaya Tampilan Peta"
      >
        <Layers className="w-4 h-4 text-primary shrink-0" />
        <span className="hidden md:inline truncate max-w-32">{activeBasemapName}</span>
        <span className="md:hidden">Layer</span>
      </Button>

      {/* GPS Location Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onLocateUser}
        disabled={isLocating}
        className="h-10 px-3 rounded-xl border-border bg-card/90 backdrop-blur-md hover:bg-card text-foreground text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
        title="Arahkan ke Posisi GPS Saya"
      >
        <Navigation className={`w-4 h-4 text-blue-500 ${isLocating ? "animate-spin" : ""}`} />
        <span className="hidden sm:inline">Lokasi Saya</span>
      </Button>

      {/* AI Assistant Button */}
      <Button
        type="button"
        size="sm"
        onClick={onOpenAi}
        className="h-10 px-3.5 sm:px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
      >
        <Bot className="w-4 h-4" />
        <span>Asisten AI</span>
      </Button>
    </div>
  );
}
