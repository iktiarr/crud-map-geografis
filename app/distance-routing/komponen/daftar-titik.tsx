"use client";

import * as React from "react";
import {
  Loader2,
  Eye,
  RotateCcw,
  MapPin,
  Edit3,
  Check,
  X,
  MoreVertical,
  MoveUp,
  MoveDown,
  Trash2,
  Link2,
  Unlink,
  Navigation,
  Zap,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { WaypointItem, MarkerStyle, getLetterLabel } from "../tipe";

interface DaftarTitikProps {
  waypoints: WaypointItem[];
  markerStyle: MarkerStyle;
  isCalculatingRoute: boolean;
  totalDistanceKm?: number;
  totalDurationMin?: number;
  onZoomToRoute?: () => void;
  onResetWaypoints: () => void;
  onRemoveWaypoint: (index: number) => void;
  onMoveWaypoint: (index: number, direction: "up" | "down") => void;
  onToggleDisconnectWaypoint?: (index: number) => void;
  onConnectWaypointToNearest?: (index: number, mode?: "road" | "direct") => void;
  onFocusWaypoint?: (lat: number, lng: number) => void;
  onUpdateWaypointName?: (index: number, newName: string) => void;
}

export function DaftarTitik({
  waypoints,
  markerStyle,
  isCalculatingRoute,
  onZoomToRoute,
  onResetWaypoints,
  onRemoveWaypoint,
  onMoveWaypoint,
  onToggleDisconnectWaypoint,
  onConnectWaypointToNearest,
  onFocusWaypoint,
  onUpdateWaypointName,
}: DaftarTitikProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingName, setEditingName] = React.useState("");

  const handleStartEdit = (index: number, currentName: string) => {
    setEditingIndex(index);
    setEditingName(currentName);
  };

  const handleSaveEdit = (index: number) => {
    if (editingName.trim()) {
      onUpdateWaypointName?.(index, editingName.trim());
    }
    setEditingIndex(null);
  };

  const getPointLabel = (index: number) => {
    if (markerStyle === "letters") return getLetterLabel(index);
    if (markerStyle === "none" || markerStyle === "dot") return "•";
    if (markerStyle === "icon" || markerStyle === "pin") return "📍";
    if (markerStyle === "random") {
      const symbols = [`${index + 1}`, getLetterLabel(index), "★", "📍", "⚡"];
      return symbols[index % symbols.length];
    }
    return `${index + 1}`;
  };

  return (
    <div className="space-y-2.5">
      {/* Header Info & Tombol Aksi Global */}
      <div className="flex items-center justify-between pb-2 border-b border-border/70 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground">
            {waypoints.length} Titik Terpasang
          </span>
          {isCalculatingRoute && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onZoomToRoute && waypoints.length > 0 && (
            <button
              type="button"
              onClick={onZoomToRoute}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/25 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Pusatkan peta ke keseluruhan jalur"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span>Lihat Jalur</span>
            </button>
          )}

          {waypoints.length > 0 && (
            <button
              type="button"
              onClick={onResetWaypoints}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Hapus seluruh titik jalan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Daftar Item Waypoint */}
      {waypoints.length === 0 ? (
        <div className="py-6 px-4 rounded-xl border border-dashed border-border/80 text-center space-y-1.5 bg-secondary/20">
          <MapPin className="w-6 h-6 text-muted-foreground/60 mx-auto" />
          <p className="text-xs font-semibold text-foreground">Belum ada titik jalan</p>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Klik langsung pada peta untuk menambahkan titik rute pertama Anda.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {waypoints.map((wp, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === waypoints.length - 1;
            const isEditing = editingIndex === idx;
            const isBranch = wp.connectionType === "nearest_branch";
            const isDirectSnap = wp.connectionType === "direct_snap";
            const isDisconnected =
              wp.connectionType === "disconnected" || wp.isDisconnected;

            return (
              <div
                key={wp.id || `wp-${idx}`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (waypoints.length > 1 && onToggleDisconnectWaypoint) {
                    onToggleDisconnectWaypoint(idx === 0 ? 1 : idx);
                  }
                }}
                className={`group flex items-center justify-between p-2 rounded-xl border transition-all text-xs ${
                  isBranch
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : isDisconnected
                    ? "bg-amber-500/5 border-amber-500/30"
                    : "bg-card border-border hover:border-primary/40 hover:bg-secondary/30"
                }`}
                title="Klik kanan untuk memisahkan atau menyambungkan rute titik ini"
              >
                {/* Bagian Kiri: Nomor / Badge & Nama Titik */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <span
                    className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center shrink-0 shadow-2xs ${
                      isBranch
                        ? "bg-emerald-600 text-white"
                        : isDirectSnap
                        ? "bg-blue-600 text-white"
                        : isDisconnected
                        ? "bg-amber-600 text-white"
                        : isFirst
                        ? "bg-indigo-600 text-white"
                        : isLast
                        ? "bg-rose-600 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {getPointLabel(idx)}
                  </span>

                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(idx);
                            if (e.key === "Escape") setEditingIndex(null);
                          }}
                          autoFocus
                          className="w-full h-6 px-1.5 text-xs bg-background border border-primary rounded font-medium focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(idx)}
                          className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingIndex(null)}
                          className="p-1 rounded bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          onClick={() =>
                            handleStartEdit(
                              idx,
                              wp.name ||
                                (isFirst
                                  ? "Titik Awal"
                                  : isLast
                                  ? "Titik Akhir"
                                  : `Titik ${idx + 1}`)
                            )
                          }
                          className="font-semibold text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                          title="Klik untuk ubah nama titik"
                        >
                          {wp.name ||
                            (isFirst
                              ? "Titik Awal"
                              : isLast
                              ? "Titik Akhir"
                              : `Titik ${idx + 1}`)}
                        </span>

                        {isBranch && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold shrink-0">
                            Cabang Jalan
                          </span>
                        )}
                        {isDirectSnap && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-700 dark:text-blue-300 font-semibold shrink-0">
                            Snap Cepat
                          </span>
                        )}
                        {isDisconnected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold shrink-0">
                            Jalan Lain
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="font-mono">
                        {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bagian Kanan: Aksi Cepat & Titik Tiga */}
                <div className="flex items-center gap-1 shrink-0">
                  {onFocusWaypoint && (
                    <button
                      type="button"
                      onClick={() => onFocusWaypoint(wp.lat, wp.lng)}
                      className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary cursor-pointer transition-colors"
                      title="Pusatkan peta ke titik ini"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors outline-hidden"
                      title="Opsi titik"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 text-xs">
                      <DropdownMenuItem
                        onClick={() =>
                          handleStartEdit(
                            idx,
                            wp.name ||
                              (isFirst
                                ? "Titik Awal"
                                : isLast
                                ? "Titik Akhir"
                                : `Titik ${idx + 1}`)
                          )
                        }
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primary" />
                        <span>Ubah Nama Titik</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        disabled={idx === 0}
                        onClick={() => onMoveWaypoint(idx, "up")}
                        className="cursor-pointer flex items-center gap-2 disabled:opacity-40"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                        <span>Geser ke Atas</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        disabled={idx === waypoints.length - 1}
                        onClick={() => onMoveWaypoint(idx, "down")}
                        className="cursor-pointer flex items-center gap-2 disabled:opacity-40"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                        <span>Geser ke Bawah</span>
                      </DropdownMenuItem>

                      {waypoints.length > 1 && onConnectWaypointToNearest && (
                        <>
                          <DropdownMenuSeparator />
                          {/* Opsi 1: Hubungkan ke Jalur Terdekat (Ikuti Jalan) */}
                          <DropdownMenuItem
                            onClick={() => onConnectWaypointToNearest(idx, "road")}
                            className="cursor-pointer flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Hubungkan ke Jalur (Ikuti Jalan)</span>
                            </span>
                            {isBranch && (
                              <Check className="w-3 h-3 text-emerald-600" />
                            )}
                          </DropdownMenuItem>

                          {/* Opsi 2: Hubungkan Langsung (Snap Cepat) */}
                          <DropdownMenuItem
                            onClick={() => onConnectWaypointToNearest(idx, "direct")}
                            className="cursor-pointer flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Zap className="w-3.5 h-3.5 text-blue-600" />
                              <span>Hubungkan Langsung (Snap Cepat)</span>
                            </span>
                            {isDirectSnap && (
                              <Check className="w-3 h-3 text-blue-600" />
                            )}
                          </DropdownMenuItem>
                        </>
                      )}

                      {waypoints.length > 1 && onToggleDisconnectWaypoint && (
                        <DropdownMenuItem
                          onClick={() => onToggleDisconnectWaypoint(idx === 0 ? 1 : idx)}
                          className="cursor-pointer flex items-center justify-between"
                        >
                          <span className="flex items-center gap-2">
                            {isDisconnected ? (
                              <>
                                <Link2 className="w-3.5 h-3.5 text-primary" />
                                <span>Sambungkan Rute</span>
                              </>
                            ) : (
                              <>
                                <Unlink className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pisahkan Rute</span>
                              </>
                            )}
                          </span>
                          {isDisconnected && <Check className="w-3 h-3 text-amber-600" />}
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onRemoveWaypoint(idx)}
                        className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Titik</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
