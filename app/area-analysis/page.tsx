"use client";

import * as React from "react";
import { Shapes, Eye, BarChart3, Map, Plus, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { ConfirmModal } from "@/components/confirm-modal";
import { useGeoStorage } from "@/hooks/use-geo-storage";

export default function AreaAnalysisPage() {
  const { areaPolygons, areaSurveyPoints, addAreaPolygon, deleteAreaPolygon, isLoaded } = useGeoStorage();

  const [selectedDistrict, setSelectedDistrict] = React.useState<string>("Semua Kecamatan");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<{ id: string; name: string } | null>(null);

  const [newPolyName, setNewPolyName] = React.useState("");
  const [newPolyArea, setNewPolyArea] = React.useState("5.00 km²");
  const [newPolyDensity, setNewPolyDensity] = React.useState("Sedang");
  const [newPolyColor, setNewPolyColor] = React.useState("#678a40");
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null);

  const handleAddPolygon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolyName.trim()) return;

    addAreaPolygon({
      name: newPolyName,
      area: newPolyArea,
      density: newPolyDensity,
      color: newPolyColor,
      pointsCount: 0,
    });

    setNewPolyName("");
    setNewPolyArea("5.00 km²");
    setShowAddForm(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteAreaPolygon(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // Filter survey points contained in selected district
  const containedPoints = areaSurveyPoints.filter((m) => {
    if (selectedDistrict === "Semua Kecamatan") return true;
    return m.address?.toLowerCase().includes(selectedDistrict.toLowerCase().replace("kecamatan ", "")) ||
           m.name.toLowerCase().includes(selectedDistrict.toLowerCase().replace("kecamatan ", ""));
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Reusable Header */}
      <SiteHeader
        title="Analisis Poligon & Wilayah"
        icon={Shapes}
        badge="Independent Polygon & Survey Data"
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Reusable Hero Header */}
        <PageHero
          badge="Boundary & Spatial Query Analysis"
          badgeIcon={Shapes}
          title="Analisis Wilayah & Batas Administratif"
          description={
            <>
              Olah data poligon batas wilayah, hitung estimasi luas area (<code>ST_Area</code>), dan uji relasi spasial titik observasi lingkungan di dalam poligon (<code>ST_Contains</code>). Data ini mandiri untuk modul Analisis Wilayah.
            </>
          }
        />

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Territory List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <Map className="w-4 h-4 text-primary" />
                    Batas Wilayah Terdaftar ({areaPolygons.length} Wilayah)
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground font-mono">
                    Database Mandiri Analisis Poligon (MultiPolygon SRID:4326)
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-xs not-typeset"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  {showAddForm ? "Tutup Form" : "Tambah Poligon"}
                </Button>
              </CardHeader>

              {/* Add Polygon Inline Form */}
              {showAddForm && (
                <div className="p-4 bg-muted/30 border-b border-border animate-in fade-in duration-200">
                  <form onSubmit={handleAddPolygon} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="text-foreground block mb-1 font-medium">Nama Wilayah *</label>
                      <input
                        type="text"
                        required
                        value={newPolyName}
                        onChange={(e) => setNewPolyName(e.target.value)}
                        placeholder="Kecamatan Baru"
                        className="w-full bg-background border border-border rounded-xl p-2 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1 font-medium">Luas Area</label>
                      <input
                        type="text"
                        value={newPolyArea}
                        onChange={(e) => setNewPolyArea(e.target.value)}
                        placeholder="7.50 km²"
                        className="w-full bg-background border border-border rounded-xl p-2 text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-foreground block mb-1 font-medium">Kepadatan</label>
                      <select
                        value={newPolyDensity}
                        onChange={(e) => setNewPolyDensity(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-2 text-foreground focus:outline-none focus:border-primary"
                      >
                        <option value="Sangat Tinggi">Sangat Tinggi</option>
                        <option value="Tinggi">Tinggi</option>
                        <option value="Sedang">Sedang</option>
                        <option value="Rendah">Rendah</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="text-foreground block mb-1 font-medium">Warna</label>
                        <input
                          type="color"
                          value={newPolyColor}
                          onChange={(e) => setNewPolyColor(e.target.value)}
                          className="w-full h-8 rounded-xl bg-background border border-border cursor-pointer p-0.5"
                        />
                      </div>
                      <Button type="submit" size="sm" className="h-8">
                        Simpan
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {!isLoaded ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="p-4 rounded-2xl border border-border/60 bg-muted/20 space-y-3 animate-pulse">
                        <div className="flex justify-between items-center">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="w-3 h-3 rounded-full" />
                        </div>
                        <div className="space-y-2">
                          <Skeleton className="h-3.5 w-full" />
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3.5 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-full rounded-xl" />
                      </div>
                    ))}
                  </>
                ) : areaPolygons.length === 0 ? (
                  <div className="col-span-2 text-center text-xs text-muted-foreground p-8">
                    Belum ada batas wilayah. Tambahkan poligon baru di atas.
                  </div>
                ) : (
                  areaPolygons.map((dist) => {
                    const isSelected = highlightedId === dist.id;
                    // Compute points that match district name
                    const matchedCount = areaSurveyPoints.filter((m) =>
                      m.address?.toLowerCase().includes(dist.name.toLowerCase().replace("kecamatan ", "")) ||
                      m.name.toLowerCase().includes(dist.name.toLowerCase().replace("kecamatan ", ""))
                    ).length;

                    return (
                      <div
                        key={dist.id}
                        className={`p-4 rounded-2xl border transition-all group shadow-xs ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : "border-border bg-card hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                            {dist.name}
                          </h4>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: dist.color || "#678a40" }}
                            />
                            <button
                              onClick={() => setDeleteTarget({ id: dist.id, name: dist.name })}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                              title="Hapus Poligon"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Luas Wilayah (ST_Area):</span>
                            <span className="font-mono text-foreground">{dist.area}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Titik Observasi Terdeteksi:</span>
                            <span className="font-mono text-primary font-semibold">
                              {matchedCount} Titik
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Kepadatan Spasial:</span>
                            <Badge variant="outline" className="text-[10px]">
                              {dist.density}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => setHighlightedId(isSelected ? null : dist.id)}
                          className="w-full mt-3 text-xs not-typeset"
                        >
                          <Eye className="w-3 h-3 mr-1.5" />
                          {isSelected ? "Poligon Disorot" : "Sorot Poligon di Analisis"}
                        </Button>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Spatial Containment Query Inspector with Typeset */}
          <div className="space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Uji Relasi Spasial (ST_Contains)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Filter titik observasi wilayah berdasarkan batas poligon
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div>
                  <label className="text-foreground block mb-1 font-medium">Pilih Wilayah Target</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="Semua Kecamatan">Semua Kecamatan ({areaSurveyPoints.length} Titik Observasi)</option>
                    {areaPolygons.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-2">
                  <div className="text-[11px] font-medium text-foreground flex items-center justify-between">
                    <span>Hasil Uji Spasial ST_Contains:</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {containedPoints.length} Titik Cocok
                    </Badge>
                  </div>

                  <div className="max-h-32 overflow-y-auto space-y-1 pt-1">
                    {containedPoints.map((m) => (
                      <div key={m.id} className="p-1.5 rounded-lg bg-card border border-border text-[11px] flex items-center justify-between">
                        <span className="truncate max-w-37.5 font-medium">{m.name}</span>
                        <span className="font-mono text-muted-foreground text-[10px]">
                          {Number(m.lat).toFixed(3)}, {Number(m.lng).toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="typeset typeset-notes max-w-none pt-2">
                  <p className="text-xs text-muted-foreground m-0">
                    Kueri PostGIS yang disimulasikan:
                  </p>
                  <pre>
{`SELECT s.* FROM observasi_wilayah s
JOIN kecamatan k 
  ON ST_Contains(k.geom, s.geom)
WHERE k.nama = '${selectedDistrict}';`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Modern Pop-up Confirm Modal for Polygon Deletion */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Poligon Wilayah?"
        description={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}" dari daftar wilayah?`}
        confirmText="Ya, Hapus Wilayah"
        cancelText="Batal"
        variant="destructive"
        icon={Trash2}
      />

      {/* Reusable Footer */}
      <SiteFooter />
    </div>
  );
}
