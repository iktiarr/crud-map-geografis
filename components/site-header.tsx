"use client";

import * as React from "react";
import Link from "next/link";
import { Globe2 } from "lucide-react";
import { SettingsSheet } from "@/components/settings-sheet";

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
  return (
    <header className="border-b border-border/80 bg-background/80 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/" className="flex items-center gap-2.5 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-linear-to-tr from-olive-drab-600 to-olive-drab-400 p-px shadow-sm group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-card rounded-[15px] flex items-center justify-center">
                <Globe2 className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-primary" />
              </div>
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-foreground group-hover:text-primary transition-colors truncate">
              Global Studio
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {children}
          <SettingsSheet />
        </div>
      </div>
    </header>
  );
}
