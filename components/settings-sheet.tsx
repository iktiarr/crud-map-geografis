"use client";

import * as React from "react";
import { 
  User, 
  Settings, 
  LogOut, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Check, 
  AlertTriangle,
  Sun, 
  Moon, 
  Laptop, 
  ChevronRight, 
  ArrowLeft, 
  Palette, 
  Edit3, 
  Lock, 
  Eye,
  EyeOff,
  Loader2, 
  LogIn, 
  UserPlus,
  Database,
  Sparkles,
  Send,
  MessageSquareWarning,
  AlertCircle,
  RefreshCw,
  Server,
  Globe
} from "lucide-react";
import { useTheme } from "next-themes";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { ConfirmModal } from "@/components/confirm-modal";

type SettingsView = "main" | "profile" | "theme" | "system" | "report";

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

interface SystemStatus {
  database: {
    connected: boolean;
    type: string;
    tablesCount: number;
    error?: string | null;
  };
  ai: {
    configured: boolean;
    provider: string;
  };
}

export function SettingsSheet() {
  const { user, isAuthenticated, logout, updateProfile, openAuthModal } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<SettingsView>("main");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);

  // State Profil
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null);

  const [formName, setFormName] = React.useState(() => user?.name || "");
  const [formUsername, setFormUsername] = React.useState(() => user?.username || "");
  const [formEmail, setFormEmail] = React.useState(() => user?.email || "");
  const [formPhone, setFormPhone] = React.useState(() => user?.phone || "");
  const [formAddress, setFormAddress] = React.useState(() => user?.address || "");
  const [formPassword, setFormPassword] = React.useState("");
  const [showEditPassword, setShowEditPassword] = React.useState(false);

  // Live Check Ketersediaan Username & Email Unik
  const [usernameCheck, setUsernameCheck] = React.useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
    isSelf?: boolean;
  }>({ checking: false });

  const [emailCheck, setEmailCheck] = React.useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
    isSelf?: boolean;
  }>({ checking: false });

  React.useEffect(() => {
    if (!isEditingProfile) return;

    const cleanU = formUsername.trim().toLowerCase();
    const cleanE = formEmail.trim().toLowerCase();

    if (!cleanU && !cleanE) return;

    const timer = setTimeout(async () => {
      let skipUserApi = false;
      let skipEmailApi = false;

      if (cleanU) {
        if (cleanU.length < 3) {
          setUsernameCheck({ checking: false, available: false, message: "Username minimal 3 karakter", isSelf: false });
          skipUserApi = true;
        } else if (!USERNAME_REGEX.test(cleanU)) {
          setUsernameCheck({ checking: false, available: false, message: "Hanya huruf, angka, titik, dan garis bawah", isSelf: false });
          skipUserApi = true;
        } else {
          setUsernameCheck((prev) => ({ ...prev, checking: true }));
        }
      } else {
        setUsernameCheck({ checking: false });
        skipUserApi = true;
      }

      if (cleanE) {
        if (!EMAIL_REGEX.test(cleanE)) {
          setEmailCheck({ checking: false, available: false, message: "Format email tidak valid", isSelf: false });
          skipEmailApi = true;
        } else {
          setEmailCheck((prev) => ({ ...prev, checking: true }));
        }
      } else {
        setEmailCheck({ checking: false });
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
          if (data.username && !skipUserApi) setUsernameCheck({ checking: false, ...data.username });
          if (data.email && !skipEmailApi) setEmailCheck({ checking: false, ...data.email });
        }
      } catch {
        if (!skipUserApi) setUsernameCheck((prev) => ({ ...prev, checking: false }));
        if (!skipEmailApi) setEmailCheck((prev) => ({ ...prev, checking: false }));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [formUsername, formEmail, isEditingProfile]);

  // State Status Sistem (Database & AI)
  const [status, setStatus] = React.useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(false);

  // State Laporkan Masalah (Telegram Bot)
  const [reportMessage, setReportMessage] = React.useState("");
  const [isSendingReport, setIsSendingReport] = React.useState(false);
  const [reportSuccess, setReportSuccess] = React.useState<string | null>(null);
  const [reportError, setReportError] = React.useState<string | null>(null);

  const fetchStatus = React.useCallback(async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/system-status");
      const data = await res.json();
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    let isSubscribed = true;

    const loadStatus = async () => {
      try {
        const res = await fetch("/api/system-status");
        const data = await res.json();
        if (isSubscribed) {
          setStatus(data);
        }
      } catch {
        // ignore
      }
    };

    loadStatus();

    return () => {
      isSubscribed = false;
    };
  }, [isOpen]);

  const resetForm = React.useCallback(() => {
    setFormName(user?.name || "");
    setFormUsername(user?.username || "");
    setFormEmail(user?.email || "");
    setFormPhone(user?.phone || "");
    setFormAddress(user?.address || "");
    setFormPassword("");
    setShowEditPassword(false);
    setProfileError(null);
    setProfileSuccess(null);
    setUsernameCheck({ checking: false });
    setEmailCheck({ checking: false });
  }, [user]);

  const handleConfirmLogout = async () => {
    await logout();
    setIsOpen(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);

    if (!formName.trim() || !formUsername.trim() || !formEmail.trim()) {
      setProfileError("Nama lengkap, username, dan email wajib diisi.");
      return;
    }

    if (formPassword.trim() && formPassword.trim().length < 8) {
      setProfileError("Password minimal 8 karakter.");
      return;
    }

    if (usernameCheck.available === false && !usernameCheck.isSelf) {
      setProfileError("Username sudah digunakan.");
      return;
    }

    if (emailCheck.available === false && !emailCheck.isSelf) {
      setProfileError("Email sudah terdaftar.");
      return;
    }

    setIsSavingProfile(true);

    const result = await updateProfile({
      name: formName.trim(),
      username: formUsername.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim() || undefined,
      address: formAddress.trim() || undefined,
      newPassword: formPassword.trim() ? formPassword.trim() : undefined,
    });

    const isPasswordChanged = Boolean(formPassword.trim());

    setIsSavingProfile(false);

    if (result.success) {
      if (isPasswordChanged) {
        setProfileSuccess("Password berhasil diubah. Mengalihkan ke login...");
        setFormPassword("");
        setTimeout(async () => {
          setIsEditingProfile(false);
          setProfileSuccess(null);
          setIsOpen(false);
          await logout();
          openAuthModal({ tab: "login" });
        }, 1200);
      } else {
        setProfileSuccess("Profil Anda berhasil diperbarui!");
        setFormPassword("");
        setTimeout(() => {
          setIsEditingProfile(false);
          setProfileSuccess(null);
        }, 1500);
      }
    } else {
      setProfileError(result.error || "Gagal memperbarui profil.");
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportError(null);
    setReportSuccess(null);

    if (!reportMessage.trim()) {
      setReportError("Pesan laporan wajib diisi.");
      return;
    }

    setIsSendingReport(true);

    try {
      const res = await fetch("/api/telegram-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user?.username || "Tamu",
          message: reportMessage.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReportSuccess("Laporan Anda berhasil dikirim ke Bot Telegram.");
        setReportMessage("");
      } else {
        setReportError(data.error || "Gagal mengirim laporan ke Bot Telegram.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan koneksi saat mengirim laporan.";
      setReportError(msg);
    } finally {
      setIsSendingReport(false);
    }
  };

  const formattedDate = React.useMemo(() => {
    if (!user?.createdAt) return "-";
    try {
      return new Date(user.createdAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }, [user]);

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  const getThemeLabel = () => {
    if (theme === "dark") return "Gelap (Dark)";
    if (theme === "light") return "Terang (Light)";
    return "Sistem Otomatis";
  };

  return (
    <>
      <Sheet 
        open={isOpen} 
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) {
            resetForm();
            setReportError(null);
            setReportSuccess(null);
            setReportMessage("");
          } else {
            setTimeout(() => {
              setCurrentView("main");
              setIsEditingProfile(false);
              setProfileError(null);
              setProfileSuccess(null);
              setReportError(null);
              setReportSuccess(null);
              setReportMessage("");
            }, 200);
          }
        }}
      >
        <SheetTrigger
          render={
            isAuthenticated && user ? (
              <button
                type="button"
                className="flex items-center gap-2 h-9 px-3 rounded-lg bg-secondary hover:bg-secondary/80 border border-border hover:border-zinc-400 text-xs sm:text-sm font-medium text-foreground transition-all shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Pengaturan Akun"
                title={`Pengaturan Akun (@${user.username})`}
              >
                <div className="w-5 h-5 rounded-md bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
                <span className="truncate max-w-28 sm:max-w-36 font-mono">@{user.username}</span>
              </button>
            ) : (
              <button
                type="button"
                className="h-9 w-9 rounded-lg border border-border bg-card hover:border-zinc-400 hover:bg-secondary text-foreground shadow-xs transition-colors flex items-center justify-center shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Buka Pengaturan"
                title="Buka Pengaturan"
              >
                <Settings className="w-4 h-4 text-foreground" />
              </button>
            )
          }
        />

        <SheetContent side="right" showCloseButton={false} className="p-0 flex flex-col justify-between overflow-hidden sm:max-w-md">
          <div className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="p-4 sm:p-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                {currentView !== "main" ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      if (isEditingProfile) {
                        setIsEditingProfile(false);
                        setProfileError(null);
                      } else {
                        setCurrentView("main");
                      }
                    }}
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0 -ml-1 cursor-pointer"
                    title="Kembali"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-secondary border border-border flex items-center justify-center text-foreground shrink-0 shadow-2xs">
                    <Settings className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <SheetTitle className="text-base sm:text-lg font-bold text-foreground">
                    {currentView === "main" && "Pengaturan & Menu"}
                    {currentView === "profile" && (isEditingProfile ? "Edit Profil Pengguna" : "Informasi Profil")}
                    {currentView === "theme" && "Pengaturan Tampilan"}
                    {currentView === "system" && "Status Koneksi & Layanan"}
                    {currentView === "report" && "Laporkan ke Bot Telegram"}
                  </SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
                    {currentView === "main" && "Pilih opsi di bawah untuk membuka pengaturan"}
                    {currentView === "profile" && (isEditingProfile ? "Perbarui data informasi akun Anda" : "Data identitas pengguna terdaftar")}
                    {currentView === "theme" && "Sesuaikan tema terang atau gelap"}
                    {currentView === "system" && "Informasi koneksi database PostgreSQL & AI"}
                    {currentView === "report" && "Kirim kendala, saran, atau laporan ke admin"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col">
              {/* VIEW 1: MAIN MENU */}
              {currentView === "main" && (
                <div className="space-y-5 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {!isAuthenticated && (
                      <div className="p-4 rounded-lg border border-border bg-card space-y-3 shadow-xs">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-secondary border border-border text-foreground shrink-0 shadow-2xs">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              Masuk ke Akun Anda
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                              Masuk atau daftarkan akun untuk membuka seluruh modul spasial & sinkronisasi data Anda.
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setIsOpen(false);
                              openAuthModal({ tab: "login" });
                            }}
                            className="w-full text-xs font-medium rounded-lg h-9 shadow-xs cursor-pointer"
                          >
                            <LogIn className="w-3.5 h-3.5 mr-1.5" />
                            Masuk
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsOpen(false);
                              openAuthModal({ tab: "register" });
                            }}
                            className="w-full text-xs font-medium rounded-lg h-9 border-border text-foreground hover:bg-secondary cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                            Daftar Akun
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1.5 font-mono">
                      Menu Pengaturan
                    </div>

                    {/* 1. Profil Pengguna */}
                    <button
                      type="button"
                      onClick={() => { resetForm(); setCurrentView("profile"); }}
                      className="w-full p-3.5 sm:p-4 rounded-lg border border-border bg-card hover:bg-secondary/60 flex items-center justify-between transition-colors text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-secondary text-foreground border border-border shrink-0 shadow-2xs">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            Profil Pengguna
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isAuthenticated && user ? `@${user.username} - ${user.name}` : "Belum masuk (Klik untuk melihat)"}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* 2. Tema & Tampilan */}
                    <button
                      type="button"
                      onClick={() => setCurrentView("theme")}
                      className="w-full p-3.5 sm:p-4 rounded-lg border border-border bg-card hover:bg-secondary/60 flex items-center justify-between transition-colors text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-secondary text-foreground border border-border shrink-0 shadow-2xs">
                          <Palette className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            Tema & Tampilan
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getThemeLabel()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* 3. Status Database & AI */}
                    {(() => {
                      const isDbOk = status?.database.connected;
                      const isAiOk = status?.ai.configured;
                      const isAllOk = !!(isDbOk && isAiOk);
                      const isAnyError = status ? (!isDbOk || !isAiOk) : false;

                      return (
                        <button
                          type="button"
                          onClick={() => { fetchStatus(); setCurrentView("system"); }}
                          className="w-full p-3.5 sm:p-4 rounded-lg border border-border bg-card hover:bg-secondary/60 flex items-center justify-between transition-colors text-left group cursor-pointer shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-lg bg-secondary text-foreground border border-border shrink-0 shadow-2xs">
                              <Server className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                <span>Status Server & Database</span>
                                {status && (
                                  isAllOk ? (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold" title="Semua Layanan Terhubung">
                                      <Check className="w-3 h-3 stroke-[2.5]" />
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold animate-pulse" title="Periksa Koneksi">
                                      <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                                    </span>
                                  )
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {isAllOk
                                  ? "Semua layanan terhubung"
                                  : isAnyError
                                  ? "Perhatian: Masalah koneksi terdeteksi"
                                  : "Cek status database & API Key"}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })()}

                    {/* 4. Laporkan Masalah / Bot Telegram */}
                    <button
                      type="button"
                      onClick={() => {
                        setReportError(null);
                        setReportSuccess(null);
                        setCurrentView("report");
                      }}
                      className="w-full p-3.5 sm:p-4 rounded-lg border border-border bg-card hover:bg-secondary/60 flex items-center justify-between transition-colors text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-secondary text-foreground border border-border shrink-0 shadow-2xs">
                          <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            Laporkan Masukan / Kendala
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Kirim pesan langsung ke Bot Telegram
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    {/* 5. Portal Admin */}
                    <a
                      href="/admin"
                      className="w-full p-3.5 sm:p-4 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 flex items-center justify-between transition-colors text-left group cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0 shadow-2xs">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-semibold text-primary group-hover:underline transition-colors flex items-center gap-1.5">
                            <span>Portal Admin</span>
                            <Badge className="text-[10px] h-4 px-1 bg-primary text-primary-foreground">Khusus</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Kelola Kunci API OpenRouter & Pengguna
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4.5 h-4.5 text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </a>
                  </div>

                  {isAuthenticated && (
                    <div className="pt-4 mt-auto">
                      <Button
                        variant="outline"
                        onClick={() => setIsLogoutConfirmOpen(true)}
                        className="w-full text-sm font-medium text-destructive hover:bg-destructive/10 hover:border-destructive/30 rounded-lg h-9 shadow-xs cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Keluar dari Akun
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 2: PROFILE */}
              {currentView === "profile" && (
                <div className="space-y-4 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  {isAuthenticated && user ? (
                    <>
                      {isEditingProfile ? (
                        <form onSubmit={handleSaveProfile} className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3.5 text-sm">
                            {profileError && (
                              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-start gap-2.5">
                                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                <span>{profileError}</span>
                              </div>
                            )}

                            {profileSuccess && (
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2.5">
                                <Check className="w-4 h-4 shrink-0" />
                                <span>{profileSuccess}</span>
                              </div>
                            )}

                            {/* Nama Lengkap */}
                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-xs uppercase tracking-wider font-mono">
                                Nama Lengkap
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-muted-foreground">
                                  <User className="w-4 h-4" />
                                </span>
                                <input
                                  type="text"
                                  value={formName}
                                  onChange={(e) => setFormName(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors"
                                  placeholder="Nama lengkap Anda"
                                  required
                                />
                              </div>
                            </div>

                            {/* Username Unik */}
                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-xs uppercase tracking-wider font-mono flex items-center justify-between">
                                <span>Username</span>
                                <span className="text-[11px] font-normal normal-case text-muted-foreground">Hanya huruf, angka, titik, garis bawah</span>
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-muted-foreground text-sm font-mono">@</span>
                                <input
                                  type="text"
                                  value={formUsername}
                                  onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
                                  className={`w-full pl-7 pr-3 py-2 text-sm font-mono rounded-lg bg-card border transition-colors focus:outline-none ${
                                    usernameCheck.available === false && !usernameCheck.isSelf
                                      ? "border-destructive focus:border-destructive text-destructive"
                                      : usernameCheck.available && !usernameCheck.isSelf
                                      ? "border-emerald-500 focus:border-emerald-500"
                                      : "border-border focus:border-primary"
                                  }`}
                                  placeholder="Username (min. 3 karakter)"
                                  required
                                />
                              </div>
                              {/* Live Feedback Username */}
                              {usernameCheck.checking ? (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Memeriksa ketersediaan username...</span>
                                </div>
                              ) : usernameCheck.message ? (
                                <div className={`text-[11px] flex items-center gap-1.5 ${
                                  usernameCheck.available === false && !usernameCheck.isSelf
                                    ? "text-destructive font-medium"
                                    : usernameCheck.available && !usernameCheck.isSelf
                                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                    : "text-muted-foreground"
                                }`}>
                                  {usernameCheck.available === false && !usernameCheck.isSelf ? (
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                  ) : usernameCheck.available && !usernameCheck.isSelf ? (
                                    <Check className="w-3 h-3 shrink-0" />
                                  ) : null}
                                  <span>{usernameCheck.message}</span>
                                </div>
                              ) : null}
                            </div>

                            {/* Alamat Email Unik */}
                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-xs uppercase tracking-wider font-mono">
                                Alamat Email
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-muted-foreground">
                                  <Mail className="w-4 h-4" />
                                </span>
                                <input
                                  type="email"
                                  value={formEmail}
                                  onChange={(e) => setFormEmail(e.target.value)}
                                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-card border transition-colors focus:outline-none ${
                                    emailCheck.available === false && !emailCheck.isSelf
                                      ? "border-destructive focus:border-destructive text-destructive"
                                      : emailCheck.available && !emailCheck.isSelf
                                      ? "border-emerald-500 focus:border-emerald-500"
                                      : "border-border focus:border-primary"
                                  }`}
                                  placeholder="nama@email.com"
                                  required
                                />
                              </div>
                              {/* Live Feedback Email */}
                              {emailCheck.checking ? (
                                <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  <span>Memeriksa email...</span>
                                </div>
                              ) : emailCheck.message ? (
                                <div className={`text-[11px] flex items-center gap-1.5 ${
                                  emailCheck.available === false && !emailCheck.isSelf
                                    ? "text-destructive font-medium"
                                    : emailCheck.available && !emailCheck.isSelf
                                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                    : "text-muted-foreground"
                                }`}>
                                  {emailCheck.available === false && !emailCheck.isSelf ? (
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                  ) : emailCheck.available && !emailCheck.isSelf ? (
                                    <Check className="w-3 h-3 shrink-0" />
                                  ) : null}
                                  <span>{emailCheck.message}</span>
                                </div>
                              ) : null}
                            </div>

                            {/* Nomor Telepon */}
                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-xs uppercase tracking-wider font-mono">
                                Nomor Telepon
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-muted-foreground">
                                  <Phone className="w-4 h-4" />
                                </span>
                                <input
                                  type="tel"
                                  value={formPhone}
                                  onChange={(e) => setFormPhone(e.target.value)}
                                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors"
                                  placeholder="081234567890 (opsional)"
                                />
                              </div>
                            </div>

                            {/* Alamat Lengkap */}
                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-xs uppercase tracking-wider font-mono">
                                Alamat Lengkap
                              </label>
                              <div className="relative">
                                <textarea
                                  value={formAddress}
                                  onChange={(e) => setFormAddress(e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors resize-none"
                                  placeholder="Alamat domisili atau kantor (opsional)"
                                />
                              </div>
                            </div>

                            {/* Ganti Password */}
                            <div className="space-y-1.5 pt-1">
                              <label className="text-foreground font-semibold text-xs uppercase tracking-wider font-mono">
                                Ganti Password <span className="text-xs font-normal text-muted-foreground font-sans">(Opsional)</span>
                              </label>
                              <div className="relative flex items-center">
                                <span className="absolute left-3 text-muted-foreground">
                                  <Lock className="w-4 h-4" />
                                </span>
                                <input
                                  type={showEditPassword ? "text" : "password"}
                                  value={formPassword}
                                  onChange={(e) => setFormPassword(e.target.value)}
                                  className={`w-full pl-9 pr-10 py-2 text-sm rounded-lg bg-card border transition-colors focus:outline-none ${
                                    formPassword.length > 0 && formPassword.length < 8
                                      ? "border-destructive text-destructive focus:border-destructive"
                                      : formPassword.length >= 8
                                      ? "border-emerald-500 focus:border-emerald-500"
                                      : "border-border focus:border-primary"
                                  }`}
                                  placeholder="Kata sandi baru (min. 8 karakter)"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowEditPassword(!showEditPassword)}
                                  className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1"
                                  title={showEditPassword ? "Sembunyikan password" : "Lihat password"}
                                  aria-label={showEditPassword ? "Sembunyikan password" : "Lihat password"}
                                >
                                  {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                              {formPassword.length > 0 && formPassword.length < 8 ? (
                                <div className="text-[11px] mt-1.5 flex items-center gap-1.5 text-destructive font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Password minimal 8 karakter</span>
                                </div>
                              ) : formPassword.length >= 8 ? (
                                <div className="text-[11px] mt-1.5 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Check className="w-3.5 h-3.5 shrink-0" />
                                  <span>Password memenuhi syarat</span>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                resetForm();
                                setIsEditingProfile(false);
                              }}
                              className="w-1/2 h-9 text-sm rounded-lg border-border cursor-pointer"
                              disabled={isSavingProfile}
                            >
                              Batal
                            </Button>
                            <Button
                              type="submit"
                              className="w-1/2 h-9 text-sm rounded-lg font-medium shadow-xs cursor-pointer"
                              disabled={
                                isSavingProfile ||
                                (usernameCheck.available === false && !usernameCheck.isSelf) ||
                                (emailCheck.available === false && !emailCheck.isSelf)
                              }
                            >
                              {isSavingProfile ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Menyimpan...
                                </>
                              ) : (
                                "Simpan Profil"
                              )}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="space-y-4">
                            {/* Card Identitas Utama */}
                            <div className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center gap-3.5">
                              <div className="w-12 h-12 rounded-xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                                {userInitial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-base text-foreground truncate">{user.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">@{user.username}</div>
                              </div>
                              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs flex items-center gap-1 shrink-0">
                                <Check className="w-3 h-3 stroke-[2.5]" />
                                <span>Terverifikasi</span>
                              </Badge>
                            </div>

                            {/* Detail List */}
                            <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3 divide-y divide-border/60">
                              <div className="flex items-center gap-3 pt-1 first:pt-0">
                                <div className="p-2 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">
                                  <Mail className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs text-muted-foreground">Alamat Email</div>
                                  <div className="text-sm font-medium text-foreground truncate">{user.email}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-3">
                                <div className="p-2 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">
                                  <Phone className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs text-muted-foreground">Nomor Telepon</div>
                                  <div className="text-sm font-medium text-foreground truncate">{user.phone || "-"}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-3">
                                <div className="p-2 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">
                                  <MapPin className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs text-muted-foreground">Alamat</div>
                                  <div className="text-sm font-medium text-foreground truncate">{user.address || "-"}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 pt-3">
                                <div className="p-2 rounded-lg bg-secondary text-muted-foreground border border-border shrink-0">
                                  <Calendar className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs text-muted-foreground">Bergabung Sejak</div>
                                  <div className="text-sm font-medium text-foreground truncate">{formattedDate}</div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2">
                            <Button
                              type="button"
                              onClick={() => {
                                resetForm();
                                setIsEditingProfile(true);
                              }}
                              className="w-full h-9 text-sm font-medium rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit Informasi Profil</span>
                            </Button>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="p-6 text-center space-y-4 my-auto">
                      <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center mx-auto text-muted-foreground">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-base text-foreground">Anda Belum Masuk ke Akun</div>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                          Silakan masuk atau buat akun baru untuk mengelola profil dan mendapatkan akses penuh ke platform.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2 max-w-xs mx-auto">
                        <Button
                          type="button"
                          onClick={() => {
                            setIsOpen(false);
                            openAuthModal({ tab: "login" });
                          }}
                          className="w-full h-9 text-sm font-medium rounded-lg shadow-xs cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Masuk Sekarang
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsOpen(false);
                            openAuthModal({ tab: "register" });
                          }}
                          className="w-full h-9 text-sm font-medium rounded-lg border-border cursor-pointer hover:bg-secondary"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Daftar Akun Baru
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* VIEW 3: THEME */}
              {currentView === "theme" && (
                <div className="space-y-4 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`w-full p-3.5 rounded-lg border flex items-center justify-between transition-all text-sm font-medium cursor-pointer ${
                          theme === "light"
                            ? "border-primary bg-card text-foreground shadow-xs ring-1 ring-primary"
                            : "border-border bg-card text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Sun className="w-4.5 h-4.5 text-foreground" />
                          <span>Mode Terang</span>
                        </div>
                        {theme === "light" && <Check className="w-4 h-4 text-foreground" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`w-full p-3.5 rounded-lg border flex items-center justify-between transition-all text-sm font-medium cursor-pointer ${
                          theme === "dark"
                            ? "border-primary bg-card text-foreground shadow-xs ring-1 ring-primary"
                            : "border-border bg-card text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Moon className="w-4.5 h-4.5 text-foreground" />
                          <span>Mode Gelap</span>
                        </div>
                        {theme === "dark" && <Check className="w-4 h-4 text-foreground" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={`w-full p-3.5 rounded-lg border flex items-center justify-between transition-all text-sm font-medium cursor-pointer ${
                          theme === "system"
                            ? "border-primary bg-card text-foreground shadow-xs ring-1 ring-primary"
                            : "border-border bg-card text-foreground hover:bg-secondary/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Laptop className="w-4.5 h-4.5 text-foreground" />
                          <span>Sistem Otomatis</span>
                        </div>
                        {theme === "system" && <Check className="w-4 h-4 text-foreground" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 4: SYSTEM STATUS */}
              {currentView === "system" && (
                <div className="space-y-4 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground font-mono">Status Koneksi</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={fetchStatus}
                        disabled={isLoadingStatus}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isLoadingStatus ? "animate-spin" : ""}`} />
                        Perbarui
                      </Button>
                    </div>

                    {/* Card 1: Database Status */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${
                          status?.database.connected 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        }`}>
                          <Database className="w-4 h-4" />
                        </div>
                        <div className="font-semibold text-sm text-foreground">Database</div>
                      </div>
                      {status?.database.connected ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Terhubung</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-mono text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                          <span>Terputus</span>
                        </Badge>
                      )}
                    </div>

                    {/* Card 2: AI Status */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg border ${
                          status?.ai.configured 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                            : "bg-destructive/10 text-destructive border-destructive/30"
                        }`}>
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="font-semibold text-sm text-foreground">AI</div>
                      </div>
                      {status?.ai.configured ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Terhubung</span>
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="font-mono text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 stroke-[2.5]" />
                          <span>Terputus</span>
                        </Badge>
                      )}
                    </div>

                    {/* Card 3: Website Aktif & Kepemilikan (Kustom di Kode) */}
                    <div className="p-3.5 rounded-xl border border-border bg-card shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                            <Globe className="w-4 h-4" />
                          </div>
                          <div className="font-semibold text-sm text-foreground">Website Aktif</div>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono text-xs flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Aktif</span>
                        </Badge>
                      </div>

                      {/* Deskripsi Kustom Tempat Pesan Pemilik */}
                      <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground leading-relaxed">
                        Website ini telah diverifikasi.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 5: LAPORKAN KE BOT TELEGRAM */}
              {currentView === "report" && (
                <div className="space-y-4 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  <form onSubmit={handleSendReport} className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3.5 text-sm">
                      {reportError && (
                        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-2">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>{reportError}</span>
                          </div>
                          <a
                            href="https://t.me/Laporan_Website_Bot"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-destructive text-destructive-foreground font-medium text-xs hover:opacity-90 transition-opacity"
                          >
                            <Send className="w-3 h-3" />
                            <span>Klik Di Sini untuk Buka @Laporan_Website_Bot & Tekan Start</span>
                          </a>
                        </div>
                      )}

                      {reportSuccess && (
                        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2.5">
                          <Check className="w-4 h-4 shrink-0" />
                          <span>{reportSuccess}</span>
                        </div>
                      )}

                      {/* Pesan Laporan */}
                      <div className="space-y-1.5">
                        <label className="text-foreground font-semibold text-xs uppercase tracking-wider font-mono">
                          Pesan Laporan
                        </label>
                        <textarea
                          value={reportMessage}
                          onChange={(e) => setReportMessage(e.target.value)}
                          rows={7}
                          className="w-full px-3 py-2.5 text-sm rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors resize-none placeholder:text-muted-foreground"
                          placeholder="Tuliskan kendala, saran, atau pesan laporan Anda di sini..."
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-4 mt-auto">
                      <Button
                        type="submit"
                        disabled={isSendingReport}
                        className="w-full h-10 text-sm font-medium rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        {isSendingReport ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Mengirim ke Telegram...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            <span>Kirim Laporan</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border/80 text-center text-xs text-muted-foreground shrink-0 font-sans">
              Global Maps Studio &copy; {new Date().getFullYear()}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Konfirmasi Keluar Akun"
        description="Apakah Anda yakin ingin keluar dari sesi akun Global Maps Studio ini?"
        confirmText="Ya, Keluar"
        cancelText="Batalkan"
        variant="destructive"
        icon={LogOut}
      />
    </>
  );
}
