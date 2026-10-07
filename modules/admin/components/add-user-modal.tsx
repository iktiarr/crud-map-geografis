"use client";

import * as React from "react";
import { User as UserIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  newUserName: string;
  setNewUserName: (val: string) => void;
  newUserUsername: string;
  setNewUserUsername: (val: string) => void;
  newUserEmail: string;
  setNewUserEmail: (val: string) => void;
  newUserPassword: string;
  setNewUserPassword: (val: string) => void;
  isSubmittingUser: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function AddUserModal({
  isOpen,
  onClose,
  newUserName,
  setNewUserName,
  newUserUsername,
  setNewUserUsername,
  newUserEmail,
  setNewUserEmail,
  newUserPassword,
  setNewUserPassword,
  isSubmittingUser,
  onSubmit,
}: AddUserModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-primary" />
            <span>Tambah Pengguna Baru</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
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

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
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
  );
}
