"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminHeaderProps {
  onLogout: () => void;
}

export function AdminHeader({ onLogout }: AdminHeaderProps) {
  return (
    <header className="h-14 sm:h-16 border-b border-border/80 bg-card/80 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs">
          GM
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm sm:text-base text-foreground">Global Maps Studio</span>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] h-5 px-1.5 font-mono">
              Admin
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          href="/"
          className="h-9 px-3 rounded-xl border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Buka Halaman Utama"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="hidden sm:inline">Halaman Utama</span>
        </Link>

        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="h-9 px-3 rounded-xl text-destructive hover:bg-destructive/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
          title="Keluar"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
