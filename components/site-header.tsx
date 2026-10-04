"use client";

import * as React from "react";
import Link from "next/link";
import { Globe2, LogIn, Database, Sparkles, AlertCircle } from "lucide-react";
import { SettingsSheet } from "@/components/settings-sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export interface SiteHeaderProps {
  variant?: "home" | "subpage";
  title?: string;
  badge?: string;
  icon?: React.ComponentType<{ className?: string }>;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

interface SystemStatus {
  database: {
    connected: boolean;
    type: string;
    tablesCount: number;
    error?: string | null;
  };
  ai: {
    configured: boolean;
    provider: string;
  };
}

export function SiteHeader({ children }: SiteHeaderProps) {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/system-status")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setStatus(data);
          setIsLoadingStatus(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoadingStatus(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-border bg-card shadow-xs group-hover:border-zinc-400 group-hover:bg-secondary transition-all flex items-center justify-center shrink-0">
              <Globe2 className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-foreground group-hover:text-primary transition-colors truncate font-sans">
              Global Studio
            </span>
          </Link>

          {/* Indikator Status Database & AI Key */}
          <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border/60">
            {/* Database Status Badge */}
            {isLoadingStatus ? (
              <div className="h-6 px-2.5 rounded-full bg-secondary/50 border border-border/60 flex items-center gap-1.5 text-[11px] text-muted-foreground animate-pulse font-mono">
                <Database className="w-3 h-3 text-muted-foreground" />
                <span>Memeriksa DB...</span>
              </div>
            ) : status?.database.connected ? (
              <div
                className="h-6 px-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 text-[11px] font-medium transition-colors shadow-2xs"
                title={`Database Terhubung (${status.database.type}) - ${status.database.tablesCount} tabel aktif`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Database className="w-3 h-3" />
                <span className="font-mono">DB Terhubung</span>
              </div>
            ) : (
              <div
                className="h-6 px-2.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 flex items-center gap-1.5 text-[11px] font-medium transition-colors shadow-2xs"
                title={status?.database.error || "Database belum terhubung. Periksa DATABASE_URL di .env"}
              >
                <AlertCircle className="w-3 h-3" />
                <span className="font-mono">DB Putus</span>
              </div>
            )}

            {/* AI Key Status Badge */}
            {!isLoadingStatus && status && (
              status.ai.configured ? (
                <div
                  className="h-6 px-2.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400 flex items-center gap-1.5 text-[11px] font-medium transition-colors shadow-2xs"
                  title={`AI Terhubung & Aktif: ${status.ai.provider}`}
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  <Sparkles className="w-3 h-3 text-violet-500 animate-pulse" />
                  <span className="font-mono font-medium">AI Aktif</span>
                </div>
              ) : (
                <div
                  className="h-6 px-2.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 text-[11px] font-medium transition-colors shadow-2xs"
                  title="API Key AI belum dikonfigurasi di server (.env)"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <AlertCircle className="w-3 h-3" />
                  <span className="font-mono">AI Nonaktif</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {children}
          {!isAuthenticated && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openAuthModal({ tab: "login" })}
              className="h-9 px-4 rounded-lg border-border bg-card hover:bg-primary hover:text-primary-foreground text-foreground text-xs sm:text-sm font-medium shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <LogIn className="w-4 h-4 text-inherit" />
              <span>Masuk</span>
            </Button>
          )}
          <SettingsSheet />
        </div>
      </div>
    </header>
  );
}
