"use client";

import * as React from "react";
import { Activity, Plus, Zap, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AiConfigItem, RowPingState } from "../types";

interface AiConfigTableProps {
  aiConfigs: AiConfigItem[];
  rowPings: Record<number, RowPingState>;
  isPingingAll: boolean;
  onToggleActive: (id: number, currentActive: boolean) => void;
  onTestRowPing: (item: AiConfigItem) => void;
  onTestAllPings: () => void;
  onStartNew: () => void;
  onEdit: (item: AiConfigItem) => void;
  onDelete: (id: number, name: string) => void;
}

export function AiConfigTable({
  aiConfigs,
  rowPings,
  isPingingAll,
  onToggleActive,
  onTestRowPing,
  onTestAllPings,
  onStartNew,
  onEdit,
  onDelete,
}: AiConfigTableProps) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">Daftar Kunci & Model AI Tersimpan</h3>
          <p className="text-xs text-muted-foreground">
            Semua model aktif di bawah akan diacak (randomized load balancing) pada setiap panggilan AI untuk mencegah limit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTestAllPings}
            disabled={isPingingAll || aiConfigs.length === 0}
            className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:border-amber-500/40"
            title="Uji ping dan latensi seluruh model AI tersimpan"
          >
            <Activity className={`w-3.5 h-3.5 text-amber-500 ${isPingingAll ? "animate-spin" : ""}`} />
            <span>{isPingingAll ? "Menguji..." : "Uji Semua Ping"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onStartNew}
            className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baru</span>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
              <th className="py-3 px-4 w-24 text-center">Status</th>
              <th className="py-3 px-4">Nama Label</th>
              <th className="py-3 px-4">Model OpenRouter</th>
              <th className="py-3 px-4 w-36 text-center">Latensi / Ping</th>
              <th className="py-3 px-4 hidden sm:table-cell">API Key</th>
              <th className="py-3 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {aiConfigs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                  Belum ada konfigurasi AI tersimpan. Silakan isi form di atas.
                </td>
              </tr>
            ) : (
              aiConfigs.map((item) => {
                const pingState = rowPings[item.id];
                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      item.isActive ? "bg-primary/5 hover:bg-primary/10" : "opacity-60 hover:opacity-100 hover:bg-secondary/30"
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleActive(item.id, item.isActive)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold font-mono inline-flex items-center gap-1 cursor-pointer transition-all border ${
                          item.isActive
                            ? "bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-400"
                            : "bg-secondary border-border text-muted-foreground"
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif di pool"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                        <span>{item.isActive ? "Aktif" : "Mati"}</span>
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <span>{item.name}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-primary font-medium">
                      {item.model}
                    </td>
                    {/* Latency / Ping Column */}
                    <td className="py-3 px-4 text-center">
                      {pingState?.loading ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono text-muted-foreground">
                          <div className="w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span>Ping...</span>
                        </span>
                      ) : pingState?.latencyMs !== undefined ? (
                        <button
                          type="button"
                          onClick={() => onTestRowPing(item)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold cursor-pointer transition-all hover:scale-105 shadow-2xs ${
                            pingState.success && pingState.latencyMs < 1000
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                              : pingState.success && pingState.latencyMs <= 2500
                              ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                              : "bg-destructive/15 border-destructive/30 text-destructive"
                          }`}
                          title={`Klik untuk uji ulang. Latensi: ${pingState.latencyMs}ms (${
                            pingState.latencyMs < 1000 ? "Sangat Cepat" : pingState.latencyMs <= 2500 ? "Sedang" : "Tinggi/Lambat"
                          })`}
                        >
                          <Zap className="w-2.5 h-2.5 shrink-0" />
                          <span>{pingState.latencyMs}ms</span>
                        </button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onTestRowPing(item)}
                          className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Uji ping model ini"
                        >
                          <Zap className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
                          <span>Cek Ping</span>
                        </Button>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground hidden sm:table-cell">
                      {item.maskedKey}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(item)}
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Edit Konfigurasi"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(item.id, item.name)}
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                          title="Hapus Konfigurasi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
