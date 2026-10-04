"use client";

import * as React from "react";
import {
  UploadCloud,
  CheckCircle2,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { WaypointItem } from "../tipe";
import { parseRouteFile, downsamplePoints, ImportedTrackPoint } from "@/lib/route-import";

interface ImportPerjalananProps {
  onImportWaypoints?: (newWaypoints: WaypointItem[], mode: "snap_roads" | "keep_original") => void;
}

export function ImportPerjalanan({ onImportWaypoints }: ImportPerjalananProps) {
  const [importFileName, setImportFileName] = React.useState<string | null>(null);
  const [importFileType, setImportFileType] = React.useState<string | null>(null);
  const [importRawPoints, setImportRawPoints] = React.useState<ImportedTrackPoint[] | null>(null);
  const [importMode, setImportMode] = React.useState<"snap_roads" | "keep_original">("snap_roads");
  const [isImportLoading, setIsImportLoading] = React.useState(false);
  const [importError, setImportError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportLoading(true);
    setImportError(null);

    try {
      const text = await file.text();
      const parsed = parseRouteFile(file.name, text);

      if (!parsed.points || parsed.points.length === 0) {
        setImportError("Tidak ditemukan titik koordinat rute yang valid dalam file ini.");
        return;
      }

      setImportFileName(file.name);
      setImportFileType(parsed.fileType.toUpperCase());
      setImportRawPoints(parsed.points);
    } catch {
      setImportError("Gagal membaca file perjalanan. Pastikan format file sesuai.");
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleApplyImportedRoute = () => {
    if (!importRawPoints || importRawPoints.length === 0 || !onImportWaypoints) return;

    const pointsToUse =
      importRawPoints.length > 80
        ? downsamplePoints(importRawPoints, 80)
        : importRawPoints;

    const newWaypoints: WaypointItem[] = pointsToUse.map((pt, idx) => ({
      id: `imported-${Date.now()}-${idx}`,
      name:
        pt.name ||
        (idx === 0
          ? "Titik Awal (Import)"
          : idx === pointsToUse.length - 1
          ? "Titik Akhir (Import)"
          : `Waypoint ${idx + 1}`),
      lat: pt.lat,
      lng: pt.lng,
      connectionType: "sequential",
    }));

    onImportWaypoints(newWaypoints, importMode);
    setImportFileName(null);
    setImportRawPoints(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2 p-3 rounded-xl border border-border bg-secondary/20">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
          <UploadCloud className="w-3.5 h-3.5 text-primary" />
          <span>Import Perjalanan / Rute</span>
        </label>
        <div className="flex items-center gap-1">
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
            GPX
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
            KML
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
            GeoJSON
          </span>
          <span className="text-[9px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
            CSV
          </span>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.geojson,.gpx,.kml,.csv,.txt"
        onChange={handleFileSelected}
        className="hidden"
      />

      {!importFileName ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImportLoading}
          className="w-full py-2.5 px-3 rounded-xl border border-dashed border-border hover:border-primary/60 bg-background/60 hover:bg-secondary/50 text-xs text-foreground font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {isImportLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Membaca file...</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4 text-primary" />
              <span>Pilih File (Google Maps / GPX / GeoJSON / KML / CSV)</span>
            </>
          )}
        </button>
      ) : (
        <div className="space-y-2.5 p-2.5 rounded-xl bg-background border border-emerald-500/30">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 truncate min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-foreground truncate flex items-center gap-1.5">
                  <span>{importFileName}</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                    {importFileType}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✓ Berhasil membaca {importRawPoints?.length || 0} titik koordinat
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setImportFileName(null);
                setImportRawPoints(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              title="Ganti file"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 pt-1.5 border-t border-border/50">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
              Pilihan Desain Rute:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setImportMode("snap_roads")}
                className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                  importMode === "snap_roads"
                    ? "bg-primary/10 border-primary ring-1 ring-primary/40 font-medium text-foreground"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold">Sesuaikan dengan jalan</span>
                  {importMode === "snap_roads" && (
                    <Check className="w-3 h-3 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                  Jalur disesuaikan dengan lekukan jalan resmi.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setImportMode("keep_original")}
                className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                  importMode === "keep_original"
                    ? "bg-primary/10 border-primary ring-1 ring-primary/40 font-medium text-foreground"
                    : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold">Biarkan seperti awal</span>
                  {importMode === "keep_original" && (
                    <Check className="w-3 h-3 text-primary shrink-0" />
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                  Bawaan dari file, tanpa perubahan geometri.
                </p>
              </button>
            </div>

            <button
              type="button"
              onClick={handleApplyImportedRoute}
              className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan {importRawPoints?.length || 0} Titik ke Peta</span>
            </button>
          </div>
        </div>
      )}

      {importError && (
        <div className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[11px]">
          {importError}
        </div>
      )}
    </div>
  );
}
