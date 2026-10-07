"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminLoginCardProps {
  loginEmail: string;
  setLoginEmail: (val: string) => void;
  loginPassword: string;
  setLoginPassword: (val: string) => void;
  loginError: string | null;
  isLoggingIn: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AdminLoginCard({
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  isLoggingIn,
  onSubmit,
}: AdminLoginCardProps) {
  const [showPassword, setShowPassword] = React.useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-primary/20">
      <div className="w-full max-w-sm sm:max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-primary via-blue-500 to-amber-500" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3 shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground">Portal Admin</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Pusat Pengelolaan API Key & Pengguna Global Maps
          </p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Email / Username Admin
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder=""
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-secondary/50 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder=""
                className="w-full h-10 pl-9 pr-10 rounded-xl border border-border bg-secondary/50 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoggingIn}
            className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:opacity-90 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk Sebagai Admin</span>
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-4 border-t border-border/80 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Utama</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
