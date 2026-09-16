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
  Loader2
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

type SettingsView = "main" | "profile" | "theme";

export function SettingsSheet() {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();

  const [isOpen, setIsOpen] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<SettingsView>("main");
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);

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

  const resetForm = React.useCallback(() => {
    setFormName(user?.name || "");
    setFormUsername(user?.username || "");
    setFormEmail(user?.email || "");
    setFormPhone(user?.phone || "");
    setFormAddress(user?.address || "");
    setFormPassword("");
    setProfileError(null);
    setProfileSuccess(null);
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

    setIsSavingProfile(true);

    const result = await updateProfile({
      name: formName.trim(),
      username: formUsername.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim() || undefined,
      address: formAddress.trim() || undefined,
      newPassword: formPassword.trim() ? formPassword.trim() : undefined,
    });

    setIsSavingProfile(false);

    if (result.success) {
      setProfileSuccess("Profil Anda berhasil diperbarui!");
      setFormPassword("");
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSuccess(null);
      }, 1500);
    } else {
      setProfileError(result.error || "Gagal memperbarui profil.");
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
          } else {
            setTimeout(() => {
              setCurrentView("main");
              setIsEditingProfile(false);
              setProfileError(null);
              setProfileSuccess(null);
            }, 200);
          }
        }}
      >
        <SheetTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer group focus-visible:outline-none"
              aria-label="Buka Pengaturan"
            >
              {isAuthenticated && user && (
                <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-secondary/80 group-hover:bg-secondary border border-border text-sm font-medium text-foreground transition-all shadow-xs">
                  <div className="w-6 h-6 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shrink-0">
                    {userInitial}
                  </div>
                  <span className="truncate max-w-36">{user.username}</span>
                </div>
              )}
              <div
                className="h-10 w-10 rounded-xl border border-border bg-card/80 group-hover:bg-accent text-foreground shadow-xs transition-transform group-hover:scale-105 flex items-center justify-center shrink-0"
                title="Buka Pengaturan"
              >
                <Settings className="w-5 h-5 text-foreground" />
              </div>
            </button>
          }
        />

        <SheetContent side="right" className="p-0 flex flex-col justify-between overflow-hidden sm:max-w-md">
          <div className="flex flex-col h-full overflow-hidden">
            <SheetHeader className="p-4 sm:p-5 border-b border-border/80 shrink-0">
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
                    className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground shrink-0 -ml-1"
                    title="Kembali"
                  >
                    <ArrowLeft className="w-4.5 h-4.5" />
                  </Button>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <Settings className="w-4.5 h-4.5" />
                  </div>
                )}
                <div>
                  <SheetTitle className="text-base sm:text-lg font-bold text-foreground">
                    {currentView === "main" && "Pengaturan & Menu"}
                    {currentView === "profile" && (isEditingProfile ? "Edit Profil Pengguna" : "Informasi Profil")}
                    {currentView === "theme" && "Pengaturan Tampilan"}
                  </SheetTitle>
                  <SheetDescription className="text-xs sm:text-sm text-muted-foreground">
                    {currentView === "main" && "Pilih opsi di bawah untuk membuka pengaturan"}
                    {currentView === "profile" && (isEditingProfile ? "Perbarui data informasi akun Anda" : "Data identitas pengguna terdaftar")}
                    {currentView === "theme" && "Sesuaikan tema terang atau gelap"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col">
              {currentView === "main" && (
                <div className="space-y-5 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground px-1 mb-1.5 font-mono">
                      Menu Pengaturan
                    </div>

                    <button
                      type="button"
                      onClick={() => { resetForm(); setCurrentView("profile"); }}
                      className="w-full p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/50 hover:border-primary/40 flex items-center justify-between transition-all text-left group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            Profil Pengguna
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            Nama, email, kontak, dan alamat
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCurrentView("theme")}
                      className="w-full p-3.5 rounded-xl border border-border/80 bg-card hover:bg-muted/50 hover:border-primary/40 flex items-center justify-between transition-all text-left group"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                          <Palette className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm sm:text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            Tema & Tampilan
                          </div>
                          <div className="text-xs sm:text-sm text-muted-foreground">
                            {getThemeLabel()}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </button>


                  </div>

                  {isAuthenticated && (
                    <div className="pt-4 mt-auto">
                      <Button
                        variant="outline"
                        onClick={() => setIsLogoutConfirmOpen(true)}
                        className="w-full text-sm font-semibold text-destructive hover:bg-destructive/10 hover:border-destructive/30 rounded-xl h-11 shadow-xs"
                      >
                        <LogOut className="w-4.5 h-4.5 mr-2" />
                        Keluar dari Akun
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {currentView === "profile" && (
                <div className="space-y-4 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  {isAuthenticated && user ? (
                    <>
                      {isEditingProfile ? (
                        <form onSubmit={handleSaveProfile} className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3.5 text-sm">
                            {profileError && (
                              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-start gap-2.5">
                                <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                                <span>{profileError}</span>
                              </div>
                            )}

                            {profileSuccess && (
                              <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm flex items-center gap-2.5">
                                <Check className="w-4.5 h-4.5 shrink-0" />
                                <span>{profileSuccess}</span>
                              </div>
                            )}

                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-sm">Nama Lengkap</label>
                              <input
                                type="text"
                                value={formName}
                                onChange={(e) => setFormName(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition-colors"
                                placeholder="Masukkan nama lengkap"
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-sm">Username (@)</label>
                              <input
                                type="text"
                                value={formUsername}
                                onChange={(e) => setFormUsername(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition-colors font-mono"
                                placeholder="Username unik (tanpa spasi)"
                                required
                              />
                              <p className="text-xs text-muted-foreground">Username harus unik dan tidak boleh sama dengan pengguna lain.</p>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-sm">Alamat Email</label>
                              <input
                                type="email"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition-colors"
                                placeholder="nama@email.com"
                                required
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-sm">Nomor HP / WhatsApp</label>
                              <input
                                type="tel"
                                value={formPhone}
                                onChange={(e) => setFormPhone(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition-colors"
                                placeholder="08xxxxxxxxxx"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-sm">Alamat Domisili</label>
                              <textarea
                                value={formAddress}
                                onChange={(e) => setFormAddress(e.target.value)}
                                rows={2}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition-colors resize-none"
                                placeholder="Alamat lengkap kota/kabupaten"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-foreground font-semibold text-sm flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-primary" />
                                <span>Ganti Password (Opsional)</span>
                              </label>
                              <input
                                type="password"
                                value={formPassword}
                                onChange={(e) => setFormPassword(e.target.value)}
                                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-card border border-border focus:border-primary focus:outline-none transition-colors"
                                placeholder="Kosongkan jika tidak ingin ganti password"
                              />
                            </div>
                          </div>

                          <div className="pt-4 space-y-2.5 mt-auto">
                            <Button
                              type="submit"
                              disabled={isSavingProfile}
                              className="w-full text-sm font-semibold h-11 rounded-xl shadow-xs"
                            >
                              {isSavingProfile ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Menyimpan Perubahan...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Simpan Perubahan
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isSavingProfile}
                              onClick={() => {
                                setIsEditingProfile(false);
                                setProfileError(null);
                              }}
                              className="w-full text-sm font-medium h-10 rounded-xl"
                            >
                              Batalkan
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-4 flex-1 flex flex-col justify-between">
                          <div className="space-y-3.5">
                            <div className="p-4 rounded-xl bg-secondary/70 border border-border flex items-center justify-between gap-3.5">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-14 h-14 rounded-xl bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center shadow-xs shrink-0">
                                  {userInitial}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-base sm:text-lg text-foreground truncate">
                                    {user.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground font-mono truncate">
                                    @{user.username}
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary" className="text-xs font-mono px-2.5 py-1 rounded-xl shrink-0">
                                Online
                              </Badge>
                            </div>

                            <Button
                              variant="outline"
                              onClick={() => setIsEditingProfile(true)}
                              className="w-full text-sm font-semibold h-10 rounded-xl border-primary/30 hover:bg-primary/10 text-primary flex items-center justify-center gap-2 shadow-xs"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit Profil Akun
                            </Button>

                            <div className="space-y-2.5">
                              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs sm:text-sm">
                                  <Mail className="w-4 h-4 text-primary" />
                                  <span>Alamat Email</span>
                                </div>
                                <div className="font-medium text-sm sm:text-base text-foreground truncate pl-6">
                                  {user.email}
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs sm:text-sm">
                                  <Phone className="w-4 h-4 text-primary" />
                                  <span>Nomor HP / WhatsApp</span>
                                </div>
                                <div className="font-medium text-sm sm:text-base text-foreground truncate pl-6">
                                  {user.phone || "-"}
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs sm:text-sm">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <span>Alamat Domisili</span>
                                </div>
                                <div className="font-medium text-sm sm:text-base text-foreground pl-6">
                                  {user.address || "-"}
                                </div>
                              </div>

                              <div className="p-3.5 rounded-xl bg-card border border-border space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs sm:text-sm">
                                  <Calendar className="w-4 h-4 text-primary" />
                                  <span>Waktu Pendaftaran</span>
                                </div>
                                <div className="font-medium text-sm sm:text-base text-foreground pl-6">
                                  {formattedDate}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 mt-auto">
                            <Button
                              variant="destructive"
                              onClick={() => setIsLogoutConfirmOpen(true)}
                              className="w-full text-sm font-semibold h-11 rounded-xl shadow-xs"
                            >
                              <LogOut className="w-4.5 h-4.5 mr-2" />
                              Keluar dari Akun
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm space-y-2">
                      <User className="w-9 h-9 mx-auto text-muted-foreground/60" />
                      <div>Anda belum masuk ke akun.</div>
                    </div>
                  )}
                </div>
              )}

              {currentView === "theme" && (
                <div className="space-y-4 animate-in fade-in duration-150 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    <div className="text-sm text-muted-foreground">
                      Pilih tema visual yang nyaman untuk pengalaman penjelajahan Anda:
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => setTheme("light")}
                        className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-sm sm:text-base font-semibold ${
                          theme === "light"
                            ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Sun className="w-5 h-5" />
                          <span>Mode Terang (Light)</span>
                        </div>
                        {theme === "light" && <Check className="w-5 h-5 text-primary" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-sm sm:text-base font-semibold ${
                          theme === "dark"
                            ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Moon className="w-5 h-5" />
                          <span>Mode Gelap (Dark)</span>
                        </div>
                        {theme === "dark" && <Check className="w-5 h-5 text-primary" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setTheme("system")}
                        className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all text-sm sm:text-base font-semibold ${
                          theme === "system"
                            ? "border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/40"
                            : "border-border bg-card text-foreground hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Laptop className="w-5 h-5" />
                          <span>Sistem Otomatis (Mengikuti OS)</span>
                        </div>
                        {theme === "system" && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}


            </div>

            <div className="p-4 border-t border-border/80 text-center text-xs text-muted-foreground shrink-0">
              Global Studio &copy; {new Date().getFullYear()}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Konfirmasi Keluar Akun"
        description="Apakah Anda yakin ingin keluar dari sesi akun Global Studio ini?"
        confirmText="Ya, Keluar"
        cancelText="Batalkan"
        variant="destructive"
        icon={LogOut}
      />
    </>
  );
}
