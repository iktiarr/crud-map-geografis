"use client";

import * as React from "react";
import { 
  MapPin, 
  Search, 
  Edit3, 
  Trash2, 
  Database, 
  School, 
  Check, 
  X, 
  Map as MapIcon
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { ConfirmModal } from "@/components/confirm-modal";
import { useGeoStorage } from "@/hooks/use-geo-storage";
import { GeoMarker } from "@/lib/storage";

export default function SpatialCrudPage() {
  const { crudFacilities, addCrudFacility, updateCrudFacility, deleteCrudFacility, isLoaded } = useGeoStorage();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("Semua");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  // Form State
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("Sekolah (SMA)");
  const [lat, setLat] = React.useState("-6.2088");
  const [lng, setLng] = React.useState("106.8456");
  const [address, setAddress] = React.useState("");
  const [color, setColor] = React.useState("#678a40");
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleStartEdit = (marker: GeoMarker) => {
    setEditingId(marker.id);
    setName(marker.name);
    setCategory(marker.category);
    setLat(marker.lat.toString());
    setLng(marker.lng.toString());
    setAddress(marker.address);
    setColor(marker.color || "#678a40");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setCategory("Sekolah (SMA)");
    setLat("-6.2088");
    setLng("106.8456");
    setAddress("");
    setColor("#678a40");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const latNum = parseFloat(lat) || -6.2088;
    const lngNum = parseFloat(lng) || 106.8456;

    if (editingId) {
      updateCrudFacility(editingId, {
        name,
        category,
        lat: latNum,
        lng: lngNum,
        address,
        color,
      });
      showToast(`Fasilitas "${name}" berhasil diperbarui di database Spatial CRUD!`);
      handleCancelEdit();
    } else {
      addCrudFacility({
        name,
        category,
        lat: latNum,
        lng: lngNum,
        address,
        color,
      });
      showToast(`Fasilitas "${name}" berhasil disimpan ke database Spatial CRUD!`);
      handleCancelEdit();
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteCrudFacility(deleteTarget.id);
      showToast(`Fasilitas "${deleteTarget.name}" berhasil dihapus.`);
      setDeleteTarget(null);
    }
  };

  // Filter Markers
  const filteredFacilities = crudFacilities.filter((item) => {
    const matchQuery =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory =
      selectedCategory === "Semua" || item.category === selectedCategory;
    return matchQuery && matchCategory;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Reusable Header */}
      <SiteHeader
        title="CRUD Data Spasial"
        icon={MapPin}
        badge="Independent Facility Database"
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Toast Alert */}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-primary/10 border border-primary/30 text-primary text-sm flex items-center justify-between shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-primary hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <PageHero
            badge="Dedicated Facility & School CRUD"
            badgeIcon={Database}
            title="CRUD Data Geografis & Fasilitas"
            description={
              <>
                Kelola data titik koordinat fasilitas sekolah, layanan kesehatan, dan instansi publik. Database ini khusus dan mandiri untuk modul Spatial CRUD.
              </>
            }
            className="mb-0"
          />
        </div>

        {/* Data Table & Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Table List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <School className="w-4 h-4 text-primary" />
                    Daftar Fasilitas ({filteredFacilities.length} dari {crudFacilities.length} Titik)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground font-mono">
                    Database Mandiri Spatial CRUD (WGS84 EPSG:4326)
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Category Filter */}
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-background border border-border rounded-xl px-2 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Semua">Semua Kategori</option>
                    <option value="Sekolah (SMA)">Sekolah (SMA)</option>
                    <option value="Sekolah (SMP)">Sekolah (SMP)</option>
                    <option value="Sekolah (SD)">Sekolah (SD)</option>
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Pemerintahan">Pemerintahan</option>
                    <option value="Tempat Ibadah">Tempat Ibadah</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-52">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama/alamat..."
                      className="w-full bg-background border border-border rounded-xl py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {!isLoaded ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-muted/20 animate-pulse">
                        <div className="flex items-center gap-2.5">
                          <Skeleton className="w-8 h-8 rounded-full" />
                          <div className="space-y-1.5">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-56" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-5 w-20 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-7 w-14 rounded-lg" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredFacilities.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground space-y-2">
                    <MapIcon className="w-8 h-8 mx-auto text-muted-foreground/60" />
                    <div className="text-sm font-medium text-foreground">
                      Tidak ada fasilitas ditemukan
                    </div>
                    <div className="text-xs">
                      Tambahkan fasilitas baru melalui formulir di samping.
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                        <tr>
                          <th className="p-3 font-medium">Nama Fasilitas</th>
                          <th className="p-3 font-medium">Kategori</th>
                          <th className="p-3 font-medium">Koordinat (Lat, Lng)</th>
                          <th className="p-3 font-medium text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {filteredFacilities.map((item) => (
                          <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: item.color || "#678a40" }}
                                />
                                <div>
                                  <div className="font-semibold text-foreground">{item.name}</div>
                                  <div className="text-[11px] text-muted-foreground truncate max-w-50">
                                    {item.address || "-"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-muted-foreground">
                              {Number(item.lat).toFixed(4)}, {Number(item.lng).toFixed(4)}
                            </td>
                            <td className="p-3 text-right space-x-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleStartEdit(item)}
                                className="text-muted-foreground hover:text-foreground"
                                title="Edit data"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteTarget({ id: item.id, name: item.name })}
                                className="text-muted-foreground hover:text-destructive"
                                title="Hapus data"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Form Add / Edit */}
          <div>
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    {editingId ? "Edit Fasilitas" : "Tambah Fasilitas Baru"}
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    {editingId ? "Perbarui informasi fasilitas" : "Simpan langsung ke database Spatial CRUD"}
                  </CardDescription>
                </div>

                {editingId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="text-xs text-muted-foreground hover:text-foreground h-7 px-2"
                  >
                    Batal
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="text-foreground block mb-1 font-medium">Nama Lokasi / Fasilitas *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: SMAN 2 Kota"
                      className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-foreground block mb-1 font-medium">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-2 text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="Sekolah (SMA)">Sekolah (SMA)</option>
                      <option value="Sekolah (SMP)">Sekolah (SMP)</option>
                      <option value="Sekolah (SD)">Sekolah (SD)</option>
                      <option value="Kesehatan">Kesehatan (RS/Puskesmas)</option>
                      <option value="Pemerintahan">Pemerintahan</option>
                      <option value="Tempat Ibadah">Tempat Ibadah</option>
                      <option value="Pariwisata">Pariwisata</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-foreground block mb-1 font-medium">Latitude (Y) *</label>
                      <input
                        type="text"
                        required
                        value={lat}
                        onChange={(e) => setLat(e.target.value)}
                        placeholder="-6.2088"
                        className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1 font-medium">Longitude (X) *</label>
                      <input
                        type="text"
                        required
                        value={lng}
                        onChange={(e) => setLng(e.target.value)}
                        placeholder="106.8456"
                        className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground font-mono text-xs focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-foreground block mb-1 font-medium">Warna Penanda (Marker)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-9 h-8 rounded-xl bg-background border border-border cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-xl p-2 text-foreground font-mono text-xs focus:outline-none focus:border-primary uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-foreground block mb-1 font-medium">Alamat / Keterangan</label>
                    <textarea
                      rows={2}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Alamat jalan atau catatan lokasi..."
                      className="w-full bg-background border border-border rounded-xl p-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <Button type="submit" className="w-full mt-3 shadow-xs">
                    {editingId ? "Simpan Perubahan" : "Simpan ke Database CRUD"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modern Pop-up Confirm Modal for Delete Action */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Fasilitas?"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}" dari database Spatial CRUD?`}
        confirmText="Ya, Hapus Fasilitas"
        cancelText="Batal"
        variant="destructive"
        icon={Trash2}
      />

      {/* Reusable Footer */}
      <SiteFooter />
    </div>
  );
}
