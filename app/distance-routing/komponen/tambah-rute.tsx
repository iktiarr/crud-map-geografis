"use client";

import * as React from "react";
import {
  Palette,
  Route,
  Check,
  Loader2,
  MapPin,
  ArrowLeft,
  ChevronDown,
  Settings,
  CircleDot,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  WaypointItem,
  MultiPointRouteResult,
  LineStyle,
  ConnectionMode,
  MarkerStyle,
} from "../tipe";
import { RouteAssistantContext, AiRouteAction } from "@/lib/ai-route-assistant";
import { DaftarTitik } from "./daftar-titik";
import { ImportPerjalanan } from "./import-perjalanan";
import { ToolbarRiwayat } from "./toolbar-riwayat";
import { AiFloatingAssistant } from "./ai-floating-assistant";

interface TambahRuteProps {
  selectedFolder: string;
  filteredRoutesCount?: number;
  onGoBack: () => void;

  // Form Kustomisasi Garis & Titik
  routeName: string;
  onRouteNameChange: (val: string) => void;
  customColor: string;
  onCustomColorChange: (val: string) => void;
  customWeight: number;
  onCustomWeightChange: (val: number) => void;
  customOpacity: number;
  customLineStyle: LineStyle;
  onCustomLineStyleChange: (val: LineStyle) => void;
  markerStyle: MarkerStyle;
  onMarkerStyleChange: (val: MarkerStyle) => void;

  // Pengaturan Hubungkan Titik
  connectionMode: ConnectionMode;
  onConnectionModeChange: (val: ConnectionMode) => void;

  // Undo & Redo Riwayat
  canUndo?: boolean;
  canRedo?: boolean;
  undoCount?: number;
  redoCount?: number;
  onUndo?: () => void;
  onRedo?: () => void;

  // Waypoints & Simpan
  waypoints: WaypointItem[];
  draftRouteData: MultiPointRouteResult | null;
  selectedAlternativeId?: string | null;
  onSelectAlternativeRoute?: (id: string | null) => void;
  isCalculatingRoute: boolean;
  isSaving: boolean;
  onResetWaypoints: () => void;
  onRemoveWaypoint: (index: number) => void;
  onMoveWaypoint: (index: number, direction: "up" | "down") => void;
  onReverseAllWaypoints?: () => void;
  onConnectAllToNearest?: () => void;
  hideWaypointsOnMap?: boolean;
  onToggleHideWaypoints?: (val: boolean) => void;
  isPositionLocked?: boolean;
  onTogglePositionLocked?: (val: boolean) => void;
  onToggleDisconnectWaypoint?: (index: number) => void;
  onConnectWaypointToNearest?: (index: number, mode?: "road" | "direct") => void;
  onFocusWaypoint?: (lat: number, lng: number) => void;
  onZoomToRoute?: () => void;
  onUpdateWaypointName?: (index: number, newName: string) => void;
  onImportWaypoints?: (newWaypoints: WaypointItem[], mode: "snap_roads" | "keep_original") => void;
}

