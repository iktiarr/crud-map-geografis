"use client";

import * as React from "react";
import { Search, RefreshCw, Plus, Trash2, Calendar, Phone, MapPin, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminUser } from "../types";

interface UserManagementTableProps {
  usersList: AdminUser[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  isLoadingUsers: boolean;
  onRefresh: (query?: string) => void;
  onOpenAddUser: () => void;
  onDeleteUser: (id: number, email: string) => void;
}

export function UserManagementTable({
  usersList,
  searchQuery,
  setSearchQuery,
  isLoadingUsers,
  onRefresh,
  onOpenAddUser,
  onDeleteUser,
}: UserManagementTableProps) {
  // Filter out superadmin & admin roles so only regular users are displayed
  const regularUsers = usersList.filter(
    (u) =>
      u.role === "user" &&
      u.email !== "globalmapsstudio.iktiarramadani@web.com"
  );

  return (
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
              onRefresh(e.target.value);
            }}
            placeholder="Cari nama, username, email, telepon..."
            className="w-full h-9.5 pl-9 pr-3 rounded-xl border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRefresh(searchQuery)}
            disabled={isLoadingUsers}
            className="h-9.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer border-border hover:bg-secondary/80 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Segarkan</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onOpenAddUser}
            className="h-9.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
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
                <th className="py-3.5 px-4 w-12 text-center">No.</th>
                <th className="py-3.5 px-4 min-w-50">Pengguna</th>
                <th className="py-3.5 px-4 min-w-35">Username</th>
                <th className="py-3.5 px-4 min-w-35">Telepon</th>
                <th className="py-3.5 px-4 min-w-40">Alamat</th>
                <th className="py-3.5 px-4 min-w-36">Terdaftar</th>
                <th className="py-3.5 px-4 w-24 text-center">Role</th>
                <th className="py-3.5 px-4 w-28 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoadingUsers && regularUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                      <span>Memuat data pengguna...</span>
                    </div>
                  </td>
                </tr>
              ) : regularUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <User className="w-6 h-6 text-muted-foreground/50" />
                      <span className="font-medium text-foreground">Tidak ada data pengguna</span>
                      <span className="text-[11px]">Belum ada pengguna terdaftar atau sesuai pencarian.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                regularUsers.map((u, idx) => {
                  // Format Indonesian Date
                  let formattedDate = "-";
                  if (u.createdAt) {
                    try {
                      const d = new Date(u.createdAt);
                      formattedDate = new Intl.DateTimeFormat("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(d);
                    } catch {
                      formattedDate = u.createdAt;
                    }
                  }

                  // Initial avatar
                  const initial = u.name ? u.name.charAt(0).toUpperCase() : "U";

                  return (
                    <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                      {/* No. */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground text-center">
                        {idx + 1}
                      </td>

                      {/* Pengguna (Avatar, Name, Email) */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20 shadow-2xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-foreground truncate max-w-xs">{u.name}</div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-xs">
                              <Mail className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                              <span>{u.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-md bg-secondary/80 border border-border/60 text-[11px]">
                          @{u.username}
                        </span>
                      </td>

                      {/* Telepon */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {u.phone ? (
                          <div className="flex items-center gap-1 text-foreground font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                            <span>{u.phone}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </td>

                      {/* Alamat */}
                      <td className="py-3.5 px-4 text-muted-foreground max-w-sm truncate">
                        {u.address ? (
                          <div className="flex items-center gap-1 text-[11px] truncate">
                            <MapPin className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{u.address}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60">-</span>
                        )}
                      </td>

                      {/* Tanggal Terdaftar */}
                      <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                          <span>{formattedDate}</span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4 text-center">
                        <Badge className="text-[10px] font-semibold bg-secondary text-muted-foreground border-border">
                          User
                        </Badge>
                      </td>

                      {/* Aksi Hapus */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteUser(u.id, u.email)}
                            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-lg transition-colors flex items-center gap-1.5"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline font-medium">Hapus</span>
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
  );
}
