import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-sm">
        <h1 className="text-7xl font-bold tracking-tight text-foreground font-mono">404</h1>
        <p className="text-base text-muted-foreground">Halaman tidak ditemukan.</p>
        <div className="pt-2">
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
