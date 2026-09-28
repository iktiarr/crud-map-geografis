import * as React from "react";
import {
  Folder,
  FolderArchive,
  ArrowLeft,
  Edit3,
  Trash2,
  Route,
  Plus,
  Compass,
  MoreVertical,
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
  folderSubTab: "routes-list" | "add-route";
  onBackToAllFolders: () => void;
  onSetFolderSubTab: (tab: "routes-list" | "add-route") => void;
  onFocusRoute: (routeId: number) => void;
  onOpenEditRouteModal: (route: TraversedRoadRecord) => void;
  onOpenDeleteRouteModal: (routeId: number) => void;
  onOpenRenameFolderModal: (folderName: string) => void;
  onOpenDeleteFolderModal: (folderName: string) => void;
  onOpenNewRouteModal: () => void;
}

export function DaftarRuteFolder({
  selectedFolder,
  filteredRoutes,
  focusedRouteId,
  folderSubTab,
  onBackToAllFolders,
  onSetFolderSubTab,
  onFocusRoute,
  onOpenEditRouteModal,
  onOpenDeleteRouteModal,
  onOpenRenameFolderModal,
  onOpenDeleteFolderModal,
  onOpenNewRouteModal,
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

        {!isTanpaFolder && selectedFolder !== "Utama" && (
          <div className="flex items-center gap-1">
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

      {/* Banner Header Folder */}
      <div className="p-3 rounded-lg border border-border bg-secondary/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center text-primary shrink-0 shadow-2xs">
            {isTanpaFolder ? (
              <FolderArchive className="w-4 h-4 text-inherit" />
            ) : (
              <Folder className="w-4 h-4 text-inherit" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
              {isTanpaFolder ? "Rute Tanpa Folder" : selectedFolder}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              {filteredRoutes.length} Rute Tersimpan
            </p>
          </div>
        </div>
      </div>

      {/* Sub Navigation: Daftar Rute vs Tambah Rute (Hanya untuk folder kustom, disembunyikan di Tanpa Folder) */}
      {!isTanpaFolder && (
        <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-lg border border-border text-xs font-semibold">
          <button
            type="button"
            onClick={() => onSetFolderSubTab("routes-list")}
            className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              folderSubTab === "routes-list"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Daftar Rute ({filteredRoutes.length})</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewRouteModal}
            className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              folderSubTab === "add-route"
                ? "bg-card text-foreground shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Tambah Rute</span>
          </button>
        </div>
      )}

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
            {/* Tombol Buat Rute hanya muncul di folder kustom */}
            {!isTanpaFolder && (
              <div className="pt-1 flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onOpenNewRouteModal}
                  className="h-7 text-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 text-primary" />
                  Mulai Buat Rute
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRoutes.map((r) => (
              <div
                key={r.id}
                onClick={() => onFocusRoute(r.id)}
                className={`p-3 rounded-xl border transition-all text-xs space-y-2 cursor-pointer group/card ${
                  focusedRouteId === r.id
                    ? "border-primary bg-primary/5 shadow-xs ring-1 ring-primary"
                    : "border-border bg-card hover:bg-secondary/40 hover:border-primary/50"
                }`}
              >
                {/* Baris Atas: Warna + Nama Rute + Jarak + Titik Tiga (Dropdown) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 shadow-2xs"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="font-semibold text-foreground truncate text-xs group-hover/card:text-primary transition-colors">
                      {r.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border">
                      {r.distance_km} km
                    </span>

                    {/* Titik Tiga Menu untuk Rute */}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                        title="Opsi Rute"
                      >
                        <MoreVertical className="w-3.5 h-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 text-xs">
                        <DropdownMenuItem
                          onClick={() => {
                            const routeToEdit = { ...r };
                            setTimeout(() => onOpenEditRouteModal(routeToEdit), 50);
                          }}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary" />
                          <span>Edit Nama</span>
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

                {/* Jalur Titik Asal ➔ Tujuan */}
                <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate font-mono">
                  <span className="text-emerald-500 font-bold">1:</span>
                  <span className="truncate">{r.origin_name}</span>
                  <span>➔</span>
                  <span className="text-rose-500 font-bold">N:</span>
                  <span className="truncate">{r.destination_name}</span>
                </div>

                {/* Baris Bawah: Info Durasi & Tombol Fokuskan */}
                <div className="flex items-center justify-between pt-1 border-t border-border/60 text-[11px]">
                  <span className="text-muted-foreground font-mono">
                    ~{r.duration_min} mnt • {r.weight}px ({r.line_style || "solid"})
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onFocusRoute(r.id);
                    }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-muted-foreground hover:text-primary hover:bg-secondary cursor-pointer transition-colors text-[10px]"
                    title="Fokuskan Peta ke Rute Ini"
                  >
                    <Compass className="w-3 h-3" />
                    <span>Fokuskan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
