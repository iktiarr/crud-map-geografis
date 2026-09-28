import * as React from "react";
import {
  Palette,
  Route,
  Check,
  RotateCcw,
  Plus,
  Loader2,
  MapPin,
  MoveUp,
  MoveDown,
  Trash2,
  ArrowUpDown,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLOR_PALETTE } from "../konfigurasi";
import {
  WaypointItem,
  MultiPointRouteResult,
  LineStyle,
} from "../tipe";

interface TambahRuteProps {
  selectedFolder: string;
  allFolderList: string[];
  filteredRoutesCount: number;
  onSetFolderSubTab: (tab: "routes-list" | "add-route") => void;

  // Form Kustomisasi Garis
  routeName: string;
  onRouteNameChange: (val: string) => void;
  targetFolder: string;
  onTargetFolderChange: (val: string) => void;
  customColor: string;
  onCustomColorChange: (val: string) => void;
  customWeight: number;
  onCustomWeightChange: (val: number) => void;
  customOpacity: number;
  customLineStyle: LineStyle;
  onCustomLineStyleChange: (val: LineStyle) => void;

  // Waypoints & Simpan
  waypoints: WaypointItem[];
  draftRouteData: MultiPointRouteResult | null;
  isCalculatingRoute: boolean;
  isSaving: boolean;
  onSaveRoute: () => void;
  onResetWaypoints: () => void;
  onRemoveWaypoint: (index: number) => void;
  onMoveWaypoint: (index: number, direction: "up" | "down") => void;
  onReverseAllWaypoints: () => void;
  onAddIntermediatePoint: () => void;
}

