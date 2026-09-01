"use client";

import * as React from "react";
import { 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  HardDrive, 
  MapPin, 
  Shapes, 
  FileCode, 
  AlertTriangle,
  Globe2,
  Route,
  Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useGeoStorage } from "@/hooks/use-geo-storage";
import { ConfirmModal } from "@/components/confirm-modal";

export function StorageManagerDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = React.useState(false);
  const [importStatus, setImportStatus] = React.useState<"idle" | "success" | "error">("idle");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    isLoaded,
    globalLandmarks,
    crudFacilities,
    areaPolygons,
    geojsonFiles,
    routingWaypoints,
    heatmapPoints,
    downloadBackup,
    importBackup,
    resetToFactory,
  } = useGeoStorage();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      const success = importBackup(content);
      setImportStatus(success ? "success" : "error");
      setTimeout(() => setImportStatus("idle"), 4000);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmReset = () => {
    resetToFactory();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {/* Trigger Button */}
        <DialogTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex items-center gap-1.5 text-xs border-border bg-card/80 hover:bg-accent text-foreground shadow-xs"
              title="Kelola Penyimpanan Lokal Browser"
            />
          }
        >
          <HardDrive className="w-3.5 h-3.5 text-primary" />
          <span>Database Lokal</span>
          {isLoaded && (
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          )}
        </DialogTrigger>

        {/* Modal Dialog Content with DialogPortal */}
        <DialogContent className="max-w-xl">
          <DialogHeader className="flex flex-row items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle>
                Penyimpanan Lokal Modular (Terpisah Per Modul)
              </DialogTitle>
              <DialogDescription>
                Setiap modul memiliki database independen di browser Anda tanpa bercampur.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Storage Stats Grid (6 Independent Modules) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-1 text-center">
            {!isLoaded ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="p-2.5 rounded-2xl bg-secondary/60 border border-border space-y-2 animate-pulse">
                    <Skeleton className="h-3 w-20 mx-auto" />
                    <Skeleton className="h-5 w-12 mx-auto" />
                  </div>
                ))}
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                    <Globe2 className="w-3 h-3 text-primary" />
                    <span>Global Maps</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-foreground">
                    {globalLandmarks.length} <span className="text-[10px] font-normal text-muted-foreground">Landmark</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                    <MapPin className="w-3 h-3 text-primary" />
                    <span>Spatial CRUD</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-foreground">
                    {crudFacilities.length} <span className="text-[10px] font-normal text-muted-foreground">Fasilitas</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                    <Shapes className="w-3 h-3 text-primary" />
                    <span>Poligon Wilayah</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-foreground">
                    {areaPolygons.length} <span className="text-[10px] font-normal text-muted-foreground">Wilayah</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                    <FileCode className="w-3 h-3 text-primary" />
                    <span>GeoJSON Tools</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-foreground">
                    {geojsonFiles.length} <span className="text-[10px] font-normal text-muted-foreground">Berkas</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                    <Route className="w-3 h-3 text-primary" />
                    <span>Rute Spasial</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-foreground">
                    {routingWaypoints.length} <span className="text-[10px] font-normal text-muted-foreground">Waypoints</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-2xl bg-secondary/80 border border-border">
                  <div className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground mb-0.5">
                    <Flame className="w-3 h-3 text-primary" />
                    <span>Heatmap Hotspot</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-foreground">
                    {heatmapPoints.length} <span className="text-[10px] font-normal text-muted-foreground">Titik</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Backup & Restore Action Buttons */}
          <div className="space-y-2.5">
            <Button
              onClick={downloadBackup}
              className="w-full justify-between text-xs h-9 shadow-xs"
            >
              <span className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Download Backup Seluruh Database Modular (.json)
              </span>
              <Badge variant="outline" className="text-[10px] bg-primary-foreground/20 text-primary-foreground border-none">
                Simpan ke PC
              </Badge>
            </Button>

            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-between text-xs h-9"
              >
                <span className="flex items-center gap-2">
                  <Upload className="w-3.5 h-3.5 text-primary" />
                  Restore / Import File Database (.json)
                </span>
                <span className="text-[11px] text-muted-foreground">Pilih Berkas</span>
              </Button>
            </div>

            {importStatus === "success" && (
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/30 text-xs text-primary flex items-center gap-2 animate-in fade-in duration-200">
                <Check className="w-4 h-4" />
                <span>Seluruh database modular berhasil dipulihkan dari file backup!</span>
              </div>
            )}

            {importStatus === "error" && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive flex items-center gap-2 animate-in fade-in duration-200">
                <AlertTriangle className="w-4 h-4" />
                <span>Format file backup tidak valid. Pastikan file JSON yang benar.</span>
              </div>
            )}
          </div>

          {/* Reset Factory Section */}
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground">
              Kembalikan seluruh modul ke data bawaan awal?
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Reset Semua Modul
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modern Pop-up Confirm Modal for Reset Action */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Semua Database Modular?"
        description="Tindakan ini akan mengembalikan data di semua modul (Global Maps, Spatial CRUD, Analisis Wilayah, GeoJSON, Rute, Heatmap) ke data bawaan awal."
        confirmText="Ya, Reset Semua"
        cancelText="Batalkan"
        variant="warning"
        icon={RotateCcw}
      />
    </>
  );
}
