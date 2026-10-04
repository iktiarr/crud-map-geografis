"use client";

import * as React from "react";
import { Undo2, Redo2 } from "lucide-react";

interface ToolbarRiwayatProps {
  canUndo: boolean;
  canRedo: boolean;
  undoCount?: number;
  redoCount?: number;
  onUndo: () => void;
  onRedo: () => void;
}

export function ToolbarRiwayat({
  canUndo,
  canRedo,
  undoCount = 0,
  redoCount = 0,
  onUndo,
  onRedo,
}: ToolbarRiwayatProps) {
  // Pasang listener global untuk keyboard Ctrl+Z (Undo) dan Ctrl+Y / Ctrl+Shift+Z (Redo)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jangan jalankan jika user sedang fokus mengetik di input / textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          // Ctrl + Shift + Z = Redo
          e.preventDefault();
          if (canRedo) onRedo();
        } else {
          // Ctrl + Z = Undo
          e.preventDefault();
          if (canUndo) onUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        // Ctrl + Y = Redo
        e.preventDefault();
        if (canRedo) onRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, onUndo, onRedo]);

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-secondary/40 border border-border">
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        title="Batalkan perubahan titik/peta (Ctrl+Z)"
      >
        <Undo2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>Undo</span>
        {undoCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-bold">
            {undoCount}
          </span>
        )}
      </button>

      <div className="w-px h-4 bg-border shrink-0" />

      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-background disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed shadow-2xs"
        title="Ulangi perubahan (Ctrl+Y)"
      >
        <Redo2 className="w-3.5 h-3.5 text-primary shrink-0" />
        <span>Redo</span>
        {redoCount > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-mono font-bold">
            {redoCount}
          </span>
        )}
      </button>
    </div>
  );
}