export function TambahRute({
  onGoBack,
  customColor,
  onCustomColorChange,
  customWeight,
  onCustomWeightChange,
  customLineStyle,
  onCustomLineStyleChange,
  markerStyle = "numbers",
  onMarkerStyleChange,
  connectionMode = "sequential",
  onConnectionModeChange,
  canUndo = false,
  canRedo = false,
  undoCount = 0,
  redoCount = 0,
  onUndo,
  onRedo,
  waypoints,
  draftRouteData,
  isCalculatingRoute,
  onResetWaypoints,
  onRemoveWaypoint,
  onMoveWaypoint,
  onReverseAllWaypoints,
  onConnectAllToNearest,
  onToggleDisconnectWaypoint,
  onConnectWaypointToNearest,
  hideWaypointsOnMap = false,
  onToggleHideWaypoints,
  isPositionLocked = true,
  onTogglePositionLocked,
  onFocusWaypoint,
  onZoomToRoute,
  onUpdateWaypointName,
  onImportWaypoints,
}: TambahRuteProps) {
  // State Dropdown Kustom
  const [isLineStyleMenuOpen, setIsLineStyleMenuOpen] = React.useState(false);
  const [isMarkerStyleMenuOpen, setIsMarkerStyleMenuOpen] = React.useState(false);
  const [isConnectionMenuOpen, setIsConnectionMenuOpen] = React.useState(false);
  const [actionFeedback, setActionFeedback] = React.useState<string | null>(null);

  const lineStyleMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (lineStyleMenuRef.current && !lineStyleMenuRef.current.contains(target)) {
        setIsLineStyleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Opsi Gaya Garis
  const lineStyleOptions: { id: LineStyle; label: string; dashArray?: string }[] = [
    { id: "solid", label: "Garis Lurus (Solid)" },
    { id: "dashed", label: "Putus-putus (Dashed)", dashArray: "8, 8" },
    { id: "dotted", label: "Titik-titik (Dotted)", dashArray: "3, 6" },
  ];

  // Eksekusi Aksi dari Asisten AI
  const handleExecuteAiAction = (action: AiRouteAction) => {
    if (action.type === "set_mode") {
      onConnectionModeChange?.(action.param as ConnectionMode);
      setActionFeedback(`Mode koneksi berhasil diubah ke: ${action.param}`);
    } else if (action.type === "reverse") {
      onReverseAllWaypoints?.();
      setActionFeedback("Urutan seluruh titik rute berhasil dibalikkan (1 ↔ N)");
    } else if (action.type === "set_marker") {
      onMarkerStyleChange?.(action.param as MarkerStyle);
      setActionFeedback(`Gaya marker rute diubah ke: ${action.param}`);
    } else if (action.type === "connect_all_nearest") {
      onConnectAllToNearest?.();
      setActionFeedback("Seluruh titik berhasil disambungkan ke jalur terdekat");
    } else if (action.type === "reset_waypoints") {
      onResetWaypoints?.();
      setActionFeedback("Semua titik rute berhasil direset");
    }
    setTimeout(() => setActionFeedback(null), 4000);
  };

  // Konteks Rute untuk AI Asisten
  const routeContextData: RouteAssistantContext = React.useMemo(() => {
    return {
      waypointsCount: waypoints.length,
      waypointsSample: waypoints.slice(0, 10).map((w, idx) => ({
        name: w.name || `Titik ${idx + 1}`,
        lat: w.lat,
        lng: w.lng,
      })),
      connectionMode,
      totalDistanceKm: draftRouteData?.distanceKm,
      totalDurationMin: draftRouteData?.durationMin,
      streetNames: draftRouteData?.streetNames,
    };
  }, [waypoints, connectionMode, draftRouteData]);

  // Opsi Gaya Ikon Titik: Simple, tanpa deskripsi
  const markerStyleOptions: {
    id: MarkerStyle;
    label: string;
    renderIcon: () => React.ReactNode;
  }[] = [
    {
      id: "numbers",
      label: "Angka",
      renderIcon: () => (
        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground font-bold text-[9px] flex items-center justify-center shrink-0">
          1
        </span>
      ),
    },
    {
      id: "letters",
      label: "Huruf",
      renderIcon: () => (
        <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground font-bold text-[9px] flex items-center justify-center shrink-0">
          A
        </span>
      ),
    },
    {
      id: "none",
      label: "None",
      renderIcon: () => (
        <span className="w-3.5 h-3.5 rounded-full border border-dashed border-primary flex items-center justify-center text-[8px] text-primary font-bold shrink-0">
          ✕
        </span>
      ),
    },
    {
      id: "pin",
      label: "Pin",
      renderIcon: () => <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />,
    },
    {
      id: "dot",
      label: "Dot",
      renderIcon: () => <CircleDot className="w-3.5 h-3.5 text-primary shrink-0" />,
    },
    {
      id: "random",
      label: "Random",
      renderIcon: () => (
        <span className="w-4 h-4 rounded-full bg-linear-to-tr from-indigo-500 via-rose-500 to-amber-500 text-white font-bold text-[9px] flex items-center justify-center shrink-0">
          ★
        </span>
      ),
    },
  ];

  // Opsi Hubungkan Titik Jalan
  const connectionModeOptions: {
    id: ConnectionMode;
    label: string;
    badge: string;
    desc: string;
  }[] = [
    {
      id: "sequential",
      label: "Hubungkan Sesuai Urutan",
      badge: "Sesuai Urutan",
      desc: "Titik dihubungkan 1 → 2 → 3... mengikuti lekukan jalan resmi.",
    },
    {
      id: "nearest",
      label: "Hubungkan Semua Jalan (Jalur Terdekat)",
      badge: "Terdekat / Efisien",
      desc: "Otomatis menyambungkan ke titik atau jalur terdekat (Greedy).",
    },
    {
      id: "smart_direct",
      label: "Jalur Fleksibel (Ikuti Jalan & Gang)",
      badge: "Gang & Jalan",
      desc: "Mengikuti jalan dan gang tanpa terhalang rambu satu arah.",
    },
    {
      id: "loop_closed",
      label: "Hubungkan Melingkar (Loop Tertutup)",
      badge: "Loop Tertutup",
      desc: "Menyambungkan titik terakhir kembali ke titik awal.",
    },
    {
      id: "direct_line",
      label: "Garis Lurus Langsung",
      badge: "Lurus Langsung",
      desc: "Tarik garis lurus antar titik (Geodesic).",
    },
  ];

  const currentMarkerObj =
    markerStyleOptions.find((m) => m.id === markerStyle) || markerStyleOptions[0];
  const currentConnectionObj =
    connectionModeOptions.find((c) => c.id === connectionMode) ||
    connectionModeOptions[0];

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150 relative">
      {/* Navigasi Atas: Tombol Kembali */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <button
          type="button"
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Daftar Rute</span>
        </button>
      </div>

      {/* Accordion Pengaturan */}
      <Accordion
        type="multiple"
        defaultValue={["kustomisasi", "pengaturan", "titik"]}
        className="space-y-2.5"
      >
        {/* ACCORDION 1: KUSTOMISASI GARIS & TITIK */}
        <AccordionItem
          value="kustomisasi"
          className="rounded-xl border border-border bg-card shadow-2xs overflow-visible"
        >
          <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-secondary/40">
            <div className="flex items-center gap-2 flex-1 text-xs font-bold text-foreground">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Kustomisasi Garis & Titik</span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3.5 pb-3.5 pt-1 space-y-3 overflow-visible">
            {/* 1. Gaya Ikon Titik: Simple, tanpa deskripsi */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground">
                  Gaya Ikon Titik:{" "}
                  <span className="text-primary font-bold">{currentMarkerObj.label}</span>
                </label>
              </div>

              {/* Selector Tombol Utama */}
              <button
                type="button"
                onClick={() => setIsMarkerStyleMenuOpen((prev) => !prev)}
                className="w-full h-9 px-3 rounded-xl bg-background border border-border text-foreground text-xs font-medium flex items-center justify-between hover:bg-secondary/60 transition-colors focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  {currentMarkerObj.renderIcon()}
                  <span className="font-semibold">{currentMarkerObj.label}</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-150 ${
                    isMarkerStyleMenuOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {/* Grid Opsi Simple (Ikon + Nama saja, tanpa deskripsi panjang) */}
              {isMarkerStyleMenuOpen && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1.5 rounded-xl border border-border bg-secondary/30 animate-in fade-in duration-100">
                  {markerStyleOptions.map((item) => {
                    const isSelected = item.id === markerStyle;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onMarkerStyleChange(item.id);
                          setIsMarkerStyleMenuOpen(false);
                        }}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary"
                            : "bg-background border-border text-foreground hover:bg-secondary hover:border-primary/40"
                        }`}
                      >
                        {item.renderIcon()}
                        <span className="truncate">{item.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Warna Garis & Gaya Garis (2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Warna Garis:
                </label>
                <label className="flex items-center gap-2 px-2.5 h-8 rounded-lg bg-background border border-border hover:bg-secondary/50 cursor-pointer transition-colors group">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => onCustomColorChange(e.target.value)}
                    className="w-4.5 h-4.5 rounded-full border border-black/20 cursor-pointer p-0 bg-transparent shrink-0 appearance-none [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full"
                    title="Buka palet warna"
                  />
                  <span className="text-xs font-mono font-medium text-foreground uppercase">
                    {customColor}
                  </span>
                  <span className="text-[10px] text-muted-foreground ml-auto group-hover:text-primary transition-colors flex items-center gap-1 font-sans">
                    <span>Palet</span>
                    <Palette className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
                  </span>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Gaya Garis:
                </label>
                <div ref={lineStyleMenuRef} className="relative w-full">
                  <button
                    type="button"
                    onClick={() => setIsLineStyleMenuOpen((prev) => !prev)}
                    className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs font-medium flex items-center justify-between hover:bg-secondary/60 transition-colors focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
                  >
                    <span className="truncate">
                      {lineStyleOptions.find((l) => l.id === customLineStyle)?.label ||
                        "Solid"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1 transition-transform duration-150 ${
                        isLineStyleMenuOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  {isLineStyleMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-lg p-1 bg-popover/95 backdrop-blur-md text-popover-foreground shadow-xl border border-border space-y-0.5">
                      {lineStyleOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onCustomLineStyleChange(opt.id);
                            setIsLineStyleMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                            customLineStyle === opt.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {customLineStyle === opt.id && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Ketebalan Garis */}
            <div className="pt-1 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>Ketebalan Garis:</span>
                <span className="text-primary font-mono">{customWeight}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={customWeight}
                onChange={(e) => onCustomWeightChange(Number(e.target.value))}
                className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ACCORDION 2: PENGATURAN & HUBUNGKAN TITIK */}
        <AccordionItem
          value="pengaturan"
          className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden"
        >
          <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-secondary/40">
            <div className="flex items-center gap-2 flex-1 text-xs font-bold text-foreground">
              <Settings className="w-3.5 h-3.5 text-primary" />
              <span>Pengaturan & Hubungkan Titik</span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3.5 pb-3.5 pt-1 space-y-3">
            {/* Toolbar Undo & Redo (Riwayat Perubahan) */}
            {onUndo && onRedo && (
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Riwayat Perubahan (Undo & Redo):
                </label>
                <ToolbarRiwayat
                  canUndo={canUndo}
                  canRedo={canRedo}
                  undoCount={undoCount}
                  redoCount={redoCount}
                  onUndo={onUndo}
                  onRedo={onRedo}
                />
              </div>
            )}

            {/* Opsi Hubungkan Titik Jalan: Inline Accordion Selector (Tidak Terpotong) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-foreground">
                  Opsi Hubungkan Titik:
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {currentConnectionObj.badge}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsConnectionMenuOpen((prev) => !prev)}
                className="w-full p-2.5 rounded-xl border border-border bg-background text-foreground text-xs flex items-center justify-between hover:bg-secondary/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate pr-2 text-left">
                  <Route className="w-4 h-4 text-primary shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-xs truncate">
                      {currentConnectionObj.label}
                    </div>
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-150 ${
                    isConnectionMenuOpen ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>

              {isConnectionMenuOpen && (
                <div className="space-y-1.5 p-1.5 rounded-xl border border-border bg-secondary/30 animate-in fade-in duration-100">
                  {connectionModeOptions.map((item) => {
                    const isSelected = item.id === connectionMode;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onConnectionModeChange(item.id);
                          setIsConnectionMenuOpen(false);
                        }}
                        className={`p-2.5 rounded-lg border cursor-pointer transition-all text-left ${
                          isSelected
                            ? "bg-primary/10 border-primary ring-1 ring-primary/40 font-medium"
                            : "bg-background border-border hover:bg-secondary/60 hover:border-primary/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold ${
                              isSelected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {item.label}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground font-semibold"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Fitur Import Perjalanan / Rute (Dedicated Component) */}
            <ImportPerjalanan onImportWaypoints={onImportWaypoints} />

            {/* Switch Kunci Posisi Titik */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-secondary/30 hover:border-primary/40 transition-colors">
              <div className="space-y-0.5 min-w-0 pr-2">
                <label
                  htmlFor="lock-waypoints-switch"
                  className="text-xs font-semibold text-foreground cursor-pointer block"
                >
                  Kunci Posisi Titik
                </label>
              </div>
              <Switch
                id="lock-waypoints-switch"
                checked={isPositionLocked}
                onCheckedChange={(checked) => onTogglePositionLocked?.(checked)}
                className="cursor-pointer shrink-0"
              />
            </div>

            {/* Switch Sembunyikan Titik pada Peta */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border bg-secondary/30 hover:border-primary/40 transition-colors">
              <div className="space-y-0.5 min-w-0 pr-2">
                <label
                  htmlFor="hide-waypoints-switch"
                  className="text-xs font-semibold text-foreground cursor-pointer block"
                >
                  Sembunyikan Titik pada Peta
                </label>
              </div>
              <Switch
                id="hide-waypoints-switch"
                checked={hideWaypointsOnMap}
                onCheckedChange={(checked) => onToggleHideWaypoints?.(checked)}
                className="cursor-pointer shrink-0"
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* ACCORDION 3: DAFTAR TITIK JALAN TERHUBUNG (Dedicated Component) */}
        <AccordionItem
          value="titik"
          className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden"
        >
          <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-secondary/40">
            <div className="flex items-center justify-between flex-1 pr-2">
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-primary" />
                <span>Daftar Titik Jalan Terhubung</span>
                {isCalculatingRoute && (
                  <Loader2 className="w-3 h-3 animate-spin text-primary ml-1.5" />
                )}
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3.5 pb-3.5 pt-1">
            <DaftarTitik
              waypoints={waypoints}
              markerStyle={markerStyle}
              isCalculatingRoute={isCalculatingRoute}
              totalDistanceKm={draftRouteData?.distanceKm}
              totalDurationMin={draftRouteData?.durationMin}
              onZoomToRoute={onZoomToRoute}
              onResetWaypoints={onResetWaypoints}
              onRemoveWaypoint={onRemoveWaypoint}
              onMoveWaypoint={onMoveWaypoint}
              onToggleDisconnectWaypoint={onToggleDisconnectWaypoint}
              onConnectWaypointToNearest={onConnectWaypointToNearest}
              onFocusWaypoint={onFocusWaypoint}
              onUpdateWaypointName={onUpdateWaypointName}
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Floating AI Assistant (Pojok Kanan Bawah) */}
      <AiFloatingAssistant
        contextData={routeContextData}
        onExecuteAction={handleExecuteAiAction}
        actionFeedback={actionFeedback}
      />
    </div>
  );
}
