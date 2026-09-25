"use client";

import * as React from "react";

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export interface RegisterPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface UpdateProfilePayload {
  name: string;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  newPassword?: string;
}

export interface AuthModalOptions {
  tab?: "login" | "register";
  redirectTo?: string;
  moduleTitle?: string;
  message?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalOptions: AuthModalOptions;
  openAuthModal: (options?: AuthModalOptions) => void;
  closeAuthModal: () => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalOptions, setAuthModalOptions] = React.useState<AuthModalOptions>({ tab: "login" });

  const openAuthModal = React.useCallback((options?: AuthModalOptions) => {
    setAuthModalOptions({
      tab: options?.tab || "login",
      redirectTo: options?.redirectTo,
      moduleTitle: options?.moduleTitle,
      message: options?.message,
    });
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = React.useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const checkAuth = React.useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (data?.authenticated && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data?.authenticated && data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setUser(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (identifier: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Gagal masuk. Coba lagi." };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Terjadi gangguan koneksi ke server." };
    }
  };

  const register = async (payload: RegisterPayload) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Pendaftaran gagal. Coba lagi." };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Terjadi gangguan koneksi ke server." };
    }
  };

  const updateProfile = async (payload: UpdateProfilePayload) => {
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Gagal memperbarui profil." };
      }

      setUser(data.user);
      return { success: true };
    } catch {
      return { success: false, error: "Terjadi gangguan koneksi ke server." };
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        isAuthModalOpen,
        authModalOptions,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        updateProfile,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
