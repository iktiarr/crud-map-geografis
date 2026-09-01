"use client";

import * as React from "react";
import { Route, Navigation2, Calculator, MapPin, Gauge, History, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { useGeoStorage } from "@/hooks/use-geo-storage";

// Haversine formula to calculate geodesic distance in km
function calculateHaversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DistanceRoutingPage() {
  const { routingWaypoints, routeHistory, addRouteHistory, clearRouteHistory, isLoaded } = useGeoStorage();

  const [fromName, setFromName] = React.useState("Stasiun Gambir (Titik Berangkat)");
  const [fromLat, setFromLat] = React.useState("-6.1767");
  const [fromLng, setFromLng] = React.useState("106.8306");

  const [toName, setToName] = React.useState("Gelora Bung Karno (Titik Tujuan)");
  const [toLat, setToLat] = React.useState("-6.2185");
  const [toLng, setToLng] = React.useState("106.8018");

  const [distanceKm, setDistanceKm] = React.useState<number>(5.61);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  const handleSelectFromMarker = (id: string) => {
    const found = routingWaypoints.find((m) => m.id === id);
    if (found) {
      setFromName(found.name);
      setFromLat(found.lat.toString());
      setFromLng(found.lng.toString());
    }
  };

  const handleSelectToMarker = (id: string) => {
    const found = routingWaypoints.find((m) => m.id === id);
    if (found) {
      setToName(found.name);
      setToLat(found.lat.toString());
      setToLng(found.lng.toString());
    }
  };

  const handleCalculate = () => {
    const lat1 = parseFloat(fromLat) || 0;
    const lon1 = parseFloat(fromLng) || 0;
    const lat2 = parseFloat(toLat) || 0;
    const lon2 = parseFloat(toLng) || 0;

    const result = calculateHaversine(lat1, lon1, lat2, lon2);
    setDistanceKm(result);

    // Save to local storage history
    addRouteHistory({
      fromName,
      fromLat: lat1,
      fromLng: lon1,
      toName,
      toLat: lat2,
      toLng: lon2,
      distanceKm: Number(result.toFixed(2)),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Reusable Header */}
      <SiteHeader
        title="Jarak & Rute Spasial"
        icon={Route}
        badge="Independent Routing Waypoints"
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Reusable Hero Header */}
        <PageHero
          badge="Distance Matrix & Buffer Analysis"
          badgeIcon={Route}
          title="Pengukuran Jarak & Perutean"
          description="Hitung jarak geodesik akurat antar titik koordinat, visualisasikan zona buffer jangkauan fasilitas, serta simpan riwayat pengukuran ke dataset khusus rute ini."
        />

        {/* Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Calculator Card */}
          <Card className="lg:col-span-2 border-border bg-card backdrop-blur">
            <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  Kalkulator Jarak Geodesik (Formula Haversine)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground font-mono">
                  Presisi kelengkungan bumi (WGS84 Earth Radius = 6,371 km)
                </CardDescription>
              </div>
              {savedSuccess && (
                <Badge variant="secondary" className="text-primary text-[10px] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Tersimpan di Riwayat
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Point A */}
                <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Titik Asal (Point A)
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Asal
                    </Badge>
                  </div>

                  {/* Pick from saved routing waypoints dropdown */}
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">
                      Pilih dari Waypoint Rute Khusus:
                    </label>
                    <select
                      onChange={(e) => handleSelectFromMarker(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Pilih Waypoint Rute --</option>
                      {routingWaypoints.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Nama Titik</label>
                    <input
                      type="text"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Latitude</label>
                      <input
                        type="text"
                        value={fromLat}
                        onChange={(e) => setFromLat(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Longitude</label>
                      <input
                        type="text"
                        value={fromLng}
                        onChange={(e) => setFromLng(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Point B */}
                <div className="p-4 rounded-2xl border border-border bg-card/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> Titik Tujuan (Point B)
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      Tujuan
                    </Badge>
                  </div>

                  {/* Pick from saved routing waypoints dropdown */}
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">
                      Pilih dari Waypoint Rute Khusus:
                    </label>
                    <select
                      onChange={(e) => handleSelectToMarker(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">-- Pilih Waypoint Rute --</option>
                      {routingWaypoints.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">Nama Titik</label>
                    <input
                      type="text"
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Latitude</label>
                      <input
                        type="text"
                        value={toLat}
                        onChange={(e) => setToLat(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Longitude</label>
                      <input
                        type="text"
                        value={toLng}
                        onChange={(e) => setToLng(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl p-1 text-foreground font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculated Result Box */}
              <div className="p-4 rounded-2xl bg-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Hasil Jarak Garis Lurus (Geodesic Straight Line):</div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-primary mt-0.5">
                    {distanceKm.toFixed(2)} km{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({(distanceKm * 1000).toLocaleString()} meter)
                    </span>
                  </div>
                </div>
                <Button size="sm" onClick={handleCalculate} className="text-xs whitespace-nowrap not-typeset shadow-xs">
                  <Navigation2 className="w-3.5 h-3.5 mr-1.5" />
                  Hitung & Simpan Riwayat
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Buffer & Route History */}
          <div className="space-y-6">
            {/* Range Buffer */}
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-primary" />
                  Radius Buffer Jangkauan
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Visualisasi zona cakupan dari Titik Asal
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2 text-xs text-foreground">
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Radius 1 km (Jalan Kaki)</span>
                  <Badge variant="secondary" className="text-[10px]">
                    ~12 menit
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Radius 3 km (Sepeda Motor)</span>
                  <Badge variant="secondary" className="text-[10px]">
                    ~8 menit
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <span>Radius 5 km (Mobil / Transit)</span>
                  <Badge variant="secondary" className="text-[10px]">
                    ~15 menit
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Route History */}
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Riwayat Pengukuran ({routeHistory.length})
                </CardTitle>
                {routeHistory.length > 0 && (
                  <button
                    onClick={clearRouteHistory}
                    className="text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    Hapus Semua
                  </button>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2 text-xs">
                {!isLoaded ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full rounded-xl" />
                    <Skeleton className="h-12 w-full rounded-xl" />
                  </div>
                ) : routeHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground text-xs py-4">
                    Belum ada riwayat pengukuran
                  </div>
                ) : (
                  routeHistory.slice(0, 4).map((r) => (
                    <div key={r.id} className="p-2 rounded-xl bg-card border border-border text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-medium text-foreground">
                        <span className="truncate max-w-35">{r.fromName} ➔ {r.toName}</span>
                        <span className="font-mono text-primary font-bold">{r.distanceKm} km</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {new Date(r.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Reusable Footer */}
      <SiteFooter />
    </div>
  );
}
