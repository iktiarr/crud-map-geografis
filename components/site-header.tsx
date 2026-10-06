"use client";

import * as React from "react";
import Link from "next/link";
import { Globe2, LogIn } from "lucide-react";
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

export function SiteHeader({ children }: SiteHeaderProps) {
  const { isAuthenticated, openAuthModal } = useAuth();

  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg border border-border bg-card shadow-xs group-hover:border-zinc-400 group-hover:bg-secondary transition-all flex items-center justify-center shrink-0">
              <Globe2 className="w-5 h-5 text-foreground group-hover:text-primary transition-colors" />
            </div>
            <span className="font-bold text-lg sm:text-xl tracking-tight text-foreground group-hover:text-primary transition-colors truncate font-sans">
              Global Maps Studio
            </span>
          </Link>
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
