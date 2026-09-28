import * as React from "react";
import { Trash2, Edit3, Route, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COLOR_PALETTE } from "../konfigurasi";
import { TraversedRoadRecord } from "../tipe";

interface ModalRuteProps {
  // Modal Tambah Rute Baru (Input Nama Rute Dahulu)
  isNewRouteOpen: boolean;
  newRouteName: string;
  targetFolderName: string;
  onNewRouteNameChange: (val: string) => void;
  onCloseNewRoute: () => void;
  onSubmitNewRoute: (e: React.FormEvent) => void;

  // Modal Hapus Rute
  isDeleteOpen: boolean;
  targetRoute: TraversedRoadRecord | null;
  onCloseDelete: () => void;
  onConfirmDelete: () => void;

  // Modal Edit Rute
  isEditOpen: boolean;
  editingRoute: TraversedRoadRecord | null;
  allFolderList: string[];
  onEditingRouteChange: (updated: TraversedRoadRecord) => void;
  onCloseEdit: () => void;
  onSubmitEdit: () => void;
}

export function ModalRute({
  isNewRouteOpen,
  newRouteName,
  targetFolderName,
  onNewRouteNameChange,
  onCloseNewRoute,
  onSubmitNewRoute,
  isDeleteOpen,
  targetRoute,
  onCloseDelete,
  onConfirmDelete,
  isEditOpen,
  editingRoute,
  allFolderList,
  onEditingRouteChange,
  onCloseEdit,
  onSubmitEdit,
}: ModalRuteProps) {
  return (
    <>
      {/* MODAL 0: Tambah Rute Baru (Input Nama Rute) */}
      {isNewRouteOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Route className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Tambah Rute Baru</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Folder: {targetFolderName}
                </p>
              </div>
            </div>

            <form onSubmit={onSubmitNewRoute} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Nama Rute:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newRouteName}
                  onChange={(e) => onNewRouteNameChange(e.target.value)}
                  placeholder="Misal: Rute Utama Taman Kota ➔ Alun-alun"
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseNewRoute}
                  className="h-8 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newRouteName.trim()}
                  className="h-8 text-xs cursor-pointer font-semibold flex items-center gap-1.5"
                >
                  <span>Lanjut Petakan di Peta</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: Konfirmasi Hapus Rute */}
      {isDeleteOpen && targetRoute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Hapus Rute Jalan</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tindakan ini bersifat permanen
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus rute jalan{" "}
              <strong className="text-foreground font-semibold">
                &ldquo;{targetRoute.name}&rdquo;
              </strong>{" "}
              dari database?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCloseDelete}
                className="h-8 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onConfirmDelete}
                className="h-8 text-xs cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              >
                Hapus Rute
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Kustomisasi & Nama Rute */}
      {isEditOpen && editingRoute && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="font-bold text-base text-foreground flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <span>Edit Rute (Nama & Kustomisasi)</span>
              </div>
              <button
                type="button"
                onClick={onCloseEdit}
                className="text-muted-foreground hover:text-foreground text-xs cursor-pointer p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">
                  Nama Rute:
                </label>
                <input
                  type="text"
                  value={editingRoute.name}
                  onChange={(e) =>
                    onEditingRouteChange({ ...editingRoute, name: e.target.value })
                  }
                  autoFocus
                  className="w-full bg-background border border-border rounded-lg p-2 text-foreground font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">
                  Folder:
                </label>
                <select
                  value={editingRoute.folder_name || "Tanpa Folder"}
                  onChange={(e) =>
                    onEditingRouteChange({
                      ...editingRoute,
                      folder_name: e.target.value,
                    })
                  }
                  className="w-full bg-background border border-border rounded-lg p-2 text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                >
                  <option value="Tanpa Folder">📁 Tanpa Folder (Default)</option>
                  {allFolderList.map((fld) => (
                    <option key={fld} value={fld}>
                      📁 {fld}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1 font-semibold">
                  Warna Garis:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingRoute.color || "#2563eb"}
                    onChange={(e) =>
                      onEditingRouteChange({ ...editingRoute, color: e.target.value })
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border border-border shrink-0"
                  />
                  <div className="grid grid-cols-5 gap-1 flex-1">
                    {COLOR_PALETTE.slice(0, 5).map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() =>
                          onEditingRouteChange({ ...editingRoute, color: c.hex })
                        }
                        className="h-6 rounded border border-border cursor-pointer hover:scale-102 transition-transform"
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">
                    Ketebalan ({editingRoute.weight}px):
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="14"
                    value={editingRoute.weight}
                    onChange={(e) =>
                      onEditingRouteChange({
                        ...editingRoute,
                        weight: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1 font-semibold">
                    Gaya Garis:
                  </label>
                  <select
                    value={editingRoute.line_style || "solid"}
                    onChange={(e) =>
                      onEditingRouteChange({
                        ...editingRoute,
                        line_style: e.target.value as "solid" | "dashed" | "dotted",
                      })
                    }
                    className="w-full bg-background border border-border rounded-lg p-1.5 text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                  >
                    <option value="solid">Utuh (Solid)</option>
                    <option value="dashed">Putus-putus</option>
                    <option value="dotted">Titik-titik</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={onCloseEdit}
                className="h-8 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={onSubmitEdit}
                className="h-8 text-xs cursor-pointer font-semibold"
              >
                Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
