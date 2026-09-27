"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  UserPlus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

export function AuthModal() {
  const { isAuthModalOpen, isAuthenticated } = useAuth();

  if (!isAuthModalOpen || isAuthenticated) {
    return null;
  }

  return <AuthModalDialog />;
}

function AuthModalDialog() {
  const router = useRouter();
  const { 
    authModalOptions, 
    closeAuthModal, 
    login, 
    register 
  } = useAuth();

  const [activeTab, setActiveTab] = React.useState<"login" | "register">(
    () => authModalOptions?.tab || "login"
  );
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

  // Handle ESC key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAuthModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeAuthModal]);

  const handleSuccessfulAuth = () => {
    if (authModalOptions?.redirectTo) {
      router.push(authModalOptions.redirectTo);
    }
    setTimeout(() => {
      closeAuthModal();
    }, 600);
  };

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
    } else {
      setSuccessMsg("Berhasil masuk! Membuka akses...");
      handleSuccessfulAuth();
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
      name: regName.trim(),
      username: regUsername.trim(),
      email: regEmail.trim(),
      password: regPassword,
      phone: regPhone.trim() || undefined,
      address: regAddress.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || "Pendaftaran gagal. Periksa kembali data Anda.");
    } else {
      setSuccessMsg("Akun berhasil dibuat dan otomatis masuk! Membuka akses...");
      handleSuccessfulAuth();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeAuthModal();
        }
      }}
    >
      <div 
        className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-card border border-border rounded-lg shadow-2xl p-6 sm:p-7 my-auto text-foreground relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeAuthModal}
          className="absolute right-4 top-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
          title="Tutup dialog"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-6 pb-4 border-b border-border pr-6">
          <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground shrink-0 shadow-2xs">
            {authModalOptions?.moduleTitle ? (
              <Lock className="w-4.5 h-4.5" />
            ) : (
              <Globe2 className="w-4.5 h-4.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-lg tracking-tight text-foreground">Global Studio</span>
              {authModalOptions?.moduleTitle ? (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-medium flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  Perlu Masuk
                </span>
              ) : (
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-medium">
                  Autentikasi
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {authModalOptions?.moduleTitle ? (
                <>
                  Akses untuk modul <span className="font-semibold text-foreground">{authModalOptions.moduleTitle}</span> memerlukan akun. Silakan masuk atau daftar terlebih dahulu.
                </>
              ) : (
                activeTab === "register" ? "Silakan buat akun untuk mengakses platform" : "Silakan masuk ke akun Anda"
              )}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-secondary border border-border rounded-lg mb-5 text-sm font-medium">
          <button
            type="button"
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
            }}
            className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm ${
              activeTab === "login"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("register");
              setErrorMsg(null);
            }}
            className={`py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs sm:text-sm ${
              activeTab === "register"
                ? "bg-card text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2.5 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-secondary border border-border text-foreground text-sm flex items-center gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-sm py-1">
            <div>
              <label className="text-foreground block mb-1.5 font-medium text-xs sm:text-sm">
                Email atau Username <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="Email atau username Anda"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground block mb-1.5 font-medium text-xs sm:text-sm">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-3 h-10 text-sm font-medium rounded-lg shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Sedang Memeriksa..." : "Masuk ke Sistem"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-sm">
            <div>
              <label className="text-foreground block mb-1.5 font-medium">
                Nama Lengkap <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Budi Pratama"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
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
                  onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  placeholder="budipratama"
                  className="w-full bg-background border border-border rounded-lg py-2.5 px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors font-mono"
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
                    className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-foreground block mb-1.5 font-medium">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
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
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground block mb-1.5 font-medium">Alamat Domisili</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                <textarea
                  rows={2}
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Kota / Alamat lengkap domisili"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-10 text-sm font-medium rounded-lg shadow-sm cursor-pointer"
            >
              {isSubmitting ? "Sedang Mendaftar..." : "Daftar & Masuk ke Platform"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

// Backward compatibility alias
export const MandatoryAuthModal = AuthModal;
