"use client";

import * as React from "react";
import { 
  Lock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Globe2, 
  ArrowRight,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function MandatoryAuthModal() {
  const { isAuthenticated, isLoading, login, register } = useAuth();

  const [activeTab, setActiveTab] = React.useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = React.useState(false);

  const [loginIdentifier, setLoginIdentifier] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");

  const [regName, setRegName] = React.useState("");
  const [regUsername, setRegUsername] = React.useState("");
  const [regEmail, setRegEmail] = React.useState("");
  const [regPassword, setRegPassword] = React.useState("");
  const [regPhone, setRegPhone] = React.useState("");
  const [regAddress, setRegAddress] = React.useState("");

  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  if (isLoading || isAuthenticated) {
    return null;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg("Harap masukkan email/username dan password.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || "Gagal masuk. Periksa kembali data Anda.");
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("Nama, username, email, dan password wajib diisi.");
      return;
    }

    if (regPassword.length < 6) {
      setErrorMsg("Password minimal 6 karakter.");
      return;
    }

    setIsSubmitting(true);
    const result = await register({
      name: regName,
      username: regUsername,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      address: regAddress,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || "Pendaftaran gagal. Periksa kembali data Anda.");
    } else {
      setSuccessMsg("Akun berhasil dibuat dan otomatis masuk!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-card border border-border/90 rounded-2xl shadow-2xl p-5 sm:p-7 my-auto text-foreground relative animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-border/80">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Globe2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base sm:text-lg text-foreground">Global Studio</span>
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                Wajib Masuk
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeTab === "register" ? "Silakan buat akun untuk mengakses platform" : "Silakan masuk ke akun Anda"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 border border-border/60 rounded-xl mb-5 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "register"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar Akun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
            }}
            className={`py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Masuk</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === "register" ? (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-sm">
            <div>
              <label className="text-foreground block mb-1.5 font-medium">
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-foreground block mb-1.5 font-medium">
                  Username <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="budipratama"
                  className="w-full bg-background border border-border rounded-xl py-2.5 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-foreground block mb-1.5 font-medium">
                  Email <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="budi@example.com"
                    className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-foreground block mb-1.5 font-medium">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-foreground block mb-1.5 font-medium">Nomor HP / WhatsApp</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="081234567890"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground block mb-1.5 font-medium">Alamat</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                <textarea
                  rows={2}
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Kota / Alamat lengkap domisili"
                  className="w-full bg-background border border-border rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-11 text-sm font-semibold rounded-xl shadow-sm"
            >
              {isSubmitting ? "Sedang Mendaftar..." : "Daftar & Masuk ke Platform"}
              <ArrowRight className="w-4.5 h-4.5 ml-2" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm py-1">
            <div>
              <label className="text-foreground block mb-1.5 font-medium">
                Email atau Username <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Email atau username Anda"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground block mb-1.5 font-medium">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full bg-background border border-border rounded-xl py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 h-11 text-sm font-semibold rounded-xl shadow-sm"
            >
              {isSubmitting ? "Sedang Memeriksa..." : "Masuk ke Sistem"}
              <ArrowRight className="w-4.5 h-4.5 ml-2" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
