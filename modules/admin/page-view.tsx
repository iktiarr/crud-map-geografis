"use client";

import * as React from "react";
import { Key, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { AdminHeader } from "./components/admin-header";
import { AdminLoginCard } from "./components/admin-login-card";
import { AiConfigForm } from "./components/ai-config-form";
import { AiConfigTable } from "./components/ai-config-table";
import { UserManagementTable } from "./components/user-management-table";
import { AddUserModal } from "./components/add-user-modal";
import type { AdminUser, AiConfigItem, AiTestResult, RowPingState } from "./types";

export function AdminPageView() {
  const [activeTab, setActiveTab] = React.useState<"api_key" | "users">("api_key");

  // Auth state
  const [currentUser, setCurrentUser] = React.useState<{
    id: number;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [isAuthChecking, setIsAuthChecking] = React.useState(true);

  // Login Form State
  const [loginEmail, setLoginEmail] = React.useState("");
  const [loginPassword, setLoginPassword] = React.useState("");
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
  const [rowPings, setRowPings] = React.useState<Record<number, RowPingState>>({});
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
  const fetchUsers = React.useCallback(
    async (query = "") => {
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
    },
    [showToast]
  );

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
          model: cleanModel,
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

    await Promise.all(aiConfigs.map((item) => handleTestRowPing(item)));

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
          role: "user",
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
      <AdminLoginCard
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        loginError={loginError}
        isLoggingIn={isLoggingIn}
        onSubmit={handleAdminLogin}
      />
    );
  }

  // 3. Authenticated Admin Dashboard
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
      <AdminHeader onLogout={handleLogout} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-6 md:p-8 space-y-6">
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
                {aiConfigs.filter((c) => c.isActive).length}/{aiConfigs.length} Aktif
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
            {usersList.filter((u) => u.role === "user" && u.email !== "globalmapsstudio.iktiarramadani@web.com").length > 0 && (
              <span className="px-1.5 py-0.2 bg-primary/10 text-primary text-[10px] rounded-full font-mono">
                {usersList.filter((u) => u.role === "user" && u.email !== "globalmapsstudio.iktiarramadani@web.com").length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: Kunci & Model AI */}
        {activeTab === "api_key" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <AiConfigForm
              editingId={editingId}
              formName={formName}
              setFormName={setFormName}
              formApiKey={formApiKey}
              setFormApiKey={setFormApiKey}
              formModel={formModel}
              setFormModel={setFormModel}
              formIsActive={formIsActive}
              setFormIsActive={setFormIsActive}
              isSavingAi={isSavingAi}
              isTestingAi={isTestingAi}
              testResult={testResult}
              onSave={handleSaveAiConfig}
              onTest={handleTestAi}
              onCancelEdit={handleStartNewAiConfig}
            />

            <AiConfigTable
              aiConfigs={aiConfigs}
              rowPings={rowPings}
              isPingingAll={isPingingAll}
              onToggleActive={handleToggleActiveModel}
              onTestRowPing={handleTestRowPing}
              onTestAllPings={handleTestAllPings}
              onStartNew={handleStartNewAiConfig}
              onEdit={handleEditAiConfig}
              onDelete={handleDeleteAiConfig}
            />
          </div>
        )}

        {/* TAB 2: Manajemen Pengguna */}
        {activeTab === "users" && (
          <UserManagementTable
            usersList={usersList}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoadingUsers={isLoadingUsers}
            onRefresh={fetchUsers}
            onOpenAddUser={() => setIsAddUserOpen(true)}
            onDeleteUser={handleDeleteUser}
          />
        )}
      </main>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        newUserName={newUserName}
        setNewUserName={setNewUserName}
        newUserUsername={newUserUsername}
        setNewUserUsername={setNewUserUsername}
        newUserEmail={newUserEmail}
        setNewUserEmail={setNewUserEmail}
        newUserPassword={newUserPassword}
        setNewUserPassword={setNewUserPassword}
        isSubmittingUser={isSubmittingUser}
        onSubmit={handleAddUser}
      />
    </div>
  );
}
