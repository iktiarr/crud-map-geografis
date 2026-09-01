"use client";

import * as React from "react";
import { Flame, Activity, Sliders } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { useGeoStorage } from "@/hooks/use-geo-storage";

export default function HeatmapDensityPage() {
  const { heatmapPoints, isLoaded } = useGeoStorage();

  const [radius, setRadius] = React.useState(25);
  const [opacity, setOpacity] = React.useState(80);

  // Group heatmap points by category
  const categoriesCount = React.useMemo(() => {
    const counts: Record<string, number> = {};
    heatmapPoints.forEach((m) => {
      counts[m.category] = (counts[m.category] || 0) + 1;
    });
    return counts;
  }, [heatmapPoints]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Reusable Header */}
      <SiteHeader
        title="Peta Kepadatan & Heatmap"
        icon={Flame}
        badge="Independent Density Hotspot Store"
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Reusable Hero Header */}
        <PageHero
          badge="Spatial Density & Hotspot Visualization"
          badgeIcon={Flame}
          title="Peta Kepadatan & Heatmap"
          description="Analisis persebaran titik spasial secara dinamis dengan layer heatmap intensitas warna. Data dikalkulasi dari dataset hotspot padat khusus modul ini."
        />

        {/* Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Heatmap Preview Visualizer with Typeset */}
          <Card className="lg:col-span-2 border-border bg-card backdrop-blur">
            <CardHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  Simulasi Canvas Heatmap
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Menghitung intensitas dari {heatmapPoints.length} titik hotspot kepadatan mandiri
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-xs">
                {heatmapPoints.length} Hotspot Points
              </Badge>
            </CardHeader>

            <CardContent className="p-8 min-h-87.5 relative bg-muted/20 flex flex-col items-center justify-center text-center overflow-hidden">
              {/* Decorative Heatmap Glows with dynamic opacity */}
              <div 
                className="absolute top-1/4 left-1/3 w-40 h-40 bg-olive-drab-400/20 rounded-full blur-3xl pointer-events-none transition-opacity"
                style={{ opacity: opacity / 100 }}
              />
              <div 
                className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-olive-drab-600/25 rounded-full blur-3xl pointer-events-none transition-opacity"
                style={{ opacity: opacity / 100 }}
              />

              <div className="typeset typeset-notes max-w-[32em] relative z-10 text-center">
                <div className="not-typeset w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 text-primary mx-auto flex items-center justify-center mb-4 shadow-sm animate-bounce">
                  <Flame className="w-8 h-8" />
                </div>
                {!isLoaded ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-48 mx-auto" />
                    <Skeleton className="h-4 w-72 mx-auto" />
                    <div className="flex justify-center gap-2 pt-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-semibold text-foreground mb-2">
                      {heatmapPoints.length} Titik Hotspot Kepadatan Tinggi
                    </h3>
                    <p className="text-muted-foreground mb-5 text-sm">
                      Layer heatmap siap memvisualisasikan konsentrasi sebaran lalu lintas, keramaian transit, dan kawasan bisnis dengan radius blur <b>{radius}px</b>.
                    </p>

                    {/* Categories Breakdown */}
                    <div className="not-typeset flex flex-wrap justify-center gap-1.5 pt-2">
                      {Object.entries(categoriesCount).map(([cat, count]) => (
                        <Badge key={cat} variant="outline" className="text-[10px]">
                          {cat}: {count}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls Panel */}
          <div className="space-y-6">
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  Parameter Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4 text-xs">
                <div>
                  <div className="flex justify-between text-foreground mb-1">
                    <span>Radius Titik (Blur Radius):</span>
                    <span className="font-mono text-primary font-bold">{radius} px</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-foreground mb-1">
                    <span>Opasitas Layer Heatmap:</span>
                    <span className="font-mono text-primary font-bold">{opacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={opacity}
                    onChange={(e) => setOpacity(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-border">
                  <span className="text-muted-foreground block mb-2 font-medium">Skema Gradien Warna:</span>
                  <div className="h-4 rounded-md bg-linear-to-r from-olive-drab-200 via-olive-drab-500 to-olive-drab-900 shadow-inner" />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>Rendah (0.0)</span>
                    <span>Tinggi (1.0)</span>
                  </div>
                </div>
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
