"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-7xl font-bold tracking-tight text-destructive font-mono">500</h1>
        <p className="text-base text-muted-foreground">Terjadi kesalahan pada sistem.</p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors border border-border"
          >
            Coba Lagi
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
