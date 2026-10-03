import * as React from "react";
import {
  ArrowLeft,
  Edit3,
  Trash2,
  Route,
  Plus,
  MoreVertical,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TraversedRoadRecord } from "../tipe";

interface DaftarRuteFolderProps {
  selectedFolder: string;
  filteredRoutes: TraversedRoadRecord[];
  focusedRouteId: number | null;
  onBackToAllFolders: () => void;
  onFocusRoute: (routeId: number) => void;
  onOpenEditRouteModal: (route: TraversedRoadRecord) => void;
  onOpenDeleteRouteModal: (routeId: number) => void;
  onOpenRenameFolderModal: (folderName: string) => void;
  onOpenDeleteFolderModal: (folderName: string) => void;
  onOpenNewRouteModal: () => void;
  onOpenRenameRouteModal?: (route: TraversedRoadRecord) => void;
  onEditRouteOnMap?: (route: TraversedRoadRecord) => void;
}

export function DaftarRuteFolder({
  selectedFolder,
  filteredRoutes,
  focusedRouteId,
  onBackToAllFolders,
  onFocusRoute,
  onOpenEditRouteModal,
  onOpenDeleteRouteModal,
  onOpenRenameFolderModal,
  onOpenDeleteFolderModal,
  onOpenNewRouteModal,
  onOpenRenameRouteModal,
  onEditRouteOnMap,
}: DaftarRuteFolderProps) {
  const isTanpaFolder = selectedFolder === "Tanpa Folder";

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Navigasi Atas: Kembali ke Semua Folder & Opsi Folder */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <button
          type="button"
          onClick={onBackToAllFolders}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Semua Folder</span>
        </button>

        {!isTanpaFolder && (
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-foreground truncate max-w-32.5" title={selectedFolder}>
              {selectedFolder}
            </span>
            {selectedFolder !== "Utama" && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenRenameFolderModal(selectedFolder)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
                  title="Ubah Nama Folder"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDeleteFolderModal(selectedFolder)}
                  className="p-1 rounded-md text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                  title="Hapus Folder"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DAFTAR KARTU RUTE */}
      <div className="space-y-3 animate-in fade-in duration-150">
        {/* Tombol Tambah Rute Baru (Hanya untuk folder kustom, bukan Tanpa Folder) */}
        {!isTanpaFolder && (
          <Button
            size="sm"
            onClick={onOpenNewRouteModal}
            className="w-full h-8 text-xs font-semibold cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Tambah Rute Baru di Folder &ldquo;{selectedFolder}&rdquo;
          </Button>
        )}

        {filteredRoutes.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 space-y-2 bg-card/40">
            <Route className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <div>
              <p className="font-semibold text-foreground">
                {isTanpaFolder
                  ? "Belum ada rute tanpa folder"
                  : "Belum ada rute di folder ini"}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isTanpaFolder
                  ? "Semua rute tanpa kategori folder akan otomatis tersimpan di sini."
                  : `Folder "${selectedFolder}" belum memiliki rute tersimpan.`}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredRoutes.map((r) => (
              <div
                key={r.id}
                onClick={() => {
                  if (onEditRouteOnMap) {
                    onEditRouteOnMap(r);
                  } else {
                    onFocusRoute(r.id);
                  }
                }}
                className={`px-3 py-2 rounded-xl border transition-all text-xs cursor-pointer group/card flex items-center justify-between gap-3 ${
                  focusedRouteId === r.id
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                    : "border-border bg-card hover:bg-secondary/40 hover:border-primary/50"
                }`}
                title={`Klik untuk edit rute "${r.name}"`}
              >
                {/* Nama Rute Saja */}
                <span className="font-semibold text-foreground truncate text-xs group-hover/card:text-primary transition-colors flex-1 min-w-0">
                  {r.name}
                </span>

                {/* Tombol Action: Ikon Mata (Zoom ke Rute) & Titik Tiga */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onFocusRoute(r.id)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      focusedRouteId === r.id
                        ? "bg-primary text-primary-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                    }`}
                    title={`Zoom & lihat rute "${r.name}" di peta`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenRenameRouteModal) {
                        onOpenRenameRouteModal(r);
                      } else {
                        onOpenEditRouteModal(r);
                      }
                    }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                    title={`Ubah nama rute "${r.name}"`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                      title="Opsi Rute"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 text-xs">
                      <DropdownMenuItem
                        onClick={() => onFocusRoute(r.id)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>Lihat di Peta</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (onEditRouteOnMap) {
                            onEditRouteOnMap(r);
                          }
                        }}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Route className="w-3.5 h-3.5 text-primary" />
                        <span>Edit Jalur Peta</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          if (onOpenRenameRouteModal) {
                            onOpenRenameRouteModal(r);
                          } else {
                            onOpenEditRouteModal({ ...r });
                          }
                        }}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primary" />
                        <span>Ubah Nama</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const idToDelete = r.id;
                          setTimeout(() => onOpenDeleteRouteModal(idToDelete), 50);
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
