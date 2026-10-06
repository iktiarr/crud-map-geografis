"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="id" className="dark">
      <body className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 antialiased">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-7xl font-bold tracking-tight text-red-500 font-mono">500</h1>
          <p className="text-base text-zinc-400">Terjadi gangguan server internal.</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              Coba Lagi
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
