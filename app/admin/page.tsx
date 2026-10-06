"use client";

import * as React from "react";
import Link from "next/link";
import { 
  Key, 
  Users, 
  ShieldCheck, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Zap,
  Check,
  UserCheck,
  Lock,
  Mail,
  User as UserIcon,
  X,
  Edit2,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "admin" | "user";
  phone: string;
  address: string;
  createdAt: string;
}

interface AiConfigItem {
  id: number;
  name: string;
  maskedKey: string;
  rawKey?: string;
  model: string;
  isActive: boolean;
  createdAt: string;
}

interface AiTestResult {
  success: boolean;
  status: "ready" | "error" | "timeout";
  model: string;
  latencyMs: number;
  message?: string;
  error?: string;
  sampleReply?: string;
}

export default function AdminPortalPage() {
  const [activeTab, setActiveTab] = React.useState<"api_key" | "users">("api_key");
  
  // Auth state
  const [currentUser, setCurrentUser] = React.useState<{ id: number; name: string; email: string; role: string } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);
  const [loginError, setLoginError] = React.useState<string | null>(null);

  // AI Configurations Form & List State
  const [aiConfigs, setAiConfigs] = React.useState<AiConfigItem[]>([]);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formApiKey, setFormApiKey] = React.useState("");
  const [formModel, setFormModel] = React.useState("");
  const [formIsActive, setFormIsActive] = React.useState(true);
  
  const [isSavingAi, setIsSavingAi] = React.useState(false);
  const [isTestingAi, setIsTestingAi] = React.useState(false);
  const [testResult, setTestResult] = React.useState<AiTestResult | null>(null);
  const [toastMsg, setToastMsg] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  // Latency & Ping Tracking State per row
  const [rowPings, setRowPings] = React.useState<
    Record<number, { loading: boolean; latencyMs?: number; success?: boolean; error?: string }>
  >({});
  const [isPingingAll, setIsPingingAll] = React.useState(false);

  // Users Management State
  const [usersList, setUsersList] = React.useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoadingUsers, setIsLoadingUsers] = React.useState(false);
  
  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [newUserName, setNewUserName] = React.useState("");
  const [newUserUsername, setNewUserUsername] = React.useState("");
  const [newUserEmail, setNewUserEmail] = React.useState("");
  const [newUserPassword, setNewUserPassword] = React.useState("");
  const [newUserRole, setNewUserRole] = React.useState<"user" | "admin">("user");
  const [isSubmittingUser, setIsSubmittingUser] = React.useState(false);

  const showToast = React.useCallback((text: string, type: "success" | "error" = "success") => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  }, []);

  // Fetch AI Configurations
  const fetchAiConfigs = React.useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-configs");
      const data = await res.json();
      if (res.ok && data.success) {
        setAiConfigs(data.items || []);
      }
    } catch {
      showToast("Gagal memuat daftar konfigurasi AI", "error");
    }
  }, [showToast]);

  // Fetch Users List
  const fetchUsers = React.useCallback(async (query = "") => {
    setIsLoadingUsers(true);
    try {
      const url = query.trim() ? `/api/admin/users?search=${encodeURIComponent(query.trim())}` : "/api/admin/users";
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsersList(data.users || []);
      }
    } catch {
      showToast("Gagal memuat daftar pengguna", "error");
    } finally {
      setIsLoadingUsers(false);
    }
  }, [showToast]);

  React.useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.authenticated && data.user) {
          if (data.user.role === "admin" || data.user.email === "globalmapsstudio.iktiarramadani@web.com") {
            setCurrentUser(data.user);
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => {
        if (isMounted) setCurrentUser(null);
      })
      .finally(() => {
        if (isMounted) setIsAuthChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;

    if (activeTab === "api_key") {
      fetch("/api/admin/ai-configs")
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data?.success) {
            setAiConfigs(data.items || []);
          }
        })
        .catch(() => {});
    } else if (activeTab === "users") {
      fetch("/api/admin/users")
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data?.success) {
            setUsersList(data.users || []);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser, activeTab]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user?.role === "admin" || data.user?.email === "globalmapsstudio.iktiarramadani@web.com") {
          setCurrentUser(data.user);
          showToast("Berhasil masuk ke Portal Admin");
        } else {
          setLoginError("Akun Anda bukan Admin. Akses ditolak.");
        }
      } else {
        setLoginError(data.error || "Gagal masuk. Periksa email dan password.");
      }
    } catch {
      setLoginError("Terjadi kesalahan jaringan saat mencoba masuk.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      showToast("Anda telah keluar dari Portal Admin");
    } catch {
      setCurrentUser(null);
    }
  };

  // Reset / Clear AI Form for New Entry
  const handleStartNewAiConfig = () => {
    setEditingId(null);
    setFormName("");
    setFormApiKey("");
    setFormModel("");
    setFormIsActive(true);
    setTestResult(null);
  };

  // Edit existing AI Config
  const handleEditAiConfig = (item: AiConfigItem) => {
    setEditingId(item.id);
    setFormName(item.name);
    setFormApiKey(item.rawKey || "");
    setFormModel(item.model);
    setFormIsActive(item.isActive);
    setTestResult(null);
  };

  // Handle Save AI Configuration (Create or Update)
  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanKey = formApiKey.trim();
    const cleanModel = formModel.trim();

    if (!cleanName || !cleanModel) {
      showToast("Nama label dan nama model wajib diisi.", "error");
      return;
    }

    if (!editingId && !cleanKey) {
      showToast("API Key wajib diisi untuk konfigurasi baru.", "error");
      return;
    }

    setIsSavingAi(true);
    try {
      const url = "/api/admin/ai-configs";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        id: editingId || undefined,
        name: cleanName,
        apiKey: cleanKey || undefined,
        model: cleanModel,
        isActive: formIsActive,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(editingId ? "Konfigurasi AI diperbarui!" : "Konfigurasi AI berhasil ditambahkan ke pool acak!");
        handleStartNewAiConfig();
        fetchAiConfigs();
      } else {
        showToast(data.error || "Gagal menyimpan konfigurasi", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menyimpan", "error");
    } finally {
      setIsSavingAi(false);
    }
  };

  // Handle Delete AI Config
  const handleDeleteAiConfig = async (id: number, name: string) => {
    if (confirm(`Hapus konfigurasi AI "${name}"?`)) {
      try {
        const res = await fetch(`/api/admin/ai-configs?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Konfigurasi AI berhasil dihapus");
          if (editingId === id) handleStartNewAiConfig();
          fetchAiConfigs();
        } else {
          showToast(data.error || "Gagal menghapus", "error");
        }
      } catch {
        showToast("Gagal menghapus konfigurasi", "error");
      }
    }
  };

  // Handle Toggle Active Status
  const handleToggleActiveModel = async (id: number, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/ai-configs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(!currentActive ? "Konfigurasi diaktifkan dalam pool acak" : "Konfigurasi dinonaktifkan sementara");
        fetchAiConfigs();
      } else {
        showToast(data.error || "Gagal mengubah status aktif", "error");
      }
    } catch {
      showToast("Gagal mengubah status aktif", "error");
    }
  };

  // Handle Test Connection for Form
  const handleTestAi = async () => {
    const cleanKey = formApiKey.trim();
    const cleanModel = formModel.trim();

    if (!cleanModel) {
      showToast("Ketikkan nama model yang ingin diuji", "error");
      return;
    }

    setIsTestingAi(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/admin/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          apiKey: cleanKey || undefined,
          model: cleanModel
        }),
      });

      const data = await res.json();
      setTestResult(data);
      if (res.ok && data.success) {
        showToast(data.message || `Model "${data.model}" aktif!`);
      } else {
        showToast(data.error || "Pengujian model gagal", "error");
      }
    } catch {
      showToast("Gagal menghubungi server untuk uji AI", "error");
    } finally {
      setIsTestingAi(false);
    }
  };

  // Handle Ping Test for Specific Table Row
  const handleTestRowPing = async (item: AiConfigItem) => {
    setRowPings((prev) => ({
      ...prev,
      [item.id]: { loading: true },
    }));

    try {
      const res = await fetch("/api/admin/test-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: item.rawKey || undefined,
          model: item.model,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRowPings((prev) => ({
          ...prev,
          [item.id]: { loading: false, latencyMs: data.latencyMs, success: true },
        }));
      } else {
        setRowPings((prev) => ({
          ...prev,
          [item.id]: { loading: false, latencyMs: data.latencyMs, success: false, error: data.error || "Gagal" },
        }));
      }
    } catch {
      setRowPings((prev) => ({
        ...prev,
        [item.id]: { loading: false, success: false, error: "Network error" },
      }));
    }
  };

  // Handle Ping Test for All Models Simultaneously
  const handleTestAllPings = async () => {
    if (aiConfigs.length === 0 || isPingingAll) return;
    setIsPingingAll(true);
    showToast("Menguji latensi & performa semua model AI...");

    await Promise.all(
      aiConfigs.map((item) => handleTestRowPing(item))
    );

    setIsPingingAll(false);
    showToast("Pengujian performa selesai!");
  };

  // Handle Create New User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          username: newUserUsername,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Pengguna baru berhasil ditambahkan!");
        setIsAddUserOpen(false);
        setNewUserName("");
        setNewUserUsername("");
        setNewUserEmail("");
        setNewUserPassword("");
        fetchUsers();
      } else {
        showToast(data.error || "Gagal menambahkan pengguna", "error");
      }
    } catch {
      showToast("Terjadi kesalahan saat menambahkan pengguna", "error");
    } finally {
      setIsSubmittingUser(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (id: number, email: string) => {
    if (confirm(`Yakin ingin menghapus pengguna dengan email "${email}"?`)) {
      try {
        const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast("Pengguna berhasil dihapus");
          fetchUsers();
        } else {
          showToast(data.error || "Gagal menghapus pengguna", "error");
        }
      } catch {
        showToast("Gagal menghapus pengguna", "error");
      }
    }
  };

  // Handle Toggle User Role
  const handleToggleRole = async (user: AdminUser) => {
    const nextRole = user.role === "admin" ? "user" : "admin";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, role: nextRole }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Role ${user.username} diubah menjadi ${nextRole}`);
        fetchUsers();
      } else {
        showToast(data.error || "Gagal mengubah role", "error");
      }
    } catch {
      showToast("Gagal mengubah role", "error");
    }
  };

  // 1. Loading State
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-medium">Memeriksa hak akses admin...</p>
        </div>
      </div>
    );
  }

  // 2. Login Screen if not Admin
  if (!currentUser) {
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

          <form onSubmit={handleAdminLogin} className="space-y-4">
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
              href="/global-maps"
              className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Peta Utama</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Admin Dashboard (Clean Form & List Style)
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      {/* Toast Banner */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 border animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastMsg.type === "success"
              ? "bg-card border-green-500/30 text-green-600 dark:text-green-400"
              : "bg-card border-destructive/30 text-destructive"
          }`}
        >
          {toastMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header */}
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
            href="/global-maps"
            className="h-9 px-3 rounded-xl border border-border/80 bg-secondary/50 hover:bg-secondary text-foreground text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Buka Halaman Peta"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="hidden sm:inline">Peta Utama</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-9 px-3 rounded-xl text-destructive hover:bg-destructive/10 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Keluar</span>
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 p-1 bg-secondary/60 rounded-xl border border-border/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("api_key")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "api_key"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Key className="w-4 h-4 text-primary" />
            <span>Kunci API & Model OpenRouter</span>
            {aiConfigs.length > 0 && (
              <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] rounded-full font-mono font-bold">
                {aiConfigs.filter(c => c.isActive).length}/{aiConfigs.length} Aktif
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "users"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4 text-primary" />
            <span>Manajemen Pengguna</span>
            {usersList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] rounded-full font-mono">
                {usersList.length}
              </span>
            )}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: FORM & DAFTAR KUNCI & MODEL OPENROUTER (CRUD SIMPEL & BERSIH)      */}
        {/* ========================================================================= */}
        {activeTab === "api_key" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Form Card */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-primary" />
                  <h2 className="text-sm sm:text-base font-bold text-foreground">
                    {editingId ? "Edit Konfigurasi AI" : "Form Input Kunci & Model AI"}
                  </h2>
                </div>

                {editingId !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleStartNewAiConfig}
                    className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Batal Edit / Tambah Baru
                  </Button>
                )}
              </div>

              <form onSubmit={handleSaveAiConfig} className="space-y-4">
                {/* 1. Nama Label */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Nama / Label Konfigurasi
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder=""
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-secondary/30 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
                  />
                </div>

                {/* 2. API Key */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    OpenRouter API Key
                  </label>
                  <input
                    type="password"
                    required={!editingId}
                    value={formApiKey}
                    onChange={(e) => setFormApiKey(e.target.value)}
                    placeholder=""
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-secondary/30 text-xs sm:text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
                  />
                </div>

                {/* 3. Model Name */}
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1 block">
                    Nama Model OpenRouter
                  </label>
                  <input
                    type="text"
                    required
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder=""
                    className="w-full h-10 px-3.5 rounded-xl border border-border bg-secondary/30 text-xs sm:text-sm font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:bg-card transition-all"
                  />
                </div>

                {/* Form Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-border">
                  <Button
                    type="button"
                    onClick={handleTestAi}
                    disabled={isTestingAi || !formModel.trim()}
                    variant="outline"
                    className="h-10 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    {isTestingAi ? (
                      <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    )}
                    <span>Uji Koneksi Model</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSavingAi}
                    className="h-10 px-5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-2"
                  >
                    {isSavingAi ? (
                      <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>{editingId ? "Perbarui Konfigurasi" : "Simpan Konfigurasi"}</span>
                  </Button>
                </div>
              </form>

              {/* Live Test Feedback Box */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border animate-in fade-in duration-150 space-y-1.5 ${
                    testResult.success
                      ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
                      : "bg-destructive/10 border-destructive/30 text-destructive"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                      )}
                      <span>{testResult.success ? "Model Aktif & Siap!" : "Uji Koneksi Gagal"}</span>
                    </div>
                    {testResult.latencyMs && (
                      <Badge className="text-[10px] font-mono bg-card text-foreground border-border">
                        {testResult.latencyMs}ms
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs">{testResult.message || testResult.error}</p>
                </div>
              )}
            </div>

            {/* List Table Card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Daftar Kunci & Model AI Tersimpan</h3>
                  <p className="text-xs text-muted-foreground">Semua model aktif di bawah akan diacak (randomized load balancing) pada setiap panggilan AI untuk mencegah limit.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestAllPings}
                    disabled={isPingingAll || aiConfigs.length === 0}
                    className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:border-amber-500/40"
                    title="Uji ping dan latensi seluruh model AI tersimpan"
                  >
                    <Activity className={`w-3.5 h-3.5 text-amber-500 ${isPingingAll ? "animate-spin" : ""}`} />
                    <span>{isPingingAll ? "Menguji..." : "Uji Semua Ping"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartNewAiConfig}
                    className="h-8 px-3 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Baru</span>
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
                      <th className="py-3 px-4 w-24 text-center">Status</th>
                      <th className="py-3 px-4">Nama Label</th>
                      <th className="py-3 px-4">Model OpenRouter</th>
                      <th className="py-3 px-4 w-36 text-center">Latensi / Ping</th>
                      <th className="py-3 px-4 hidden sm:table-cell">API Key</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {aiConfigs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                          Belum ada konfigurasi AI tersimpan. Silakan isi form di atas.
                        </td>
                      </tr>
                    ) : (
                      aiConfigs.map((item) => {
                        const pingState = rowPings[item.id];
                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors ${
                              item.isActive ? "bg-primary/5 hover:bg-primary/10" : "opacity-60 hover:opacity-100 hover:bg-secondary/30"
                            }`}
                          >
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleActiveModel(item.id, item.isActive)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold font-mono inline-flex items-center gap-1 cursor-pointer transition-all border ${
                                  item.isActive
                                    ? "bg-green-500/15 border-green-500/30 text-green-600 dark:text-green-400"
                                    : "bg-secondary border-border text-muted-foreground"
                                }`}
                                title="Klik untuk ubah status aktif/nonaktif di pool"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground"}`} />
                                <span>{item.isActive ? "Aktif" : "Mati"}</span>
                              </button>
                            </td>
                            <td className="py-3 px-4 font-semibold text-foreground">
                              <span>{item.name}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-primary font-medium">
                              {item.model}
                            </td>
                            {/* Latency / Ping Column */}
                            <td className="py-3 px-4 text-center">
                              {pingState?.loading ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px] font-mono text-muted-foreground">
                                  <div className="w-2.5 h-2.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                  <span>Ping...</span>
                                </span>
                              ) : pingState?.latencyMs !== undefined ? (
                                <button
                                  type="button"
                                  onClick={() => handleTestRowPing(item)}
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold cursor-pointer transition-all hover:scale-105 shadow-2xs ${
                                    pingState.success && pingState.latencyMs < 1000
                                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                      : pingState.success && pingState.latencyMs <= 2500
                                      ? "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400"
                                      : "bg-destructive/15 border-destructive/30 text-destructive"
                                  }`}
                                  title={`Klik untuk uji ulang. Latensi: ${pingState.latencyMs}ms (${pingState.latencyMs < 1000 ? "Sangat Cepat" : pingState.latencyMs <= 2500 ? "Sedang" : "Tinggi/Lambat"})`}
                                >
                                  <Zap className="w-2.5 h-2.5 shrink-0" />
                                  <span>{pingState.latencyMs}ms</span>
                                </button>
                              ) : (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleTestRowPing(item)}
                                  className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Uji ping model ini"
                                >
                                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500 mr-1" />
                                  <span>Cek Ping</span>
                                </Button>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-muted-foreground hidden sm:table-cell">
                              {item.maskedKey}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAiConfig(item)}
                                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Edit Konfigurasi"
                                >
                                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                                  <span>Edit</span>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAiConfig(item.id, item.name)}
                                  className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                                  title="Hapus Konfigurasi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: MANAJEMEN PENGGUNA                                                 */}
        {/* ========================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Users Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    fetchUsers(e.target.value);
                  }}
                  placeholder="Cari nama, username, email..."
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchUsers(searchQuery)}
                  disabled={isLoadingUsers}
                  className="h-9 px-3 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Segarkan</span>
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => setIsAddUserOpen(true)}
                  className="h-9 px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengguna</span>
                </Button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-secondary/60 border-b border-border text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4 hidden md:table-cell">Telepon</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {isLoadingUsers && usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          Memuat data pengguna...
                        </td>
                      </tr>
                    ) : usersList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          Tidak ada data pengguna yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((u) => {
                        const isSuperAdmin = u.email === "globalmapsstudio.iktiarramadani@web.com";
                        return (
                          <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-foreground">{u.name}</div>
                              <div className="text-[11px] text-muted-foreground">{u.email}</div>
                            </td>
                            <td className="py-3 px-4 font-mono text-muted-foreground">
                              @{u.username}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                className={`text-[10px] font-semibold ${
                                  u.role === "admin"
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-secondary text-muted-foreground border-border"
                                }`}
                              >
                                {u.role === "admin" ? "Admin" : "User"}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground hidden md:table-cell">
                              {u.phone}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {!isSuperAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleToggleRole(u)}
                                    className="h-7 px-2 text-[11px] hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
                                    title="Ubah Role (Admin / User)"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Ubah Role</span>
                                  </Button>
                                )}

                                {!isSuperAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                    className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                                    title="Hapus Pengguna"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                )}

                                {isSuperAdmin && (
                                  <span className="text-[10px] text-muted-foreground font-mono italic pr-2">
                                    Super Admin
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-primary" />
                <span>Tambah Pengguna Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full h-9 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Username</label>
                <input
                  type="text"
                  required
                  value={newUserUsername}
                  onChange={(e) => setNewUserUsername(e.target.value)}
                  placeholder="budisantoso"
                  className="w-full h-9 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Email</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="budi@example.com"
                  className="w-full h-9 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Password</label>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full h-9 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block">Peran (Role)</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as "user" | "admin")}
                  className="w-full h-9 px-3 rounded-xl border border-border bg-secondary/30 text-xs text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="user">User Biasa</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddUserOpen(false)}
                  className="h-9 px-3 text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingUser}
                  size="sm"
                  className="h-9 px-4 bg-primary text-primary-foreground text-xs font-semibold cursor-pointer"
                >
                  {isSubmittingUser ? "Menyimpan..." : "Simpan Pengguna"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
