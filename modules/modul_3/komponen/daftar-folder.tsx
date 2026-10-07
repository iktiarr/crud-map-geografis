import { Folder, FolderPlus, FolderArchive, MoreVertical, Edit3, Trash2, ChevronRight, Eye, EyeOff, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { TraversedRoadRecord } from "../tipe";

interface DaftarFolderProps {
  allFolderList: string[];
  routes: TraversedRoadRecord[];
  unassignedRoutes: TraversedRoadRecord[];
  onOpenFolder: (folderName: string) => void;
  onOpenNewFolderModal: () => void;
  onOpenRenameFolderModal: (folderName: string) => void;
  onOpenDeleteFolderModal: (folderName: string) => void;
  onViewFolder?: (folderName: string) => void;
  previewFolder?: string | null;
  onExportFolder?: (folderName: string) => void;
}

export function DaftarFolder({
  allFolderList,
  routes,
  unassignedRoutes,
  onOpenFolder,
  onOpenNewFolderModal,
  onOpenRenameFolderModal,
  onOpenDeleteFolderModal,
  onViewFolder,
  previewFolder,
  onExportFolder,
}: DaftarFolderProps) {
  const isPreviewing = (name: string) =>
    !!previewFolder && previewFolder.toLowerCase() === name.toLowerCase();
  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Tombol Buat Folder Baru */}
      <Button
        onClick={onOpenNewFolderModal}
        className="w-full h-10 text-xs font-semibold rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2"
      >
        <FolderPlus className="w-4 h-4 text-primary-foreground" />
        <span>+ Buat Folder Baru</span>
      </Button>

      {/* DAFTAR FOLDER KUSTOM */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 font-mono">
          Daftar Folder:
        </div>

        {allFolderList.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 space-y-2.5 bg-card/40">
            <Folder className="w-8 h-8 text-muted-foreground/30 mx-auto" />
            <div>
              <p className="font-semibold text-foreground">Belum ada folder tersimpan</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Buat folder baru untuk mulai memetakan rute perjalanan Anda.
              </p>
            </div>
          </div>
        ) : (
          allFolderList.map((folderName) => {
            const folderRoutes = routes.filter(
              (r) => (r.folder_name || "Tanpa Folder").toLowerCase() === folderName.toLowerCase()
            );
            const count = folderRoutes.length;

            return (
              <div
                key={folderName}
                onClick={() => onOpenFolder(folderName)}
                className="rounded-xl border border-border bg-card hover:border-primary hover:shadow-md transition-all shadow-2xs cursor-pointer group p-3 flex items-center justify-between gap-3"
                title={`Buka folder ${folderName}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0 shadow-2xs">
                    <Folder className="w-4 h-4 text-inherit" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                      {folderName}
                    </h2>
                    <p className="text-[11px] text-muted-foreground truncate font-mono">
                      {count} Rute
                    </p>
                  </div>
                </div>

                {/* Titik Tiga pada setiap folder */}
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                      title="Opsi Folder"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem
                        onClick={() => onViewFolder?.(folderName)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        {isPreviewing(folderName) ? (
                          <EyeOff className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-primary" />
                        )}
                        <span>{isPreviewing(folderName) ? "Tampilkan Semua" : "Lihat di Peta"}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const target = folderName;
                          setTimeout(() => onOpenRenameFolderModal(target), 50);
                        }}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-primary" />
                        <span>Edit Nama</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onExportFolder?.(folderName)}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5 text-primary" />
                        <span>Ekspor Folder...</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          const target = folderName;
                          setTimeout(() => onOpenDeleteFolderModal(target), 50);
                        }}
                        className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FOLDER FIKS: "RUTE TANPA FOLDER" */}
      <div className="pt-2 border-t border-border/80">
        <div
          onClick={() => onOpenFolder("Tanpa Folder")}
          className="rounded-xl border border-border bg-card hover:border-primary/80 hover:shadow-md transition-all shadow-2xs cursor-pointer group p-3 flex items-center justify-between gap-3"
          title="Buka rute tanpa folder"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground transition-all shrink-0 shadow-2xs">
              <FolderArchive className="w-4 h-4 text-inherit" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                  Rute Tanpa Folder
                </h3>
              </div>
              <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                {unassignedRoutes.length} Rute Tersimpan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </div>
  );
}
