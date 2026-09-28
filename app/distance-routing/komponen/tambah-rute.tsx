import * as React from "react";
import {
  Palette,
  Route,
  Check,
  RotateCcw,
  Loader2,
  MapPin,
  MoveUp,
  MoveDown,
  Trash2,
  ArrowLeft,
  Folder,
  ChevronDown,
  Settings,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import {
  WaypointItem,
  MultiPointRouteResult,
  LineStyle,
} from "../tipe";

interface TambahRuteProps {
  selectedFolder: string;
  allFolderList: string[];
  filteredRoutesCount?: number;
  onGoBack: () => void;

  // Form Kustomisasi Garis
  routeName: string;
  onRouteNameChange: (val: string) => void;
  targetFolder: string;
  onTargetFolderChange: (val: string) => void;
  customColor: string;
  onCustomColorChange: (val: string) => void;
  customWeight: number;
  onCustomWeightChange: (val: number) => void;
  customOpacity: number;
  customLineStyle: LineStyle;
  onCustomLineStyleChange: (val: LineStyle) => void;

  // Waypoints & Simpan
  waypoints: WaypointItem[];
  draftRouteData: MultiPointRouteResult | null;
  selectedAlternativeId?: string | null;
  onSelectAlternativeRoute?: (id: string | null) => void;
  insertAtIndex?: number | null;
  onSetInsertAtIndex?: (index: number | null) => void;
  isCalculatingRoute: boolean;
  isSaving: boolean;
  onResetWaypoints: () => void;
  onRemoveWaypoint: (index: number) => void;
  onMoveWaypoint: (index: number, direction: "up" | "down") => void;
  onReverseAllWaypoints?: () => void;
  onAddIntermediatePoint?: () => void;
  hideWaypointsOnMap?: boolean;
  onToggleHideWaypoints?: (val: boolean) => void;
}

export function TambahRute({
  selectedFolder,
  allFolderList,
  onGoBack,
  routeName,
  onRouteNameChange,
  targetFolder,
  onTargetFolderChange,
  customColor,
  onCustomColorChange,
  customWeight,
  onCustomWeightChange,
  customOpacity,
  customLineStyle,
  onCustomLineStyleChange,
  waypoints,
  draftRouteData,
  selectedAlternativeId = null,
  onSelectAlternativeRoute,
  isCalculatingRoute,
  isSaving,
  onResetWaypoints,
  onRemoveWaypoint,
  onMoveWaypoint,
  hideWaypointsOnMap = false,
  onToggleHideWaypoints,
}: TambahRuteProps) {
  // Hitung metrik rute aktif (baik rute utama maupun jalur alternatif terpilih)
  const activeAlternative = React.useMemo(() => {
    if (!selectedAlternativeId || !draftRouteData?.alternatives) return null;
    return draftRouteData.alternatives.find((a) => a.id === selectedAlternativeId) || null;
  }, [selectedAlternativeId, draftRouteData]);

  const displayDistance = activeAlternative ? activeAlternative.distanceKm : draftRouteData?.distanceKm || 0;
  const displayDuration = activeAlternative ? activeAlternative.durationMin : draftRouteData?.durationMin || 0;

  // State Dropdown Kustom untuk Mencegah Pergeseran Posisi Item
  const [isFolderMenuOpen, setIsFolderMenuOpen] = React.useState(false);
  const [isLineStyleMenuOpen, setIsLineStyleMenuOpen] = React.useState(false);
  const folderMenuRef = React.useRef<HTMLDivElement>(null);
  const lineStyleMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (folderMenuRef.current && !folderMenuRef.current.contains(target)) {
        setIsFolderMenuOpen(false);
      }
      if (lineStyleMenuRef.current && !lineStyleMenuRef.current.contains(target)) {
        setIsLineStyleMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-3.5 animate-in fade-in duration-150">
      {/* Navigasi Atas: Tombol Kembali & Indikator Simpan */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onGoBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium cursor-pointer transition-colors"
            title="Kembali ke daftar rute"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          {isSaving && (
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-sans">
              <span className="flex items-center gap-1.5 text-primary text-[11px] font-medium">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Menyimpan...</span>
              </span>
            </div>
          )}
        </div>

        <span className="text-[11px] text-muted-foreground font-mono truncate max-w-32.5" title={selectedFolder}>
          Folder: <strong className="text-foreground">{selectedFolder}</strong>
        </span>
      </div>


      {/* Accordion Utama: Kustomisasi Garis & Titik Jalan */}
      <Accordion
        multiple
        defaultValue={["kustomisasi", "pengaturan", "titik"]}
        className="space-y-3 bg-transparent border-0"
      >
        {/* ACCORDION 1: KUSTOMISASI GARIS RUTE DI PETA */}
        <AccordionItem
          value="kustomisasi"
          className="rounded-xl border border-border bg-card shadow-2xs"
        >
          <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-secondary/40">
            <div className="flex items-center gap-2 flex-1 text-xs font-bold text-foreground">
              <Palette className="w-3.5 h-3.5 text-primary" />
              <span>Kustomisasi Garis Rute</span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3.5 pb-3.5 pt-1 space-y-2.5 overflow-visible">
            {/* Baris 1: Nama Rute & Simpan ke Folder (2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Nama Rute:
                </label>
                <input
                  type="text"
                  value={routeName}
                  onChange={(e) => onRouteNameChange(e.target.value)}
                  placeholder="Misal: Rute Utama Taman Kota ➔ Alun-alun"
                  className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs font-medium focus:ring-1 focus:ring-primary focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Simpan ke Folder:
                </label>
                <div ref={folderMenuRef} className="relative w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setIsFolderMenuOpen((prev) => !prev);
                      setIsLineStyleMenuOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs font-medium flex items-center justify-between hover:bg-secondary/60 transition-colors focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
                  >
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                      <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">
                        {targetFolder === "Tanpa Folder" ? "Tanpa Folder (Default)" : targetFolder}
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1 transition-transform duration-150 ${
                        isFolderMenuOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  {isFolderMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full z-50 max-h-52 overflow-y-auto rounded-lg p-1 bg-popover/95 backdrop-blur-md text-popover-foreground shadow-xl border border-border space-y-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          onTargetFolderChange("Tanpa Folder");
                          setIsFolderMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                          targetFolder === "Tanpa Folder"
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-secondary text-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Folder className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">Tanpa Folder (Default)</span>
                        </span>
                        {targetFolder === "Tanpa Folder" && (
                          <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                        )}
                      </button>

                      {allFolderList.map((fld) => (
                        <button
                          key={fld}
                          type="button"
                          onClick={() => {
                            onTargetFolderChange(fld);
                            setIsFolderMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                            targetFolder === fld
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Folder className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="truncate">{fld}</span>
                          </span>
                          {targetFolder === fld && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Baris 2: Warna Garis (Palet) & Gaya Garis (Dropdown) (2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground block">
                  Pilih Warna Garis:
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
                    onClick={() => {
                      setIsLineStyleMenuOpen((prev) => !prev);
                      setIsFolderMenuOpen(false);
                    }}
                    className="w-full h-8 px-2.5 rounded-lg bg-background border border-border text-foreground text-xs font-medium flex items-center justify-between hover:bg-secondary/60 transition-colors focus:ring-1 focus:ring-primary outline-hidden cursor-pointer"
                  >
                    <span>
                      {customLineStyle === "solid" && "Utuh (Solid)"}
                      {customLineStyle === "dashed" && "Putus-putus (Dashed)"}
                      {customLineStyle === "dotted" && "Titik-titik (Dotted)"}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted-foreground shrink-0 ml-1 transition-transform duration-150 ${
                        isLineStyleMenuOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  {isLineStyleMenuOpen && (
                    <div className="absolute top-full left-0 mt-1 w-full z-50 rounded-lg p-1 bg-popover/95 backdrop-blur-md text-popover-foreground shadow-xl border border-border space-y-0.5">
                      {[
                        { value: "solid" as LineStyle, label: "Utuh (Solid)" },
                        { value: "dashed" as LineStyle, label: "Putus-putus (Dashed)" },
                        { value: "dotted" as LineStyle, label: "Titik-titik (Dotted)" },
                      ].map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            onCustomLineStyleChange(item.value);
                            setIsLineStyleMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md cursor-pointer transition-colors text-left ${
                            customLineStyle === item.value
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-secondary text-foreground"
                          }`}
                        >
                          <span>{item.label}</span>
                          {customLineStyle === item.value && (
                            <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Baris 3: Ketebalan Garis (Slider) & Pratinjau Garis Simpel (2 Kolom) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end pt-0.5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                  <span>Ketebalan:</span>
                  <span className="font-mono text-primary font-bold">{customWeight}px</span>
                </div>
                <div className="h-8 flex items-center px-1">
                  <input
                    type="range"
                    min="2"
                    max="14"
                    value={customWeight}
                    onChange={(e) => onCustomWeightChange(parseInt(e.target.value, 10))}
                    className="w-full accent-primary h-1.5 bg-secondary rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-foreground block">
                  Pratinjau Garis:
                </span>
                <div className="h-8 rounded-lg bg-background border border-border flex items-center px-3 overflow-hidden shadow-2xs">
                  <div
                    className="w-full transition-all"
                    style={{
                      height: `${customWeight}px`,
                      backgroundColor: customColor,
                      opacity: customOpacity,
                      borderStyle:
                        customLineStyle === "dashed"
                          ? "dashed"
                          : customLineStyle === "dotted"
                          ? "dotted"
                          : "solid",
                      borderRadius: customLineStyle === "dotted" ? "999px" : "2px",
                    }}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>

        </AccordionItem>

        {/* ACCORDION PENGATURAN: PENGATURAN TAMPILAN PETA */}
        <AccordionItem
          value="pengaturan"
          className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden"
        >
          <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-secondary/40">
            <div className="text-xs font-bold text-foreground flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 text-primary" />
              <span>Pengaturan</span>
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3.5 pb-3.5 pt-1 space-y-3">
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-secondary/30 hover:border-border transition-colors">
              <div className="space-y-0.5 min-w-0 pr-2">
                <label
                  htmlFor="hide-waypoints-switch"
                  className="text-xs font-semibold text-foreground cursor-pointer block"
                >
                  Sembunyikan Titik pada Peta
                </label>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Sembunyikan pin penanda nomor agar visual garis jalan terlihat bersih.
                </p>
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

        {/* ACCORDION 2: DAFTAR TITIK JALAN TERHUBUNG */}
        <AccordionItem
          value="titik"
          className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden"
        >
          <AccordionTrigger className="px-3.5 py-2.5 hover:no-underline hover:bg-secondary/40">
            <div className="flex items-center justify-between flex-1 pr-2">
              <div className="text-xs font-bold text-foreground flex items-center gap-2">
                <Route className="w-3.5 h-3.5 text-primary" />
                <span>Daftar Titik Jalan Terhubung</span>
              </div>
              {draftRouteData && waypoints.length >= 2 && (
                <span className="text-xs font-mono font-bold text-primary">
                  {displayDistance} km
                </span>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3.5 pb-3.5 pt-1 space-y-3">
            {waypoints.length >= 2 && (
              <div className="flex items-center justify-end pb-1 border-b border-border/60">
                <button
                  type="button"
                  onClick={onResetWaypoints}
                  className="text-[10px] text-destructive hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Titik</span>
                </button>
              </div>
            )}

            {waypoints.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl p-4 space-y-2 bg-secondary/20">
                <MapPin className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                <p className="font-semibold text-foreground">Belum ada titik jalan di peta</p>
                <p className="text-[11px] text-muted-foreground">
                  Klik lokasi manapun pada peta di sebelah kanan untuk menambahkan titik jalan pertama.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {waypoints.map((wp, idx) => {
                  const isOrigin = idx === 0;
                  const isDestination = idx === waypoints.length - 1 && waypoints.length > 1;

                  return (
                    <ContextMenu key={wp.id}>
                      <ContextMenuTrigger className="block w-full">
                        <div
                          className="p-2.5 rounded-lg border border-border bg-secondary/30 flex items-center justify-between gap-2 text-xs hover:border-border transition-colors group cursor-default select-none"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white shadow-2xs ${
                                isOrigin
                                  ? "bg-emerald-600"
                                  : isDestination
                                  ? "bg-rose-600"
                                  : "bg-amber-500"
                              }`}
                            >
                              {isOrigin ? "1" : isDestination ? "N" : `${idx + 1}`}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground truncate text-[11px]">
                                {wp.name}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => onMoveWaypoint(idx, "up")}
                              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Geser Urutan Naik"
                            >
                              <MoveUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === waypoints.length - 1}
                              onClick={() => onMoveWaypoint(idx, "down")}
                              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                              title="Geser Urutan Turun"
                            >
                              <MoveDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveWaypoint(idx)}
                              className="p-1 text-destructive/70 hover:text-destructive cursor-pointer"
                              title="Hapus Titik Ini"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </ContextMenuTrigger>

                      <ContextMenuContent className="w-48">
                        <div className="px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground border-b border-border/50">
                          Titik {idx + 1}: {wp.name}
                        </div>
                        <ContextMenuItem
                          variant="destructive"
                          onClick={() => onRemoveWaypoint(idx)}
                          className="cursor-pointer text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          <span>Hapus Titik Ini</span>
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  );
                })}
              </div>
            )}

            {/* Pilihan Rute Alternatif OSRM */}
            {draftRouteData && draftRouteData.alternatives && draftRouteData.alternatives.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="text-[11px] font-bold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Route className="w-3.5 h-3.5 text-amber-500" />
                    Pilihan Jalur Rute ({draftRouteData.alternatives.length + 1} Opsi)
                  </span>
                  <span className="text-[10px] text-muted-foreground">Klik untuk beralih</span>
                </div>

                <div className="space-y-1.5">
                  {/* Jalur 1 (Utama) */}
                  <div
                    onClick={() => onSelectAlternativeRoute?.(null)}
                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      selectedAlternativeId === null
                        ? "bg-primary/10 border-primary ring-1 ring-primary/40 text-foreground"
                        : "bg-secondary/30 border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold flex items-center gap-1.5 text-[11px]">
                        <span className={`w-2 h-2 rounded-full ${selectedAlternativeId === null ? "bg-primary" : "bg-muted-foreground/40"}`} />
                        <span>Jalur Utama (Rekomendasi)</span>
                        {selectedAlternativeId === null && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-medium">Aktif</span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate pl-3.5">
                        {draftRouteData.summary || "Rute tercepat OSRM"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-[11px] text-foreground">
                        {draftRouteData.distanceKm} km
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        ~{draftRouteData.durationMin} mnt
                      </div>
                    </div>
                  </div>

                  {/* Jalur-jalur Alternatif */}
                  {draftRouteData.alternatives.map((alt) => {
                    const isSelected = selectedAlternativeId === alt.id;
                    return (
                      <div
                        key={alt.id}
                        onClick={() => onSelectAlternativeRoute?.(alt.id)}
                        className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 ring-1 ring-amber-500/40 text-foreground"
                            : "bg-secondary/30 border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold flex items-center gap-1.5 text-[11px]">
                            <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-amber-500" : "bg-muted-foreground/40"}`} />
                            <span className="truncate">{alt.name}</span>
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-medium">Aktif</span>
                            )}
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium pl-3.5">
                            Jalur Alternatif (Klik untuk beralih)
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-[11px] text-foreground">
                            {alt.distanceKm} km
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            ~{alt.durationMin} mnt
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ringkasan Jarak & Estimasi */}
            {draftRouteData && waypoints.length >= 2 && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 space-y-1 text-xs">
                <div className="flex items-center justify-between font-bold text-foreground">
                  <span className="flex items-center gap-1">
                    <span>Total Jarak Rute:</span>
                    {selectedAlternativeId && (
                      <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">(Jalur Alternatif)</span>
                    )}
                  </span>
                  <span className="text-primary font-mono text-sm">
                    {displayDistance} km
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Estimasi Durasi Perjalanan:</span>
                  <span className="font-mono text-foreground font-semibold">
                    ~{displayDuration} menit
                  </span>
                </div>
              </div>
            )}

            {isCalculatingRoute && (
              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                <span>Mengkalkulasi rute jalan terbaik...</span>
              </div>
            )}

          </AccordionContent>

        </AccordionItem>
      </Accordion>
    </div>
  );
}
