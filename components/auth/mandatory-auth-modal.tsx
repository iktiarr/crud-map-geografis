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
  ArrowRight,
  UserPlus,
  Loader2,
  Check,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

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
  const [existingEmailSuggestion, setExistingEmailSuggestion] = React.useState<string | null>(null);

  // Live Check ketersediaan saat register
  const [regUsernameStatus, setRegUsernameStatus] = React.useState<{ checking: boolean; available?: boolean; message?: string }>({ checking: false });
  const [regEmailStatus, setRegEmailStatus] = React.useState<{ checking: boolean; available?: boolean; message?: string }>({ checking: false });

  React.useEffect(() => {
    if (activeTab !== "register") return;

    const cleanU = regUsername.trim().toLowerCase();
    const cleanE = regEmail.trim().toLowerCase();

    if (!cleanU && !cleanE) {
      return;
    }

    const timer = setTimeout(async () => {
      let skipUserApi = false;
      let skipEmailApi = false;

      if (cleanU) {
        if (cleanU.length < 3) {
          setRegUsernameStatus({ checking: false, available: false, message: "Username minimal 3 karakter" });
          skipUserApi = true;
        } else if (!USERNAME_REGEX.test(cleanU)) {
          setRegUsernameStatus({ checking: false, available: false, message: "Hanya huruf, angka, titik, dan garis bawah" });
          skipUserApi = true;
        } else {
          setRegUsernameStatus((prev) => ({ ...prev, checking: true }));
        }
      } else {
        setRegUsernameStatus({ checking: false });
        skipUserApi = true;
      }

      if (cleanE) {
        if (!EMAIL_REGEX.test(cleanE)) {
          setRegEmailStatus({ checking: false, available: false, message: "Format email tidak valid" });
          skipEmailApi = true;
        } else {
          setRegEmailStatus((prev) => ({ ...prev, checking: true }));
        }
      } else {
        setRegEmailStatus({ checking: false });
        skipEmailApi = true;
      }

      if (skipUserApi && skipEmailApi) return;

      try {
        const uParam = !skipUserApi && cleanU ? `username=${encodeURIComponent(cleanU)}` : "";
        const eParam = !skipEmailApi && cleanE ? `email=${encodeURIComponent(cleanE)}` : "";
        const query = [uParam, eParam].filter(Boolean).join("&");

        if (!query) return;

        const res = await fetch(`/api/auth/check-availability?${query}`);
        const data = await res.json();
        if (data.success) {
          if (data.username && !skipUserApi) setRegUsernameStatus({ checking: false, ...data.username });
          if (data.email && !skipEmailApi) setRegEmailStatus({ checking: false, ...data.email });
        }
      } catch {
        if (!skipUserApi) setRegUsernameStatus((prev) => ({ ...prev, checking: false }));
        if (!skipEmailApi) setRegEmailStatus((prev) => ({ ...prev, checking: false }));
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [regUsername, regEmail, activeTab]);

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
    setExistingEmailSuggestion(null);

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
    setExistingEmailSuggestion(null);

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword) {
      setErrorMsg("Semua kolom wajib diisi.");
      return;
    }

    if (regPassword.length < 8) {
      setErrorMsg("Password minimal 8 karakter.");
      return;
    }

    if (regUsernameStatus.available === false) {
      setErrorMsg("Username sudah digunakan.");
      return;
    }

    if (regEmailStatus.available === false) {
      setErrorMsg("Email sudah terdaftar.");
      setExistingEmailSuggestion(regEmail.trim());
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
      const err = result.error || "Pendaftaran gagal. Periksa kembali data Anda.";
      setErrorMsg(err);
      if (err.toLowerCase().includes("email") && err.toLowerCase().includes("terdaftar")) {
        setExistingEmailSuggestion(regEmail.trim());
      }
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
        {/* Header */}
        <div className="text-center mb-5 pb-4 border-b border-border space-y-1">
          <h2 className="font-bold text-xl tracking-tight text-foreground">
            {activeTab === "login" ? "Login" : "Register"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {activeTab === "login" ? "Masuk ke akun Anda" : "Daftar akun baru"}
          </p>
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
            <span>Login</span>
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
            <span>Register</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1.5 font-medium">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {existingEmailSuggestion && (
              <button
                type="button"
                onClick={() => {
                  setLoginIdentifier(existingEmailSuggestion);
                  setActiveTab("login");
                  setErrorMsg(null);
                  setExistingEmailSuggestion(null);
                }}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer pt-0.5"
              >
                <span>➔ Klik di sini untuk Masuk langsung dengan email {existingEmailSuggestion}</span>
              </button>
            )}
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
              <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                <span>Email atau Username <span className="text-destructive">*</span></span>
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
              <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                <span>Password <span className="text-destructive">*</span></span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Kata sandi akun Anda"
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
              <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                <span>Nama Lengkap <span className="text-destructive">*</span></span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                  <span>Username <span className="text-destructive">*</span></span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                    placeholder="Username"
                    className={`w-full bg-background border rounded-lg py-2.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors font-mono ${
                      regUsernameStatus.available === false
                        ? "border-destructive text-destructive focus:border-destructive"
                        : regUsernameStatus.available
                        ? "border-emerald-500 focus:border-emerald-500"
                        : "border-border focus:border-primary"
                    }`}
                  />
                </div>
                {regUsernameStatus.checking ? (
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Cek username...</span>
                  </div>
                ) : regUsernameStatus.message ? (
                  <div className={`text-[11px] mt-1 flex items-center gap-1 ${regUsernameStatus.available === false ? "text-destructive font-medium" : "text-emerald-600 dark:text-emerald-400 font-medium"}`}>
                    {regUsernameStatus.available === false ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <Check className="w-3 h-3 shrink-0" />}
                    <span>{regUsernameStatus.message}</span>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                  <span>Email <span className="text-destructive">*</span></span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className={`w-full bg-background border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                      regEmailStatus.available === false
                        ? "border-destructive text-destructive focus:border-destructive"
                        : regEmailStatus.available
                        ? "border-emerald-500 focus:border-emerald-500"
                        : "border-border focus:border-primary"
                    }`}
                  />
                </div>
                {regEmailStatus.checking ? (
                  <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Cek email...</span>
                  </div>
                ) : regEmailStatus.message ? (
                  <div className={`text-[11px] mt-1 flex items-center gap-1 ${regEmailStatus.available === false ? "text-destructive font-medium" : "text-emerald-600 dark:text-emerald-400 font-medium"}`}>
                    {regEmailStatus.available === false ? <AlertTriangle className="w-3 h-3 shrink-0" /> : <Check className="w-3 h-3 shrink-0" />}
                    <span>{regEmailStatus.message}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                <span>Password <span className="text-destructive">*</span></span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Kata sandi baru (min. 8 karakter)"
                  className={`w-full bg-background border rounded-lg py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                    regPassword.length > 0 && regPassword.length < 8
                      ? "border-destructive text-destructive focus:border-destructive"
                      : regPassword.length >= 8
                      ? "border-emerald-500 focus:border-emerald-500"
                      : "border-border focus:border-primary"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regPassword.length > 0 && regPassword.length < 8 ? (
                <div className="text-[11px] mt-1.5 flex items-center gap-1.5 text-destructive font-medium">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Password minimal 8 karakter</span>
                </div>
              ) : regPassword.length >= 8 ? (
                <div className="text-[11px] mt-1.5 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Password memenuhi syarat</span>
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                <span>Nomor HP / WhatsApp</span>
                <span className="text-[11px] font-normal text-muted-foreground">Opsional</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="081234567890 (opsional)"
                  className="w-full bg-background border border-border rounded-lg py-2.5 pl-10 pr-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-foreground mb-1.5 font-medium flex items-center justify-between text-xs sm:text-sm">
                <span>Alamat Domisili</span>
                <span className="text-[11px] font-normal text-muted-foreground">Opsional</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
                <textarea
                  rows={2}
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="Alamat domisili Anda (opsional)"
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
