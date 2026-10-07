import * as React from "react";
import { FolderPlus, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModalFolderProps {
  // Modal Buat Folder
  isNewFolderOpen: boolean;
  newFolderName: string;
  onNewFolderNameChange: (val: string) => void;
  onCloseNewFolder: () => void;
  onSubmitNewFolder: (e: React.FormEvent) => void;

  // Modal Ubah Nama Folder
  renameTargetFolder: string | null;
  renameNewName: string;
  onRenameNewNameChange: (val: string) => void;
  onCloseRenameFolder: () => void;
  onSubmitRenameFolder: (e: React.FormEvent) => void;

  // Modal Hapus Folder
  deleteTargetFolder: string | null;
  onCloseDeleteFolder: () => void;
  onConfirmDeleteFolder: () => void;
}

export function ModalFolder({
  isNewFolderOpen,
  newFolderName,
  onNewFolderNameChange,
  onCloseNewFolder,
  onSubmitNewFolder,
  renameTargetFolder,
  renameNewName,
  onRenameNewNameChange,
  onCloseRenameFolder,
  onSubmitRenameFolder,
  deleteTargetFolder,
  onCloseDeleteFolder,
  onConfirmDeleteFolder,
}: ModalFolderProps) {
  return (
    <>
      {/* MODAL 1: Buat Folder Baru */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <FolderPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Buat Folder Rute Baru</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Kelompokkan rute perjalanan Anda
                </p>
              </div>
            </div>

            <form onSubmit={onSubmitNewFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Nama Folder:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => onNewFolderNameChange(e.target.value)}
                  placeholder="Misal: Jalan Tol, Wisata, Kuliner..."
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseNewFolder}
                  className="h-8 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newFolderName.trim()}
                  className="h-8 text-xs cursor-pointer font-semibold"
                >
                  Buat Folder
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ubah Nama Folder */}
      {renameTargetFolder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Ubah Nama Folder</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Folder: {renameTargetFolder}
                </p>
              </div>
            </div>

            <form onSubmit={onSubmitRenameFolder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground block">
                  Nama Baru Folder:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={renameNewName}
                  onChange={(e) => onRenameNewNameChange(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCloseRenameFolder}
                  className="h-8 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!renameNewName.trim()}
                  className="h-8 text-xs cursor-pointer font-semibold"
                >
                  Simpan Perubahan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Hapus Folder */}
      {deleteTargetFolder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Hapus Folder</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Tindakan ini tidak dapat dibatalkan
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Apakah Anda yakin ingin menghapus folder{" "}
              <strong className="text-foreground">&ldquo;{deleteTargetFolder}&rdquo;</strong>?
              Rute di dalamnya tidak akan hilang, melainkan dialihkan ke{" "}
              <span className="font-mono text-foreground font-semibold">&quot;Rute Tanpa Folder&quot;</span>.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCloseDeleteFolder}
                className="h-8 text-xs cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onConfirmDeleteFolder}
                className="h-8 text-xs cursor-pointer bg-destructive hover:bg-destructive/90 text-destructive-foreground font-semibold"
              >
                Hapus Folder
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
