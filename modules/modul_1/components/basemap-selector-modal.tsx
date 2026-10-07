"use client";

import * as React from "react";
import { Layers, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BASEMAP_OPTIONS, type BasemapOption } from "@/components/map/basemap-config";

interface BasemapSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBasemapId: string;
  onSelectBasemap: (id: string) => void;
}

export function BasemapSelectorModal({
  isOpen,
  onClose,
  activeBasemapId,
  onSelectBasemap,
}: BasemapSelectorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm sm:max-w-md bg-card/95 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-border/80 flex items-center justify-between bg-secondary/40 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs shrink-0">
            <Layers className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="font-bold text-xs sm:text-sm text-foreground">
              Pilihan Tampilan Peta
            </div>
            <div className="text-[11px] text-muted-foreground">
              Pilih gaya visual basemap yang Anda inginkan
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer shrink-0 -mr-1"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Basemap Options List */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2.5">
        {BASEMAP_OPTIONS.map((b: BasemapOption) => {
          const isSelected = b.id === activeBasemapId;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                onSelectBasemap(b.id);
                onClose();
              }}
              className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between group cursor-pointer ${
                isSelected
                  ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40"
                  : "border-border hover:border-zinc-400 bg-secondary/30 hover:bg-secondary/70 text-foreground"
              }`}
            >
              <div className="min-w-0 flex-1 pr-2.5">
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                  <span className={isSelected ? "text-primary" : "text-foreground group-hover:text-primary transition-colors"}>
                    {b.name}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                  {b.description}
                </div>
              </div>

              {isSelected ? (
                <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Check className="w-3 h-3 stroke-3" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-border group-hover:border-zinc-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
