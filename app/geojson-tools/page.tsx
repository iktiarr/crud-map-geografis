"use client";

import * as React from "react";
import { FileCode, Upload, Download, Copy, Terminal, Check, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PageHero } from "@/components/page-hero";
import { useGeoStorage } from "@/hooks/use-geo-storage";

export default function GeoJsonToolsPage() {
  const { geojsonFiles, addGeoJsonFile, deleteGeoJsonFile, isLoaded } = useGeoStorage();

  const [selectedFileId, setSelectedFileId] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const activeFile =
    geojsonFiles.find((f) => f.id === selectedFileId) || geojsonFiles[0];
  const activePayload = activeFile?.content || { type: "FeatureCollection", features: [] };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(activePayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const jsonString = JSON.stringify(activePayload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile?.name || "export.geojson";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
        const newRecord = addGeoJsonFile({
          name: file.name,
          size: sizeStr,
          content: parsed,
        });
        setSelectedFileId(newRecord.id);
      } catch (err) {
        alert("Berkas JSON / GeoJSON tidak valid!");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors">
      {/* Reusable Header */}
      <SiteHeader
        title="GeoJSON Tools & Converter"
        icon={FileCode}
        badge="Independent GeoJSON Store"
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        {/* Reusable Hero Header */}
        <PageHero
          badge="Spatial Format Converter & Validator"
          badgeIcon={FileCode}
          title="GeoJSON & Shapefile Converter"
          description="Simpan, konversi, validasi dan unduh berkas GeoJSON langsung dari peramban Anda. Format standar RFC 7946 dengan koordinat WGS84. Berkas tersimpan mandiri khusus modul ini."
        />

        {/* Tools Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* JSON Viewer with Typeset */}
          <Card className="lg:col-span-2 border-border bg-card backdrop-blur">
            <CardHeader className="p-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  Live GeoJSON Payload: {activeFile?.name || "Memuat..."}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Menampilkan berkas aktif dari penyimpanan mandiri GeoJSON Tools
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 not-typeset">
                <Button variant="outline" size="sm" onClick={handleCopy} className="h-7 text-xs">
                  {copied ? <Check className="w-3 h-3 mr-1 text-primary" /> : <Copy className="w-3 h-3 mr-1" />}
                  {copied ? "Tersalin!" : "Salin"}
                </Button>
                <Button size="sm" onClick={handleDownload} className="h-7 text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Unduh .geojson
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {!isLoaded ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
              ) : (
                <div className="typeset typeset-notes max-w-none">
                  <pre className="max-h-95 overflow-x-auto text-xs">
                    <code>{JSON.stringify(activePayload, null, 2)}</code>
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload & Saved Files */}
          <div className="space-y-6">
            {/* Upload Box */}
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 border-b border-border/80">
                <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Impor Berkas ke GeoJSON Store
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Mendukung berkas .geojson / .json spasial
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 text-center">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".geojson,.json"
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl p-6 transition-colors cursor-pointer bg-muted/20 group"
                >
                  <Upload className="w-7 h-7 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-medium text-foreground mb-0.5">
                    Klik untuk pilih berkas .geojson
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Disimpan ke LocalStorage browser
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Saved Layers List */}
            <Card className="border-border bg-card backdrop-blur">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">
                  Daftar Berkas GeoJSON Tersimpan ({geojsonFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-2 text-xs">
                {!isLoaded ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </div>
                ) : (
                  geojsonFiles.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                        (selectedFileId || geojsonFiles[0]?.id) === file.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      <div className="truncate max-w-37.5">
                        <div className="font-semibold text-foreground truncate">{file.name}</div>
                        <div className="text-[10px] text-muted-foreground">{file.size}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {(selectedFileId || geojsonFiles[0]?.id) === file.id && (
                          <Badge className="text-[10px]">Aktif</Badge>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGeoJsonFile(file.id);
                          }}
                          className="p-1 rounded text-muted-foreground hover:text-destructive"
                          title="Hapus berkas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