export function TambahRute({
  selectedFolder,
  allFolderList,
  filteredRoutesCount,
  onSetFolderSubTab,
  routeName,
  onRouteNameChange,
  targetFolder,
  onTargetFolderChange,
  customColor,
  onCustomColorChange,
  customWeight,
  onCustomWeightChange,
  customOpacity,
  customLineStyle,
  onCustomLineStyleChange,
  waypoints,
  draftRouteData,
  isCalculatingRoute,
  isSaving,
  onSaveRoute,
  onResetWaypoints,
  onRemoveWaypoint,
  onMoveWaypoint,
  onReverseAllWaypoints,
  onAddIntermediatePoint,
}: TambahRuteProps) {
  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Navigasi Atas */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <button
          type="button"
          onClick={() => onSetFolderSubTab("routes-list")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Rute</span>
        </button>

        <span className="text-[11px] text-muted-foreground font-mono">
          Folder: <strong className="text-foreground">{selectedFolder}</strong>
        </span>
      </div>

      {/* Sub Navigation Tab: Daftar Rute vs Tambah Rute */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-lg border border-border text-xs font-semibold">
        <button
          type="button"
          onClick={() => onSetFolderSubTab("routes-list")}
          className="py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-muted-foreground hover:text-foreground"
        >
          <Route className="w-3.5 h-3.5" />
          <span>Daftar Rute ({filteredRoutesCount})</span>
        </button>
        <button
          type="button"
          onClick={() => onSetFolderSubTab("add-route")}
          className="py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-card text-foreground shadow-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Tambah Rute</span>
        </button>
      </div>

      {/* 1. KUSTOMISASI GARIS RUTE DI PETA (POSISI ATAS) */}
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <div className="text-xs font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border/60">
          <Palette className="w-3.5 h-3.5 text-primary" />
          Kustomisasi Garis Rute di Peta
        </div>

        {/* Live Line Preview */}
        <div className="p-2.5 rounded-lg bg-secondary/40 border border-border space-y-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Pratinjau Garis:</span>
            <span className="font-mono font-semibold text-foreground">
              {customColor} • {customWeight}px • {customLineStyle}
            </span>
          </div>
          <div className="h-7 rounded-md bg-background border border-border/80 flex items-center px-4 overflow-hidden">
            <div
              className="w-full transition-all"
              style={{
                height: `${customWeight}px`,
                backgroundColor: customColor,
                opacity: customOpacity,
                borderStyle:
                  customLineStyle === "dashed"
                    ? "dashed"
                    : customLineStyle === "dotted"
                    ? "dotted"
                    : "solid",
                borderRadius: customLineStyle === "dotted" ? "999px" : "2px",
              }}
            />
          </div>
        </div>

        {/* Nama Rute Jalan */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground block">
            Nama Rute:
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => onRouteNameChange(e.target.value)}
            placeholder="Misal: Rute Utama Taman Kota ➔ Waduk"
            className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
          />
        </div>

        {/* Target Folder Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground block">
            Simpan ke Folder:
          </label>
          <select
            value={targetFolder}
            onChange={(e) => onTargetFolderChange(e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
          >
            <option value="Tanpa Folder">📁 Tanpa Folder (Default)</option>
            {allFolderList.map((fld) => (
              <option key={fld} value={fld}>
                📁 {fld}
              </option>
            ))}
          </select>
        </div>

        {/* Warna Garis (Palet Aether & Picker) */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground block">
            Pilih Warna Garis:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={customColor}
              onChange={(e) => onCustomColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-transparent shrink-0"
              title="Pilih warna kustom"
            />
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-1 flex-1">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => onCustomColorChange(c.hex)}
                  className={`h-7 rounded-md border transition-all cursor-pointer flex items-center justify-center ${
                    customColor.toLowerCase() === c.hex.toLowerCase()
                      ? "border-foreground ring-2 ring-primary scale-105"
                      : "border-border/60 hover:scale-102"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {customColor.toLowerCase() === c.hex.toLowerCase() && (
                    <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Ketebalan & Gaya Garis */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
              <span>Ketebalan:</span>
              <span className="font-mono text-primary">{customWeight}px</span>
            </div>
            <input
              type="range"
              min="2"
              max="14"
              value={customWeight}
              onChange={(e) => onCustomWeightChange(parseInt(e.target.value, 10))}
              className="w-full accent-primary h-1.5 bg-secondary rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground block">
              Gaya Garis:
            </label>
            <select
              value={customLineStyle}
              onChange={(e) => onCustomLineStyleChange(e.target.value as LineStyle)}
              className="w-full h-8 px-2 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
            >
              <option value="solid">Utuh (Solid)</option>
              <option value="dashed">Putus-putus (Dashed)</option>
              <option value="dotted">Titik-titik (Dotted)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. TOMBOL AKSI UTAMA DI ATAS */}
      <div className="space-y-2">
        <Button
          onClick={onSaveRoute}
          disabled={waypoints.length < 2 || !draftRouteData || isSaving}
          className="w-full h-10 text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Menyimpan Rute Jalan...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-primary-foreground" />
              <span>
                Simpan Rute ke &ldquo;{selectedFolder}&rdquo;
                {draftRouteData ? ` (${draftRouteData.distanceKm} km)` : ""}
              </span>
            </>
          )}
        </Button>

        {waypoints.length >= 2 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetWaypoints}
            className="w-full h-7 text-[11px] font-medium text-destructive hover:bg-destructive/10 border-destructive/30 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3 text-destructive" />
            <span>Reset Titik Rute Dari Awal</span>
          </Button>
        )}
      </div>

      {/* 3. DAFTAR TITIK JALAN YANG DIHUBUNGKAN */}
      <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="text-xs font-bold text-foreground flex items-center gap-2">
            <Route className="w-3.5 h-3.5 text-primary" />
            <span>Daftar Titik Jalan Terhubung</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-secondary border border-border">
              {waypoints.length} Titik
            </span>
          </div>

          {waypoints.length >= 2 && (
            <button
              type="button"
              onClick={onReverseAllWaypoints}
              className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
              title="Balik Urutan Semua Titik (Arah Berlawanan)"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Balik Arah</span>
            </button>
          )}
        </div>

        {waypoints.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 space-y-2 bg-secondary/20">
            <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <p className="font-semibold text-foreground">Belum ada titik jalan di peta</p>
            <p className="text-[11px] text-muted-foreground">
              Klik lokasi manapun pada peta di sebelah kanan untuk menambahkan titik jalan pertama.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {waypoints.map((wp, idx) => {
              const isOrigin = idx === 0;
              const isDestination = idx === waypoints.length - 1 && waypoints.length > 1;

              return (
                <div
                  key={wp.id}
                  className="p-2.5 rounded-lg border border-border bg-secondary/30 flex items-center justify-between gap-2 text-xs hover:border-border transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white shadow-2xs ${
                        isOrigin
                          ? "bg-emerald-600"
                          : isDestination
                          ? "bg-rose-600"
                          : "bg-amber-500"
                      }`}
                    >
                      {isOrigin ? "1" : isDestination ? "N" : `${idx + 1}`}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-foreground truncate text-[11px]">
                        {wp.name}
                      </div>
                      <div className="text-[9px] text-muted-foreground font-mono truncate">
                        {wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => onMoveWaypoint(idx, "up")}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Geser Urutan Naik"
                    >
                      <MoveUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === waypoints.length - 1}
                      onClick={() => onMoveWaypoint(idx, "down")}
                      className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Geser Urutan Turun"
                    >
                      <MoveDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveWaypoint(idx)}
                      className="p-1 text-destructive/70 hover:text-destructive cursor-pointer"
                      title="Hapus Titik Ini"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Ringkasan Jarak & Estimasi */}
        {draftRouteData && waypoints.length >= 2 && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1 text-xs">
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>Total Jarak Rute:</span>
              <span className="text-primary font-mono text-sm">
                {draftRouteData.distanceKm} km
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Estimasi Durasi Perjalanan:</span>
              <span className="font-mono text-foreground font-semibold">
                ~{draftRouteData.durationMin} menit
              </span>
            </div>
          </div>
        )}

        {isCalculatingRoute && (
          <div className="p-2.5 rounded-lg bg-secondary/50 border border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span>Mengkalkulasi rute jalan terbaik...</span>
          </div>
        )}

        {/* Petunjuk Interaktif */}
        {waypoints.length >= 2 && (
          <div className="pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddIntermediatePoint}
              className="w-full h-7 text-[11px] font-medium border-dashed border-border cursor-pointer hover:bg-secondary"
            >
              <Plus className="w-3 h-3 mr-1" />
              + Tambah Titik Antara (Klik Peta)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
