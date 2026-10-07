"use client";

import * as React from "react";
import { Key, Zap, Check, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AiTestResult } from "../types";

interface AiConfigFormProps {
  editingId: number | null;
  formName: string;
  setFormName: (val: string) => void;
  formApiKey: string;
  setFormApiKey: (val: string) => void;
  formModel: string;
  setFormModel: (val: string) => void;
  formIsActive: boolean;
  setFormIsActive: (val: boolean) => void;
  isSavingAi: boolean;
  isTestingAi: boolean;
  testResult: AiTestResult | null;
  onSave: (e: React.FormEvent) => void;
  onTest: () => void;
  onCancelEdit: () => void;
}

export function AiConfigForm({
  editingId,
  formName,
  setFormName,
  formApiKey,
  setFormApiKey,
  formModel,
  setFormModel,
  isSavingAi,
  isTestingAi,
  testResult,
  onSave,
  onTest,
  onCancelEdit,
}: AiConfigFormProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-foreground">
            {editingId ? "Edit Konfigurasi AI" : "Form Input Kunci & Model AI"}
          </h2>
        </div>

        {editingId !== null && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelEdit}
            className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Batal Edit / Tambah Baru
          </Button>
        )}
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">
            Nama / Label Konfigurasi
          </label>
          <input
            type="text"
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder=""
            className="w-full h-10 px-3.5 rounded-xl border border-border bg-secondary/30 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">
            OpenRouter API Key
          </label>
          <input
            type="password"
            required={!editingId}
            value={formApiKey}
            onChange={(e) => setFormApiKey(e.target.value)}
            placeholder=""
            className="w-full h-10 px-3.5 rounded-xl border border-border bg-secondary/30 text-xs sm:text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-foreground mb-1 block">
            Nama Model OpenRouter
          </label>
          <input
            type="text"
            required
            value={formModel}
            onChange={(e) => setFormModel(e.target.value)}
            placeholder=""
            className="w-full h-10 px-3.5 rounded-xl border border-border bg-secondary/30 text-xs sm:text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border">
          <Button
            type="button"
            onClick={onTest}
            disabled={isTestingAi || !formModel.trim()}
            variant="outline"
            className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            {isTestingAi ? (
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            )}
            <span>Uji Koneksi Model</span>
          </Button>

          <Button
            type="submit"
            disabled={isSavingAi}
            className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-2"
          >
            {isSavingAi ? (
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            <span>{editingId ? "Perbarui Konfigurasi" : "Simpan Konfigurasi"}</span>
          </Button>
        </div>
      </form>

      {testResult && (
        <div
          className={`p-3.5 rounded-xl border animate-in fade-in duration-150 space-y-1.5 ${
            testResult.success
              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              )}
              <span>{testResult.success ? "Model Aktif & Siap!" : "Uji Koneksi Gagal"}</span>
            </div>
            {testResult.latencyMs && (
              <Badge className="text-[10px] font-mono bg-card text-foreground border-border">
                {testResult.latencyMs}ms
              </Badge>
            )}
          </div>
          <p className="text-xs">{testResult.message || testResult.error}</p>
        </div>
      )}
    </div>
  );
}
