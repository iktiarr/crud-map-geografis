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
  Link2,
  Unlink,
  Eye,
  MoreVertical,
  Edit3,
  X,
  Share2,
  Navigation,
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
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  WaypointItem,
  MultiPointRouteResult,
  LineStyle,
  ConnectionMode,
  MarkerStyle,
  getLetterLabel,
} from "../tipe";

interface TambahRuteProps {
  selectedFolder: string;
  allFolderList: string[];
  filteredRoutesCount?: number;
  onGoBack: () => void;

  // Form Kustomisasi Garis & Titik
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
  markerStyle: MarkerStyle;
  onMarkerStyleChange: (val: MarkerStyle) => void;

  // Pengaturan Hubungkan Titik
  connectionMode: ConnectionMode;
  onConnectionModeChange: (val: ConnectionMode) => void;

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
  onToggleDisconnectWaypoint?: (index: number) => void;
  onConnectWaypointToNearest?: (index: number) => void;
  onFocusWaypoint?: (lat: number, lng: number) => void;
  onZoomToRoute?: () => void;
  onUpdateWaypointName?: (index: number, newName: string) => void;
}

export function TambahRute({
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
  markerStyle = "numbers",
  onMarkerStyleChange,
  connectionMode = "sequential",
  onConnectionModeChange,
  waypoints,
  draftRouteData,
  selectedAlternativeId = null,
  onSelectAlternativeRoute,
  isCalculatingRoute,
  onResetWaypoints,
  onRemoveWaypoint,
  onMoveWaypoint,
  onToggleDisconnectWaypoint,
  onConnectWaypointToNearest,
  hideWaypointsOnMap = false,
  onToggleHideWaypoints,
  onFocusWaypoint,
  onZoomToRoute,
  onUpdateWaypointName,
}: TambahRuteProps) {
  // State Edit Nama Titik
  const [editingWpIndex, setEditingWpIndex] = React.useState<number | null>(null);
  const [editingWpName, setEditingWpName] = React.useState("");

  const startEditWaypoint = (index: number, currentName: string) => {
    setEditingWpIndex(index);
    setEditingWpName(currentName);
  };

  const saveEditWaypoint = (index: number) => {
    const trimmed = editingWpName.trim();
    if (trimmed) {
      onUpdateWaypointName?.(index, trimmed);
    }
    setEditingWpIndex(null);
  };

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
      {/* Navigasi Atas: Tombol Kembali */}
      <div className="flex items-center pb-2 border-b border-border">
        <button
          type="button"
          onClick={onGoBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium cursor-pointer transition-colors"
          title="Kembali ke daftar rute"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali</span>
        </button>
      </div>

      {/* Edit Nama Rute Cepat */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border bg-card shadow-2xs group focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Edit3 className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Nama Rute
          </label>
          <input
            type="text"
            value={routeName}
            onChange={(e) => onRouteNameChange(e.target.value)}
            placeholder="Ketik nama rute..."
            className="w-full bg-transparent border-0 p-0 text-xs font-semibold text-foreground focus:outline-hidden focus:ring-0 placeholder:text-muted-foreground/50"
            title="Ubah nama rute langsung di sini"
          />
        </div>
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

            {/* Baris 4: Gaya Ikon Penanda Titik (Penomoran, Huruf, Dot Polos, Ikon Pin) */}
            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
                <span>Gaya Ikon Titik:</span>
                <span className="text-[10px] text-primary font-medium">
                  {markerStyle === "numbers" && "Angka (1, 2, 3)"}
                  {markerStyle === "letters" && "Huruf (A, B, C)"}
                  {markerStyle === "none" && "Tanpa Ikon (None - Hanya Klik Peta)"}
                  {markerStyle === "icon" && "Ikon Penanda (Pin)"}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  {
                    id: "numbers" as MarkerStyle,
                    label: "Angka",
                    sub: "1, 2, 3",
                    renderPreview: () => (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center shadow-2xs">
                        1
                      </span>
                    ),
                  },
                  {
                    id: "letters" as MarkerStyle,
                    label: "Huruf",
                    sub: "A, B, C",
                    renderPreview: () => (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground font-bold text-[10px] flex items-center justify-center shadow-2xs">
                        A
                      </span>
                    ),
                  },
                  {
                    id: "none" as MarkerStyle,
                    label: "None",
                    sub: "Hanya Klik",
                    renderPreview: () => (
                      <span className="w-4 h-4 rounded-full border border-dashed border-primary flex items-center justify-center text-[9px] text-primary font-bold">
                        ✕
                      </span>
                    ),
                  },
                  {
                    id: "icon" as MarkerStyle,
                    label: "Pin",
                    sub: "Ikon Lokasi",
                    renderPreview: () => (
                      <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xs">
                        <MapPin className="w-3 h-3" />
                      </span>
                    ),
                  },
                ].map((item) => {
                  const isSelected = markerStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onMarkerStyleChange?.(item.id)}
                      className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary ring-1 ring-primary/40 text-primary font-semibold shadow-xs"
                          : "bg-background border-border hover:bg-secondary/70 text-muted-foreground hover:text-foreground"
                      }`}
                      title={item.id === "none" ? "Tanpa ikon: Hanya klik di peta untuk menghubungkan jalan tanpa pin yang menutupi jalan" : `Pilih gaya penanda: ${item.label} (${item.sub})`}
                    >
                      {item.renderPreview()}
                      <div className="leading-tight">
                        <div className="text-[11px] font-medium leading-none">{item.label}</div>
                        <div className="text-[9px] text-muted-foreground/80 leading-none mt-0.5">{item.sub}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </AccordionContent>

        </AccordionItem>

        {/* ACCORDION PENGATURAN: OPSI HUBUNGKAN & TAMPILAN PETA */}
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

          <AccordionContent className="px-3.5 pb-3.5 pt-1 space-y-3.5">
            {/* OPSI HUBUNGKAN TITIK JALAN */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-foreground uppercase tracking-wider block">
                  Opsi Hubungkan Titik Jalan
                </label>
                <span className="text-[10px] text-primary font-medium">Pilih salah satu</span>
              </div>

              <div className="space-y-1.5">
                {[
                  {
                    id: "sequential" as ConnectionMode,
                    title: "Hubungkan Sesuai Urutan",
                    desc: "Titik dihubungkan berurutan 1 ➔ 2 ➔ 3... mengikuti lekukan jalan dan mencegah putar balik.",
                    icon: <Route className="w-4 h-4 text-primary shrink-0" />,
                    badge: "Sesuai Urutan",
                  },
                  {
                    id: "nearest" as ConnectionMode,
                    title: "Hubungkan Semua Jalan (Jalur Terdekat)",
                    desc: "Otomatis menyambungkan ke titik atau jalur terdekat untuk mencegah rute melompat jauh.",
                    icon: <Share2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
                    badge: "Terdekat / Efisien",
                  },
                  {
                    id: "direct_line" as ConnectionMode,
                    title: "Jalur Fleksibel (Ikuti Jalan & Gang)",
                    desc: "Mengikuti lekukan jalan dan gang tanpa terhalang rambu/larangan putar balik satu arah. Selalu nyambung langsung.",
                    icon: <Navigation className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />,
                    badge: "Gang & Jalan",
                  },
                ].map((item) => {
                  const isSelected = connectionMode === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => onConnectionModeChange?.(item.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? "bg-primary/10 border-primary ring-1 ring-primary/40 text-foreground shadow-2xs"
                          : "bg-secondary/30 border-border hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="pt-0.5">{item.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className={`text-[11px] font-semibold ${isSelected ? "text-foreground font-bold" : "text-foreground/90"}`}>
                            {item.title}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SWITCH SEMBUNYIKAN TITIK */}
            <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-secondary/30 hover:border-primary/40 transition-colors">
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
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-3.5 pb-3.5 pt-1 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-border/60">
              {onZoomToRoute && (
                <button
                  type="button"
                  onClick={onZoomToRoute}
                  disabled={waypoints.length === 0}
                  className="text-[10px] text-primary hover:underline flex items-center gap-1 cursor-pointer transition-colors font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Zoom ke seluruh rute jalan di peta"
                >
                  <Eye className="w-3 h-3" />
                  <span>Lihat Rute di Peta</span>
                </button>
              )}
              {waypoints.length >= 2 && (
                <button
                  type="button"
                  onClick={onResetWaypoints}
                  className="text-[10px] text-destructive hover:underline flex items-center gap-1 cursor-pointer transition-colors ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Titik</span>
                </button>
              )}
            </div>

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
                  const isEditing = editingWpIndex === idx;
                  const isBranch = wp.connectionType === "nearest_branch";

                  const badgeText = markerStyle === "letters"
                    ? getLetterLabel(idx)
                    : markerStyle === "none"
                    ? ""
                    : markerStyle === "icon"
                    ? <MapPin className="w-2.5 h-2.5" />
                    : `${idx + 1}`;

                  const pointLabel = isBranch
                    ? "Titik Terhubung"
                    : markerStyle === "letters"
                    ? `Titik ${getLetterLabel(idx)}`
                    : `Titik ${idx + 1}`;

                  if (isEditing) {
                    return (
                      <div
                        key={wp.id}
                        className="p-2.5 rounded-lg border border-primary bg-primary/5 flex items-center justify-between gap-2 text-xs transition-colors shadow-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className={`${markerStyle === "none" && !isBranch ? "w-3.5 h-3.5" : "w-5 h-5"} rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white shadow-2xs ${
                            isBranch
                              ? "bg-teal-600"
                              : isOrigin
                              ? "bg-emerald-600"
                              : isDestination
                              ? "bg-rose-600"
                              : "bg-amber-500"
                          }`}
                        >
                          {badgeText}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          <input
                            type="text"
                            value={editingWpName}
                            onChange={(e) => setEditingWpName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                saveEditWaypoint(idx);
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingWpIndex(null);
                              }
                            }}
                            autoFocus
                            className="h-7 px-2 text-[11px] rounded bg-background border border-primary text-foreground outline-none w-full min-w-0 font-medium focus:ring-1 focus:ring-primary shadow-xs"
                            placeholder="Nama titik jalan..."
                          />
                          <button
                            type="button"
                            onClick={() => saveEditWaypoint(idx)}
                            className="p-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 cursor-pointer shadow-xs"
                            title="Simpan Nama Titik (Enter)"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingWpIndex(null)}
                            className="p-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 cursor-pointer"
                            title="Batal (Esc)"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <ContextMenu key={wp.id}>
                      <ContextMenuTrigger className="block w-full">
                        <div
                          className="p-2.5 rounded-lg border border-border bg-secondary/30 flex items-center justify-between gap-2 text-xs hover:border-border transition-colors group cursor-default select-none"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`${markerStyle === "none" && !isBranch ? "w-3.5 h-3.5" : "w-5 h-5"} rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 text-white shadow-2xs ${
                                isBranch
                                  ? "bg-teal-600"
                                  : isOrigin
                                  ? "bg-emerald-600"
                                  : isDestination
                                  ? "bg-rose-600"
                                  : "bg-amber-500"
                              }`}
                            >
                              {badgeText}
                            </span>
                            <div className="min-w-0 flex-1 group/name">
                              <div
                                className="font-semibold text-foreground truncate text-[11px] flex items-center gap-1.5"
                              >
                                <span
                                  onClick={() => onFocusWaypoint?.(wp.lat, wp.lng)}
                                  className="truncate cursor-pointer hover:text-primary transition-colors"
                                  title={`Klik untuk zoom ke ${pointLabel} di peta`}
                                >
                                  {wp.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditWaypoint(idx, wp.name || "");
                                  }}
                                  className="opacity-0 group-hover/name:opacity-100 p-0.5 text-muted-foreground hover:text-primary rounded cursor-pointer transition-all shrink-0"
                                  title="Edit Nama Titik"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                                {wp.connectionType === "nearest_branch" && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-medium rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 shrink-0">
                                    <Link2 className="w-2.5 h-2.5" />
                                    Terhubung
                                  </span>
                                )}
                                {(wp.connectionType === "disconnected" || wp.isDisconnected) && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-medium rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                                    <Unlink className="w-2.5 h-2.5" />
                                    Jalan Lain
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Tombol Opsi Titik: Titik Tiga (Compact) */}
                          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
                                title="Opsi Titik"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52 text-xs">
                                <DropdownMenuItem
                                  onClick={() => onFocusWaypoint?.(wp.lat, wp.lng)}
                                  className="cursor-pointer flex items-center gap-2"
                                >
                                  <Eye className="w-3.5 h-3.5 text-primary" />
                                  <span>Lihat di Peta</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => startEditWaypoint(idx, wp.name || "")}
                                  className="cursor-pointer flex items-center gap-2"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-primary" />
                                  <span>Edit Nama Titik</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={idx === 0}
                                  onClick={() => onMoveWaypoint(idx, "up")}
                                  className="cursor-pointer flex items-center gap-2 disabled:opacity-40"
                                >
                                  <MoveUp className="w-3.5 h-3.5" />
                                  <span>Geser Urutan Naik</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  disabled={idx === waypoints.length - 1}
                                  onClick={() => onMoveWaypoint(idx, "down")}
                                  className="cursor-pointer flex items-center gap-2 disabled:opacity-40"
                                >
                                  <MoveDown className="w-3.5 h-3.5" />
                                  <span>Geser Urutan Turun</span>
                                </DropdownMenuItem>

                                {idx > 0 && onConnectWaypointToNearest && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => onConnectWaypointToNearest(idx)}
                                      className="cursor-pointer flex items-center justify-between"
                                    >
                                      <span className="flex items-center gap-2">
                                        <Link2 className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                        <span>Hubungkan ke Jalur Terdekat</span>
                                      </span>
                                      {wp.connectionType === "nearest_branch" && (
                                        <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                      )}
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {idx > 0 && onToggleDisconnectWaypoint && (
                                  <DropdownMenuItem
                                    onClick={() => onToggleDisconnectWaypoint(idx)}
                                    className="cursor-pointer flex items-center justify-between"
                                  >
                                    <span className="flex items-center gap-2">
                                      {wp.connectionType === "disconnected" || wp.isDisconnected ? (
                                        <>
                                          <Link2 className="w-3.5 h-3.5 text-primary" />
                                          <span>Sambungkan ke Sebelumnya</span>
                                        </>
                                      ) : (
                                        <>
                                          <Unlink className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                          <span>Buat Jalan Lain (Pisah)</span>
                                        </>
                                      )}
                                    </span>
                                    {(wp.connectionType === "disconnected" || wp.isDisconnected) && (
                                      <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                    )}
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => onRemoveWaypoint(idx)}
                                  className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Hapus Titik</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </ContextMenuTrigger>

                      <ContextMenuContent className="w-52">
                        <ContextMenuItem
                          onClick={() => onFocusWaypoint?.(wp.lat, wp.lng)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span>Lihat di Peta</span>
                        </ContextMenuItem>

                        <ContextMenuItem
                          onClick={() => startEditWaypoint(idx, wp.name || "")}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary" />
                          <span>Edit Nama Titik</span>
                        </ContextMenuItem>

                        <ContextMenuItem
                          disabled={idx === 0}
                          onClick={() => onMoveWaypoint(idx, "up")}
                          className="cursor-pointer text-xs flex items-center gap-2 disabled:opacity-40"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                          <span>Geser Urutan Naik</span>
                        </ContextMenuItem>

                        <ContextMenuItem
                          disabled={idx === waypoints.length - 1}
                          onClick={() => onMoveWaypoint(idx, "down")}
                          className="cursor-pointer text-xs flex items-center gap-2 disabled:opacity-40"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                          <span>Geser Urutan Turun</span>
                        </ContextMenuItem>

                        {idx > 0 && onConnectWaypointToNearest && (
                          <>
                            <ContextMenuSeparator />
                            <ContextMenuItem
                              onClick={() => onConnectWaypointToNearest(idx)}
                              className="cursor-pointer text-xs flex items-center justify-between"
                            >
                              <span className="flex items-center">
                                <Link2 className="w-3.5 h-3.5 mr-2 text-teal-600 dark:text-teal-400" />
                                Hubungkan ke Jalur Terdekat
                              </span>
                              {wp.connectionType === "nearest_branch" && (
                                <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                              )}
                            </ContextMenuItem>
                          </>
                        )}

                        {idx > 0 && onToggleDisconnectWaypoint && (
                          <ContextMenuItem
                            onClick={() => onToggleDisconnectWaypoint(idx)}
                            className="cursor-pointer text-xs flex items-center justify-between"
                          >
                            <span className="flex items-center">
                              {wp.connectionType === "disconnected" || wp.isDisconnected ? (
                                <>
                                  <Link2 className="w-3.5 h-3.5 mr-2 text-primary" />
                                  Sambungkan ke Titik Sebelumnya
                                </>
                              ) : (
                                <>
                                  <Unlink className="w-3.5 h-3.5 mr-2 text-amber-600 dark:text-amber-400" />
                                  Buat Jalan Lain (Pisah Rute)
                                </>
                              )}
                            </span>
                            {(wp.connectionType === "disconnected" || wp.isDisconnected) && (
                              <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            )}
                          </ContextMenuItem>
                        )}

                        <ContextMenuSeparator />

                        <ContextMenuItem
                          onClick={() => onRemoveWaypoint(idx)}
                          className="cursor-pointer text-xs text-destructive focus:text-destructive flex items-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Hapus Titik Ini
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
