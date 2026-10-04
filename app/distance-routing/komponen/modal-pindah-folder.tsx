"use client";

import * as React from "react";
import { Folder, Check, X, FolderPlus } from "lucide-react";
import { TraversedRoadRecord } from "../tipe";

interface ModalPindahFolderProps {
  isOpen: boolean;
  route: TraversedRoadRecord | null;
  allFolderList: string[];
  onClose: () => void;
  onConfirmMove: (routeId: number, targetFolder: string) => Promise<void> | void;
}

export function ModalPindahFolder({
  isOpen,
  route,
  allFolderList,
  onClose,
  onConfirmMove,
}: ModalPindahFolderProps) {
  const [selectedFolder, setSelectedFolder] = React.useState<string>(
    route?.folder_name || "Tanpa Folder"
  );
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset field saat target route berbeda
  const [prevRouteId, setPrevRouteId] = React.useState<number | null>(route?.id ?? null);
  if (route && route.id !== prevRouteId) {
    setPrevRouteId(route.id);
    setSelectedFolder(route.folder_name || "Tanpa Folder");
    setIsCreatingNew(false);
    setNewFolderName("");
  }

  if (!isOpen || !route) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalFolder = isCreatingNew ? newFolderName.trim() : selectedFolder;
    if (!finalFolder) return;

    setIsSubmitting(true);
    try {
      await onConfirmMove(route.id, finalFolder);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Pindahkan ke Folder</h3>
              <p className="text-[11px] text-muted-foreground truncate max-w-50">
                {route.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">
              Pilih Folder Tujuan:
            </label>

            <div className="max-h-48 overflow-y-auto space-y-1 border border-border rounded-xl p-1.5 bg-secondary/20">
              <button
                type="button"
                onClick={() => {
                  setSelectedFolder("Tanpa Folder");
                  setIsCreatingNew(false);
                }}
                className={`w-full flex items-center justify-between text-xs px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                  !isCreatingNew && selectedFolder === "Tanpa Folder"
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "hover:bg-secondary text-foreground"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <Folder className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <span>Tanpa Folder (Default)</span>
                </span>
                {!isCreatingNew && selectedFolder === "Tanpa Folder" && (
                  <Check className="w-3.5 h-3.5 shrink-0" />
                )}
              </button>

              {allFolderList.map((folderName) => (
                <button
                  key={folderName}
                  type="button"
                  onClick={() => {
                    setSelectedFolder(folderName);
                    setIsCreatingNew(false);
                  }}
                  className={`w-full flex items-center justify-between text-xs px-2.5 py-2 rounded-lg cursor-pointer transition-colors ${
                    !isCreatingNew && selectedFolder === folderName
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{folderName}</span>
                  </span>
                  {!isCreatingNew && selectedFolder === folderName && (
                    <Check className="w-3.5 h-3.5 shrink-0" />
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className={`w-full flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-primary ${
                  isCreatingNew
                    ? "bg-primary/10 font-semibold"
                    : "hover:bg-secondary"
                }`}
              >
                <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                <span>+ Buat Folder Baru</span>
              </button>
            </div>
          </div>

          {isCreatingNew && (
            <div className="space-y-1 animate-in fade-in duration-100">
              <label className="text-xs font-semibold text-foreground block">
                Nama Folder Baru:
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Masukkan nama folder..."
                required
                autoFocus
                className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-primary text-foreground focus:outline-hidden"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isCreatingNew && !newFolderName.trim())}
              className="px-4 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Memindahkan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
