"use client";

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowLeft,
  MapPin,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Download,
  Upload,
  RefreshCw,
  Undo2,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Map as MapIcon,
  Folder,
  FolderPlus,
  MoreVertical,
  FolderArchive,
  Save,
  FileCode,
  Globe2,
  FileText,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/confirm-modal";
import type { SpatialFeature } from "@/components/map/leaflet-spatial-crud-map";
import { BasemapCombobox } from "@/components/ui/basemap-combobox";
import { CategoryCombobox } from "@/components/ui/category-combobox";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

// Dynamic import of Leaflet map with SSR disabled
const LeafletSpatialCrudMap = dynamic(
  () =>
    import("@/components/map/leaflet-spatial-crud-map").then(
      (mod) => mod.LeafletSpatialCrudMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium">Memuat Peta Spasial Interaktif...</span>
      </div>
    ),
  }
);

const COLOR_PRESETS = [
  { name: "Hijau Zamrud", hex: "#10b981" },
  { name: "Biru Samudra", hex: "#3b82f6" },
  { name: "Merah Crimson", hex: "#ef4444" },
  { name: "Kuning Emas", hex: "#f59e0b" },
  { name: "Ungu Violet", hex: "#8b5cf6" },
  { name: "Teal Toska", hex: "#06b6d4" },
  { name: "Pink Fuchia", hex: "#ec4899" },
  { name: "Zaitun Alami", hex: "#678a40" },
];

const DEFAULT_CATEGORIES = [
  "Umum",
  "Pendidikan & Sekolah",
  "Kesehatan & Rumah Sakit",
  "Jalan Raya & Infrastruktur",
  "Taman & Ruang Terbuka Hijau",
  "Kawasan Industri & Bisnis",
  "Batas Administrasi Wilayah",
  "Fasilitas Publik",
  "Pariwisata & Hiburan",
  "Lainnya",
];


// ================= ACTION MENU COMBOBOX UNTUK GRUP =================
function GroupActionMenu({
  groupName,
  onRename,
  onDelete,
}: {
  groupName: string;
  onRename: (group: string) => void;
  onDelete: (group: string) => void;
}) {
  const handleExport = (format: string) => {
    const url = `/api/spatial-crud/export?format=${format}&group=${encodeURIComponent(groupName)}`;
    window.open(url, "_blank");
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="p-1.5 rounded-full border border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer data-popup-open:bg-primary data-popup-open:text-primary-foreground data-popup-open:border-primary shadow-xs outline-none"
          title={`Menu Aksi Grup ${groupName}`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" side="bottom" sideOffset={6} className="min-w-44 z-50">
          {/* Ubah Nama */}
          <DropdownMenuItem
            onClick={() => onRename(groupName)}
            className="flex items-center gap-2 cursor-pointer text-xs font-medium"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>Ubah Nama</span>
          </DropdownMenuItem>

          {/* Ekspor (Submenu) */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Ekspor</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-50 z-50">
              <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Format Ekspor Grup:
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleExport("zip")}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <FolderArchive className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Paket Lengkap (.zip)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("shapefile")}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <MapIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Shapefile (.zip)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("geojson")}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <FileCode className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>GeoJSON (.geojson)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("kml")}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <Globe2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Google Earth (.kml)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("csv")}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>Tabel Data (.csv)</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("md")}
                className="flex items-center gap-2 cursor-pointer text-xs font-medium"
              >
                <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Dokumen Info (.md)</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Hapus Grup */}
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(groupName)}
            className="flex items-center gap-2 cursor-pointer text-xs font-medium text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Hapus Grup</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function Modul2PageView() {
  // Data state
  const [features, setFeatures] = React.useState<SpatialFeature[]>([]);
  const [dbGroups, setDbGroups] = React.useState<string[]>([]);
  const [activeBasemapId, setActiveBasemapId] = React.useState("google-hybrid");
  const [isSidePanelOpen, setIsSidePanelOpen] = React.useState(true);

  // Group Management State
  const [activeGroup, setActiveGroup] = React.useState<string>("Semua");
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null);
  const [customGroups, setCustomGroups] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("spatial_crud_custom_groups");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const oldPresets = ["Infrastruktur", "Fasilitas Publik", "Zonasi Hijau", "Utama"];
          return parsed.filter((g) => typeof g === "string" && !oldPresets.includes(g.trim()));
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Modals for Group Operations
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = React.useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = React.useState("");

  const handleOpenGroupDetail = (grp: string) => {
    setSelectedGroup(grp);
    setActiveGroup(grp);
    setGroupName(grp);
  };

  // Group Rename & Delete Modals
  const [renameTargetGroup, setRenameTargetGroup] = React.useState<string | null>(null);
  const [renameNewNameInput, setRenameNewNameInput] = React.useState("");
  const [deleteTargetGroup, setDeleteTargetGroup] = React.useState<string | null>(null);

  const handleOpenRename = (grp: string) => {
    setRenameTargetGroup(grp);
    setRenameNewNameInput(grp);
  };

  const handleConfirmRenameGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTargetGroup) return;
    const trimmed = renameNewNameInput.trim();
    if (!trimmed) {
      showToast("Nama grup tidak boleh kosong", "error");
      return;
    }
    if (trimmed === renameTargetGroup) {
      setRenameTargetGroup(null);
      return;
    }

    try {
      const res = await fetch("/api/spatial-crud/groups", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: renameTargetGroup, newName: trimmed }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`Grup berhasil diubah menjadi "${trimmed}"`, "success");
        setCustomGroups((prev) => prev.map((g) => (g === renameTargetGroup ? trimmed : g)));
        setDbGroups((prev) => prev.map((g) => (g === renameTargetGroup ? trimmed : g)));
        if (activeGroup === renameTargetGroup) setActiveGroup(trimmed);
        if (groupName === renameTargetGroup) setGroupName(trimmed);
        if (selectedGroup === renameTargetGroup) setSelectedGroup(trimmed);
        setRenameTargetGroup(null);
        fetchFeatures();
      } else {
        showToast(data.message || "Gagal mengubah nama grup", "error");
      }
    } catch (err) {
      console.error("Rename error:", err);
      showToast("Terjadi kesalahan saat mengubah nama grup", "error");
    }
  };

  const handleOpenDeleteGroup = (grp: string) => {
    setDeleteTargetGroup(grp);
  };

  const handleConfirmDeleteGroup = async () => {
    if (!deleteTargetGroup) return;
    const grpToDelete = deleteTargetGroup;
    try {
      const res = await fetch(`/api/spatial-crud/groups?name=${encodeURIComponent(grpToDelete)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`Grup "${grpToDelete}" berhasil dihapus`, "success");
        setCustomGroups((prev) => {
          const updated = prev.filter((g) => g !== grpToDelete);
          try {
            localStorage.setItem("spatial_crud_custom_groups", JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
        setDbGroups((prev) => prev.filter((g) => g !== grpToDelete));
        if (activeGroup === grpToDelete) setActiveGroup("Semua");
        if (groupName === grpToDelete) setGroupName("");
        if (selectedGroup === grpToDelete) setSelectedGroup(null);
        setDeleteTargetGroup(null);
        fetchFeatures();
      } else {
        showToast(data.message || "Gagal menghapus grup", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Gagal menghapus grup", "error");
    }
  };

  // Tabs: 'list' | 'draw' | 'io'
  const [activeTab, setActiveTab] = React.useState<"list" | "draw" | "io">("list");

  // Multi-Select (Fitur Select) State
  const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
  const [isRegroupModalOpen, setIsRegroupModalOpen] = React.useState(false);
  const [regroupTargetGroup, setRegroupTargetGroup] = React.useState("Utama");
  const [regroupCustomInput, setRegroupCustomInput] = React.useState("");
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = React.useState(false);

  // Single Item Move to Group Modal
  const [singleMoveTarget, setSingleMoveTarget] = React.useState<SpatialFeature | null>(null);

  // Markdown Info Preview Modal
  const [previewMdModalOpen, setPreviewMdModalOpen] = React.useState(false);
  const [mdPreviewContent, setMdPreviewContent] = React.useState<string>("");
  const [isLoadingMdPreview, setIsLoadingMdPreview] = React.useState(false);

  // Drawing & Form State
  const [drawMode, setDrawMode] = React.useState<"none" | "point" | "linestring" | "polygon">("none");
  const [draftPoints, setDraftPoints] = React.useState<[number, number][]>([]);
  const [draftGeometry, setDraftGeometry] = React.useState<{
    type: string;
    coordinates: unknown;
  } | null>(null);

  const [name, setName] = React.useState("");
  const [groupName, setGroupName] = React.useState("");
  const [customGroupInForm, setCustomGroupInForm] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [color, setColor] = React.useState("#10b981");
  const [description, setDescription] = React.useState("");

  // Edit State
  const [editingFeature, setEditingFeature] = React.useState<SpatialFeature | null>(null);

  // Delete modal state (single delete)
  const [deleteTarget, setDeleteTarget] = React.useState<SpatialFeature | null>(null);

  // Focus feature on map
  const [focusedFeatureId, setFocusedFeatureId] = React.useState<number | null>(null);

  // Notifications
  const [toast, setToast] = React.useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<string | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Features from Database
  const fetchFeatures = React.useCallback(async () => {
    try {
      const res = await fetch("/api/spatial-crud");
      const data = await res.json();
      if (data.status === "success" && Array.isArray(data.data)) {
        setFeatures(data.data);
        if (Array.isArray(data.groups) && data.groups.length > 0) {
          setDbGroups(data.groups);
        }
      } else {
        showToast(data.message || "Gagal mengambil data", "error");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      showToast("Koneksi gagal saat mengambil data spasial", "error");
    }
  }, []);

  React.useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  // Helper to identify standalone (no group) features
  const isStandaloneGroup = React.useCallback((grp?: string | null) => {
    if (!grp) return true;
    const lower = grp.trim().toLowerCase();
    return lower === "" || lower === "tanpa grup" || lower === "utama";
  }, []);

  // Standalone features (without group)
  const standaloneFeatures = React.useMemo(() => {
    return features.filter((f) => isStandaloneGroup(f.group_name));
  }, [features, isStandaloneGroup]);

  // Combined list of all available groups (excluding standalone)
  const allGroups = React.useMemo(() => {
    const fromFeatures = features
      .map((f) => (f.group_name || "").trim())
      .filter((g) => g && !isStandaloneGroup(g));
    const combined = new Set([
      ...dbGroups.filter((g) => g && !isStandaloneGroup(g)),
      ...customGroups.filter((g) => g && !isStandaloneGroup(g)),
      ...fromFeatures,
    ]);
    return Array.from(combined).filter(Boolean);
  }, [features, dbGroups, customGroups, isStandaloneGroup]);

  // Helper to add and persist a new custom group
  const handleAddCustomGroup = React.useCallback((newGrp: string) => {
    const trimmed = newGrp.trim();
    if (!trimmed) return;
    setCustomGroups((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      try {
        localStorage.setItem("spatial_crud_custom_groups", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Custom categories persisted by user
  const [customCategories, setCustomCategories] = React.useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("spatial_crud_custom_categories");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const handleAddCategory = React.useCallback((newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setCustomCategories((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      try {
        localStorage.setItem("spatial_crud_custom_categories", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  const allCategories = React.useMemo(() => {
    const featureCategories = features
      .map((f) => f.category?.trim())
      .filter((c): c is string => Boolean(c));
    const set = new Set([...DEFAULT_CATEGORIES, ...customCategories, ...featureCategories]);
    return Array.from(set).filter(Boolean);
  }, [features, customCategories]);

  // Update default group in form when activeGroup changes
  React.useEffect(() => {
    if (activeGroup !== "Semua") {
      setGroupName(activeGroup);
    }
  }, [activeGroup]);

  // Reset Draft / Drawing Mode
  const resetDrawing = () => {
    setDrawMode("none");
    setDraftPoints([]);
    setDraftGeometry(null);
  };

  // Switch to Draw Mode
  const handleStartDraw = (mode: "point" | "linestring" | "polygon") => {
    setDrawMode(mode);
    setDraftPoints([]);
    setDraftGeometry(null);
    setActiveTab("draw");
    showToast(
      mode === "point"
        ? "Klik pada peta untuk menempatkan titik"
        : mode === "linestring"
        ? "Klik titik-titik di peta untuk menggambar garis"
        : "Klik minimal 3 titik di peta untuk membuat poligon",
      "success"
    );
  };

  // Undo last drawn point
  const handleUndoDraftPoint = () => {
    if (draftPoints.length === 0) return;
    const updated = draftPoints.slice(0, -1);
    setDraftPoints(updated);

    if (drawMode === "point") {
      setDraftGeometry(null);
    } else if (drawMode === "linestring") {
      if (updated.length >= 2) {
        setDraftGeometry({
          type: "LineString",
          coordinates: updated.map(([lat, lng]) => [lng, lat]),
        });
      } else {
        setDraftGeometry(null);
      }
    } else if (drawMode === "polygon") {
      if (updated.length >= 3) {
        const ring = updated.map(([lat, lng]) => [lng, lat]);
        ring.push([updated[0][1], updated[0][0]]);
        setDraftGeometry({
          type: "Polygon",
          coordinates: [ring],
        });
      } else {
        setDraftGeometry(null);
      }
    }
  };

  // Start Edit Existing Feature
  const handleStartEdit = (feature: SpatialFeature) => {
    setEditingFeature(feature);
    setName(feature.name || "");
    setGroupName(isStandaloneGroup(feature.group_name) ? "Tanpa Grup" : (feature.group_name || "Tanpa Grup"));
    setCategory(feature.category || "");
    setColor(feature.color || "#10b981");
    setDescription(feature.description || "");
    setDraftGeometry(feature.geom_geojson || feature.geojson || null);
    setDrawMode("none");
    setDraftPoints([]);
    setActiveTab("draw");
    setFocusedFeatureId(feature.id);
  };

  // Cancel Edit
  const handleCancelEdit = () => {
    setEditingFeature(null);
    setName("");
    setGroupName(selectedGroup && !isStandaloneGroup(selectedGroup) ? selectedGroup : "Tanpa Grup");
    setCustomGroupInForm("");
    setDescription("");
    setColor("#10b981");
    setCategory("");
    resetDrawing();
    setActiveTab("list");
  };

  // Save (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Nama objek wajib diisi", "error");
      return;
    }

    let finalGroup = (customGroupInForm.trim() || groupName.trim()) || "Tanpa Grup";
    if (finalGroup === "__new__") {
      finalGroup = customGroupInForm.trim() || "Tanpa Grup";
    }
    if (isStandaloneGroup(finalGroup)) {
      finalGroup = "Tanpa Grup";
    } else if (customGroupInForm.trim()) {
      handleAddCustomGroup(customGroupInForm.trim());
    }

    const finalCategory = category.trim() || "Umum";
    if (category.trim()) {
      handleAddCategory(category.trim());
    }

    // For create mode, geometry is required
    if (!editingFeature && (!draftGeometry || !draftGeometry.coordinates)) {
      showToast("Harap gambar objek (titik, garis, atau poligon) di peta terlebih dahulu", "error");
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingFeature) {
        // UPDATE
        const payload: Record<string, unknown> = {
          name: name.trim(),
          group_name: finalGroup,
          category: finalCategory,
          color,
          description: description.trim(),
        };

        if (draftGeometry) {
          payload.geojson = draftGeometry;
          payload.type = draftGeometry.type;
        }

        const res = await fetch(`/api/spatial-crud/${editingFeature.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.status === "success") {
          showToast(
            isStandaloneGroup(finalGroup)
              ? `Objek "${name}" diperbarui sebagai data mandiri!`
              : `Objek "${name}" berhasil diperbarui ke grup "${finalGroup}"!`,
            "success"
          );
          handleCancelEdit();
          fetchFeatures();
          if (selectedGroup) {
            setSelectedGroup(finalGroup);
          } else {
            setSelectedGroup(null);
          }
          setActiveTab("list");
        } else {
          showToast(data.message || "Gagal memperbarui objek", "error");
        }
      } else {
        // CREATE
        if (!draftGeometry) {
          showToast("Harap gambar objek (titik, garis, atau poligon) di peta terlebih dahulu", "error");
          return;
        }

        const payload = {
          name: name.trim(),
          group_name: finalGroup,
          type: draftGeometry.type,
          category: finalCategory,
          color,
          description: description.trim(),
          geojson: draftGeometry,
          properties: {},
        };

        const res = await fetch("/api/spatial-crud", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.status === "success") {
          showToast(
            isStandaloneGroup(finalGroup)
              ? `Objek "${name}" berhasil disimpan secara mandiri (tanpa grup)!`
              : `Objek "${name}" disimpan ke grup "${finalGroup}"!`,
            "success"
          );
          handleCancelEdit();
          fetchFeatures();
          if (selectedGroup) {
            setSelectedGroup(finalGroup);
          } else {
            setSelectedGroup(null);
          }
          setActiveTab("list");
        } else {
          showToast(data.message || "Gagal menyimpan objek", "error");
        }
      }
    } catch (err) {
      console.error("Submit error:", err);
      showToast("Terjadi kesalahan jaringan", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/spatial-crud/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`Objek "${deleteTarget.name}" berhasil dihapus`, "success");
        setDeleteTarget(null);
        setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
        fetchFeatures();
      } else {
        showToast(data.message || "Gagal menghapus objek", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Gagal menghapus objek", "error");
    }
  };

  // Multi-Select Toggle
  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };


  // Batch Regroup Action
  const handleConfirmBatchRegroup = async () => {
    const target = regroupCustomInput.trim() || regroupTargetGroup.trim() || "Utama";
    if (!target) return;
    if (selectedIds.length === 0) return;

    try {
      setIsSubmitting(true);
      const res = await fetch("/api/spatial-crud/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "regroup",
          ids: selectedIds,
          targetGroup: target,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message || `Berhasil memindahkan data ke grup "${target}"`, "success");
        handleAddCustomGroup(target);
        setIsRegroupModalOpen(false);
        setRegroupCustomInput("");
        setSelectedIds([]);
        fetchFeatures();
      } else {
        showToast(data.message || "Gagal memindahkan data", "error");
      }
    } catch (err) {
      console.error("Batch regroup error:", err);
      showToast("Gagal memproses penggabungan grup", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Single Move Action
  const handleConfirmSingleMove = async (newGroup: string) => {
    if (!singleMoveTarget) return;
    try {
      const res = await fetch(`/api/spatial-crud/${singleMoveTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: singleMoveTarget.name,
          group_name: newGroup,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(`"${singleMoveTarget.name}" dipindahkan ke grup "${newGroup}"`, "success");
        setSingleMoveTarget(null);
        fetchFeatures();
      } else {
        showToast(data.message || "Gagal memindahkan grup", "error");
      }
    } catch (err) {
      console.error("Single move error:", err);
      showToast("Terjadi kesalahan saat memindahkan grup", "error");
    }
  };

  // Batch Delete Action
  const handleConfirmBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/spatial-crud/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          ids: selectedIds,
        }),
      });
      const data = await res.json();
      if (data.status === "success") {
        showToast(data.message || `Berhasil menghapus ${selectedIds.length} objek`, "success");
        setIsBatchDeleteModalOpen(false);
        setSelectedIds([]);
        fetchFeatures();
      } else {
        showToast(data.message || "Gagal menghapus batch", "error");
      }
    } catch (err) {
      console.error("Batch delete error:", err);
      showToast("Gagal menghapus objek terpilih", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create New Group Modal submit
  const handleCreateNewGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newGroupNameInput.trim();
    if (!trimmed) {
      showToast("Nama grup tidak boleh kosong", "error");
      return;
    }
    handleAddCustomGroup(trimmed);
    setActiveGroup(trimmed);
    setGroupName(trimmed);
    setSelectedGroup(null);
    setActiveTab("list");
    setIsNewGroupModalOpen(false);
    setNewGroupNameInput("");
    showToast(`Grup baru "${trimmed}" berhasil ditambahkan!`, "success");

    // Simpan permanen ke PostgreSQL database
    try {
      await fetch("/api/spatial-crud/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      fetchFeatures();
    } catch (err) {
      console.error("Gagal menyimpan grup ke DB:", err);
    }
  };

  // Preview Markdown Documentation
  const handleOpenMdPreview = async () => {
    try {
      setIsLoadingMdPreview(true);
      setPreviewMdModalOpen(true);
      const url =
        activeGroup !== "Semua"
          ? `/api/spatial-crud/export?format=md&group=${encodeURIComponent(activeGroup)}`
          : `/api/spatial-crud/export?format=md`;
      const res = await fetch(url);
      const text = await res.text();
      setMdPreviewContent(text);
    } catch (err) {
      console.error("Fetch MD preview error:", err);
      setMdPreviewContent("Gagal memuat pratinjau dokumen informasi spasial.");
    } finally {
      setIsLoadingMdPreview(false);
    }
  };

  // File Upload Handling (Shapefile .zip or GeoJSON)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadProgress(`Mengunggah dan memproses berkas "${file.name}"...`);
      const res = await fetch("/api/spatial-crud/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.status === "success") {
        showToast(data.message || `Berhasil mengimpor data dari ${file.name}`, "success");
        fetchFeatures();
        setActiveTab("list");
      } else {
        showToast(data.message || "Gagal mengimpor berkas", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Terjadi kesalahan saat mengunggah berkas", "error");
    } finally {
      setUploadProgress(null);
      e.target.value = "";
    }
  };

  // Features passed to Leaflet Map
  const mapFeatures = features;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
          }`}
        >
          {toast.type === "success" ? <Check className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Body with Side-Panel & Map */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
        {/* ===================== SIDE PANEL ===================== */}
        <aside
          className={`h-full flex flex-col bg-card/95 backdrop-blur-md border-r border-border/80 z-20 shadow-xl transition-all duration-300 ease-in-out shrink-0 ${
            isSidePanelOpen
              ? "w-full md:w-90 lg:w-95 xl:w-100"
              : "w-0 md:w-0 overflow-hidden border-r-0"
          }`}
        >
          {/* TOP OF SIDE PANEL: Kembali ke Beranda & Header info */}
          <div className="p-3.5 border-b border-border/80 bg-muted/20 flex flex-col gap-2.5">
            {/* Direct Link: Tombol Kembali ke Halaman Depan */}
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card hover:bg-secondary text-foreground text-xs font-semibold transition-all border border-border shadow-xs group"
                title="Kembali ke Dashboard Utama"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-primary transition-transform group-hover:-translate-x-1" />
                <span>Beranda</span>
              </Link>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsSidePanelOpen(false)}
                  className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground md:flex hidden"
                  title="Tutup Panel Samping"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Title Header */}
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-primary shrink-0 shadow-2xs">
                  <MapIcon className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight text-foreground leading-tight">
                    CRUD MAPS
                  </h1>
                </div>
              </div>
            </div>

            {/* QUICK BASEMAP COMBOBOX SELECTOR */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-muted-foreground flex items-center justify-between px-0.5">
                <span>Peta Dasar</span>
              </label>
              <BasemapCombobox
                value={activeBasemapId}
                onChange={setActiveBasemapId}
              />
            </div>

            {/* Navigation Tabs (3 Tabs: Daftar, Tambah Data, Berkas) */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-secondary rounded-full border border-border text-xs font-semibold">
              <button
                onClick={() => {
                  if (editingFeature) handleCancelEdit();
                  setActiveTab("list");
                }}
                className={`py-1.5 px-2 rounded-full transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  activeTab === "list"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Daftar Grup & Objek"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">Daftar</span>
              </button>

              <button
                onClick={() => {
                  if (!editingFeature) {
                    if (!selectedGroup || isStandaloneGroup(selectedGroup)) {
                      setGroupName("Tanpa Grup");
                    } else {
                      setGroupName(selectedGroup);
                    }
                  }
                  setActiveTab("draw");
                }}
                className={`py-1.5 px-2 rounded-full transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  activeTab === "draw"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Tambah Data Spasial Baru"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">{editingFeature ? "Edit Data" : "Tambah Data"}</span>
              </button>

              <button
                onClick={() => {
                  if (editingFeature) handleCancelEdit();
                  setActiveTab("io");
                }}
                className={`py-1.5 px-2 rounded-full transition-all flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer ${
                  activeTab === "io"
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Impor & Ekspor Berkas GIS"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[11px]">Berkas</span>
              </button>
            </div>
          </div>

          {/* SIDE PANEL CONTENT SCROLL AREA */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {/* ================= TAB 1: LIST / DAFTAR GRUP ================= */}
            {activeTab === "list" && (
              <div className="space-y-3">
                {selectedGroup ? (
                  /* ================= DETAIL VIEW UNTUK GRUP YANG DIPILIH ================= */
                  <div className="space-y-3">
                    {/* Header Navigasi Grup */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/80">
                      <button
                        type="button"
                        onClick={() => setSelectedGroup(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer"
                        title="Kembali ke Daftar Semua Grup"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Daftar</span>
                      </button>

                      {!isStandaloneGroup(selectedGroup) && (
                        <GroupActionMenu
                          groupName={selectedGroup}
                          onRename={handleOpenRename}
                          onDelete={(grp) => {
                            handleOpenDeleteGroup(grp);
                          }}
                        />
                      )}
                    </div>

                    {/* Kartu Ringkasan Grup & Tombol Tambah Data */}
                    <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center shrink-0 shadow-2xs">
                          {isStandaloneGroup(selectedGroup) ? (
                            <Globe2 className="w-4 h-4 text-inherit" />
                          ) : (
                            <Folder className="w-4 h-4 text-inherit" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {isStandaloneGroup(selectedGroup) ? "Data Mandiri (Tanpa Grup)" : selectedGroup}
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            {isStandaloneGroup(selectedGroup)
                              ? standaloneFeatures.length === 0
                                ? "Daftar kosong • Belum ada data mandiri"
                                : `${standaloneFeatures.length} Objek Spasial`
                              : features.filter((f) => (f.group_name || "").toLowerCase() === selectedGroup.toLowerCase()).length === 0
                              ? "Daftar kosong • Belum ada data"
                              : `${features.filter((f) => (f.group_name || "").toLowerCase() === selectedGroup.toLowerCase()).length} Objek Spasial`}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingFeature(null);
                          setGroupName(isStandaloneGroup(selectedGroup) ? "Tanpa Grup" : selectedGroup);
                          setActiveGroup(isStandaloneGroup(selectedGroup) ? "Semua" : selectedGroup);
                          setActiveTab("draw");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground text-xs font-medium transition-all shadow-xs cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Data</span>
                      </button>
                    </div>

                    {/* Daftar Objek dalam Grup ini */}
                    {(() => {
                      const groupFeatures = isStandaloneGroup(selectedGroup)
                        ? standaloneFeatures
                        : features.filter(
                            (f) => (f.group_name || "").toLowerCase() === selectedGroup.toLowerCase()
                          );

                      if (groupFeatures.length === 0) {
                        return (
                          <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-dashed border-border p-6 space-y-3.5 shadow-2xs">
                            <div className="w-12 h-12 mx-auto rounded-lg bg-secondary text-primary border border-border flex items-center justify-center shadow-xs">
                              {isStandaloneGroup(selectedGroup) ? (
                                <Globe2 className="w-6 h-6" />
                              ) : (
                                <Folder className="w-6 h-6" />
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-foreground">Daftar Kosong</p>
                              <p className="text-[11px] mt-1 text-muted-foreground max-w-xs mx-auto">
                                {isStandaloneGroup(selectedGroup)
                                  ? "Belum ada data spasial mandiri. Silakan klik tombol '+ Tambah Data' di atas untuk membuat data baru tanpa grup."
                                  : `Belum ada data di grup "${selectedGroup}". Silakan klik tombol '+ Tambah Data' di atas untuk membuat data spasial baru.`}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          <div className="text-[10px] font-semibold text-muted-foreground pb-0.5 flex items-center justify-between">
                            <span>Objek di grup &quot;{selectedGroup}&quot;:</span>
                            <span>{groupFeatures.length} objek</span>
                          </div>
                          {groupFeatures.map((feat) => {
                            const isPoint = (feat.type || "").toLowerCase().includes("point");
                            const isLine = (feat.type || "").toLowerCase().includes("line");
                            const isSelected = selectedIds.includes(feat.id);

                            return (
                              <div
                                key={feat.id}
                                className={`p-2.5 rounded-lg border transition-all duration-150 bg-card hover:border-primary/40 ${
                                  isSelected
                                    ? "border-primary ring-1 ring-primary/40 bg-primary/5"
                                    : focusedFeatureId === feat.id
                                    ? "border-primary/80 ring-1 ring-primary/20"
                                    : "border-border/70"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handleToggleSelect(feat.id)}
                                      className="shrink-0"
                                    />
                                    <span
                                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                      style={{ backgroundColor: feat.color || "#10b981" }}
                                    />
                                    <h4 className="font-bold text-xs text-foreground truncate">
                                      {feat.name}
                                    </h4>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <span
                                      className={`text-[9px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                                        isPoint
                                          ? "bg-red-500/15 text-red-600 dark:text-red-400"
                                          : isLine
                                          ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                                          : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      }`}
                                    >
                                      {feat.type}
                                    </span>

                                    <button
                                      onClick={() => setFocusedFeatureId(feat.id)}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted hover:bg-primary/15 hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Pusatkan di Peta"
                                    >
                                      <MapPin className="w-3 h-3" />
                                      <span>Fokus</span>
                                    </button>

                                    <button
                                      onClick={() => handleStartEdit(feat)}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Edit Objek"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>

                                    <button
                                      onClick={() => setDeleteTarget(feat)}
                                      className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Hapus Objek"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Hapus</span>
                                    </button>
                                  </div>
                                </div>

                                {feat.description && (
                                  <p className="text-[10px] text-muted-foreground mt-1 truncate pl-4.5">
                                    {feat.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  /* ================= DAFTAR SEMUA GRUP & DATA ================= */
                  <div className="space-y-3">
                    {/* TOMBOL AKSI: TAMBAH DATA (MANDIRI/GRUP) & TAMBAH GRUP */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingFeature(null);
                          setGroupName("Tanpa Grup");
                          setSelectedGroup(null);
                          setActiveTab("draw");
                        }}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-primary hover:opacity-90 active:scale-[0.99] text-primary-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        title="Tambah Data Spasial Baru Langsung"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Data</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsNewGroupModalOpen(true)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg bg-card hover:bg-secondary border border-border text-foreground text-xs font-semibold transition-all shadow-xs cursor-pointer"
                        title="Buat Grup Baru"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Tambah Grup</span>
                      </button>
                    </div>

                    {/* DAFTAR GRUP & DATA MANDIRI */}
                    {allGroups.length === 0 && standaloneFeatures.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground bg-card rounded-lg border border-dashed border-border p-6 space-y-3.5 shadow-2xs">
                        <div className="w-12 h-12 mx-auto rounded-lg bg-secondary text-primary border border-border flex items-center justify-center shadow-xs">
                          <Layers className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Belum ada data atau grup</p>
                          <p className="text-[11px] mt-1 text-muted-foreground max-w-xs mx-auto">
                            Silakan klik tombol &apos;+ Tambah Data&apos; di atas untuk membuat data mandiri, atau &apos;+ Tambah Grup&apos; untuk membuat grup baru.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {/* KARTU DATA MANDIRI / TANPA GRUP */}
                        {standaloneFeatures.length > 0 && (
                          <div
                            onClick={() => handleOpenGroupDetail("Tanpa Grup")}
                            className="rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all shadow-2xs cursor-pointer group p-3.5 flex items-center justify-between gap-3"
                            title="Buka daftar objek spasial mandiri (tanpa grup)"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center group-hover:scale-105 group-hover:border-primary group-hover:bg-primary/20 transition-all shrink-0 shadow-2xs">
                                <Globe2 className="w-4 h-4 text-inherit" />
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                  Data Mandiri (Tanpa Grup)
                                </h3>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {standaloneFeatures.length} Objek Spasial
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        )}

                        {/* KARTU DAFTAR GRUP PENGGUNA */}
                        {allGroups.map((grp) => {
                          const groupFeatures = features.filter(
                            (f) => (f.group_name || "").toLowerCase() === grp.toLowerCase()
                          );
                          const count = groupFeatures.length;

                          return (
                            <div
                              key={grp}
                              onClick={() => handleOpenGroupDetail(grp)}
                              className="rounded-lg border border-border bg-card hover:border-primary hover:shadow-md transition-all shadow-2xs cursor-pointer group p-3.5 flex items-center justify-between gap-3"
                              title={`Buka daftar grup "${grp}"`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-lg bg-secondary border border-border text-primary flex items-center justify-center group-hover:scale-105 group-hover:border-primary group-hover:bg-primary/20 transition-all shrink-0 shadow-2xs">
                                  <Folder className="w-4 h-4 text-inherit" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors truncate">
                                    {grp}
                                  </h3>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {count === 0 ? "Belum ada data • Tekan untuk tambah" : `${count} Objek Spasial`}
                                  </p>
                                </div>
                              </div>

                              {/* Tombol Aksi di Kanan */}
                              <div
                                className="flex items-center gap-1.5 shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <GroupActionMenu
                                  groupName={grp}
                                  onRename={handleOpenRename}
                                  onDelete={handleOpenDeleteGroup}
                                />
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= TAB 2: DRAW & CREATE / EDIT ================= */}
            {activeTab === "draw" && (
              <form onSubmit={handleSubmitForm} className="space-y-3.5">
                {editingFeature ? (
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 block">
                        Sedang Mengedit: {editingFeature.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Tipe: {editingFeature.type} {editingFeature.group_name ? `(Grup: ${editingFeature.group_name})` : ""}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold px-2 py-1 rounded-md bg-background border border-border cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Tombol Navigasi / Status Grup */}
                    <div className="flex items-center justify-between gap-2 pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleCancelEdit();
                          setActiveTab("list");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer"
                        title="Kembali ke Daftar"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Daftar</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {isStandaloneGroup(groupName) ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary text-foreground text-[10px] font-medium border border-border">
                            🌐 Data Mandiri (Tanpa Grup)
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            Grup: <strong className="text-foreground font-semibold">{groupName}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tool Selector for Drawing */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground flex items-center justify-between">
                        <span>1. Pilih Tipe Objek yang Ingin Digambar</span>
                        {drawMode !== "none" && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                            ● Mode Gambar Aktif
                          </span>
                        )}
                      </label>

                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartDraw("point")}
                          className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                            drawMode === "point"
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:bg-muted/60 border-border text-foreground"
                          }`}
                        >
                          <MapPin className="w-5 h-5 text-red-500" />
                          <span className="text-xs font-bold">Titik (Point)</span>
                          <span className="text-[9px] opacity-75">1 Titik Lokasi</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartDraw("linestring")}
                          className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                            drawMode === "linestring"
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:bg-muted/60 border-border text-foreground"
                          }`}
                        >
                          <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M4 19L10 12L14 16L20 5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <span className="text-xs font-bold">Garis (Polyline)</span>
                          <span className="text-[9px] opacity-75">Rute / Jalan</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleStartDraw("polygon")}
                          className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                            drawMode === "polygon"
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "bg-background hover:bg-muted/60 border-border text-foreground"
                          }`}
                        >
                          <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polygon points="12 2 22 8.5 18 20 6 20 2 8.5" strokeLinejoin="round" />
                          </svg>
                          <span className="text-xs font-bold">Area (Polygon)</span>
                          <span className="text-[9px] opacity-75">Batas Wilayah</span>
                        </button>
                      </div>

                      {/* Drawing Instructions Alert */}
                      {drawMode !== "none" && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <strong className="text-primary">
                              {drawMode === "point"
                                ? "Klik 1 kali di peta"
                                : drawMode === "linestring"
                                ? "Klik titik-titik garis di peta"
                                : "Klik titik-titik sudut area di peta"}
                            </strong>
                            <span className="font-mono text-[11px] font-bold text-foreground">
                              {draftPoints.length} Titik
                            </span>
                          </div>

                          {draftPoints.length > 0 && (
                            <div className="flex items-center gap-2 pt-1 border-t border-primary/20">
                              <button
                                type="button"
                                onClick={handleUndoDraftPoint}
                                className="px-2.5 py-1 rounded-md bg-background hover:bg-muted text-[11px] font-semibold flex items-center gap-1 border border-border cursor-pointer"
                              >
                                <Undo2 className="w-3 h-3" />
                                Undo Titik
                              </button>
                              <button
                                type="button"
                                onClick={resetDrawing}
                                className="px-2.5 py-1 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-semibold cursor-pointer"
                              >
                                Reset Gambar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-3 pt-2 border-t border-border/80">
                  <label className="text-xs font-bold text-foreground block">
                    {editingFeature ? "Atribut Objek Spasial" : "2. Lengkapi Data & Atribut Objek"}
                  </label>

                  {/* Group Field (Integrated with Shadcn Field) */}
                  <Field>
                    <FieldLabel className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                      <span>Grup Data Spasial</span>
                      <button
                        type="button"
                        onClick={() => setIsNewGroupModalOpen(true)}
                        className="text-[10px] text-primary font-bold hover:underline cursor-pointer"
                      >
                        + Tambah Grup Baru
                      </button>
                    </FieldLabel>
                    <div className="space-y-1.5">
                      <select
                        value={isStandaloneGroup(groupName) ? "Tanpa Grup" : groupName}
                        onChange={(e) => {
                          setGroupName(e.target.value);
                          if (e.target.value !== "__new__") {
                            setCustomGroupInForm("");
                          }
                        }}
                        className="w-full px-3 py-2 bg-background rounded-lg border border-border text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 font-medium cursor-pointer"
                      >
                        <option value="Tanpa Grup">🌐 Tanpa Grup (Data Mandiri / Sendiri)</option>
                        {allGroups.map((g) => (
                          <option key={g} value={g}>
                            📁 Grup: {g}
                          </option>
                        ))}
                        <option value="__new__">+ Buat Nama Grup Baru...</option>
                      </select>

                      {groupName === "__new__" && (
                        <input
                          type="text"
                          required
                          placeholder="Ketik nama grup baru..."
                          value={customGroupInForm}
                          onChange={(e) => setCustomGroupInForm(e.target.value)}
                          className="w-full px-3 py-2 bg-background rounded-lg border border-primary/50 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 font-semibold text-primary animate-in fade-in-0 duration-150"
                        />
                      )}
                    </div>
                    <FieldDescription className="text-[10px] text-muted-foreground">
                      {isStandaloneGroup(groupName)
                        ? "Objek ini akan disimpan secara mandiri tanpa grup."
                        : groupName === "__new__"
                        ? "Grup baru akan dibuat dan objek ini langsung masuk ke dalamnya."
                        : `Objek ini akan masuk ke dalam grup "${groupName}".`}
                    </FieldDescription>
                  </Field>

                  {/* Name Input */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Nama Objek <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Titik Pantau A / Koridor 1"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-background rounded-lg border border-border text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 transition-all font-medium"
                    />
                  </div>

                  {/* Category Combobox */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">
                        Kategori Objek <span className="text-[10px] font-normal text-muted-foreground/80">(Opsional)</span>
                      </label>
                      {category && (
                        <button
                          type="button"
                          onClick={() => setCategory("")}
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors hover:underline"
                        >
                          Kosongkan
                        </button>
                      )}
                    </div>
                    <CategoryCombobox
                      value={category}
                      onChange={setCategory}
                      presets={allCategories}
                      onAddCategory={handleAddCategory}
                      placeholder="Pilih atau ketik kategori baru (opsional)..."
                    />
                  </div>

                  {/* Color Palette Picker */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Warna Penanda di Peta
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColor(c.hex)}
                          style={{ backgroundColor: c.hex }}
                          className={`w-6 h-6 rounded-full transition-transform ${
                            color === c.hex
                              ? "ring-2 ring-foreground scale-110 shadow-sm"
                              : "opacity-80 hover:opacity-100"
                          }`}
                          title={c.name}
                        />
                      ))}
                      <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-border p-0.5 cursor-pointer bg-transparent"
                        title="Pilih warna bebas"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                      Deskripsi / Catatan Tambahan
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Informasi detail, fasilitas, atau keterangan..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-2 bg-background rounded-lg border border-border text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting || (!editingFeature && !draftGeometry)}
                      className="w-full rounded-lg text-xs font-medium py-2.5 shadow-md flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyimpan ke Database...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>
                            {editingFeature ? "Perbarui Objek di Database" : "Simpan ke Database"}
                          </span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* ================= TAB 3: BERKAS (IMPORT & EXPORT) ================= */}
            {activeTab === "io" && (
              <div className="space-y-4">
                {/* Import Section */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>Unggah Berkas Spasial</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Unggah berkas <strong>ESRI Shapefile (.zip)</strong> atau <strong>GeoJSON (.geojson / .json)</strong>.
                  </p>

                  <div className="p-4 border-2 border-dashed border-border/80 rounded-lg bg-background/50 hover:bg-muted/30 transition-all text-center relative group">
                    <input
                      type="file"
                      accept=".zip,.geojson,.json"
                      onChange={handleFileUpload}
                      disabled={!!uploadProgress}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        Pilih berkas Shapefile (.zip) atau GeoJSON
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Format didukung: Point, LineString, Polygon
                      </span>
                    </div>
                  </div>

                  {uploadProgress && (
                    <div className="p-3 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs flex items-center gap-2 animate-pulse">
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>{uploadProgress}</span>
                    </div>
                  )}
                </div>

                {/* ================= EXPORT SECTION WITH .MD ================= */}
                <div className="space-y-3 pt-3 border-t border-border/80">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-primary" />
                      <span>Unduh & Ekspor Data Spasial</span>
                    </h3>
                    <span className="text-[10px] font-mono font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      Termasuk File .md
                    </span>
                  </div>

                  {/* PROMINENT CARD: Active Group Package Export */}
                  <div className="p-3.5 rounded-lg bg-linear-to-br from-primary/10 via-primary/5 to-background border border-primary/30 shadow-sm space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <FolderArchive className="w-4 h-4 text-primary" />
                          <span>
                            Paket Komplit:{" "}
                            {activeGroup === "Semua" ? "Semua Grup" : `Grup "${activeGroup}"`}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Berisi berkas spasial lengkap (GeoJSON, KML, Shapefile) dan{" "}
                          <strong>1 file INFORMASI_DATA_SPASIAL.md</strong> berisi rangkuman metadata, koordinat, dan panduan.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={`/api/spatial-crud/export?format=zip${
                          activeGroup !== "Semua" ? `&group=${encodeURIComponent(activeGroup)}` : ""
                        }`}
                        download={`${activeGroup.toLowerCase()}_lengkap.zip`}
                        className="py-2 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium shadow-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh .ZIP + .MD</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleOpenMdPreview}
                        className="py-2 px-3 rounded-lg bg-background hover:bg-muted text-foreground border border-border text-xs font-medium shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-primary" />
                        <span>Lihat File .MD</span>
                      </button>
                    </div>
                  </div>

                  {/* Specific Single Formats */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-bold text-muted-foreground">
                      Unduh Format Satuan:
                    </div>

                    {/* Shapefile (.zip) */}
                    <a
                      href={`/api/spatial-crud/export?format=shp${
                        activeGroup !== "Semua" ? `&group=${encodeURIComponent(activeGroup)}` : ""
                      }`}
                      download="shapefile_layers.zip"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-muted/40 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <FolderArchive className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            ESRI Shapefile (.zip)
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Format standar GIS (.shp, .shx, .dbf, .prj)
                          </div>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all" />
                    </a>

                    {/* GeoJSON (.geojson) */}
                    <a
                      href={`/api/spatial-crud/export?format=geojson${
                        activeGroup !== "Semua" ? `&group=${encodeURIComponent(activeGroup)}` : ""
                      }`}
                      download="data.geojson"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-muted/40 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                          <FileCode className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            GeoJSON (.geojson)
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Format web modern untuk Leaflet & Mapbox
                          </div>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all" />
                    </a>

                    {/* Google Earth (.kml) */}
                    <a
                      href={`/api/spatial-crud/export?format=kml${
                        activeGroup !== "Semua" ? `&group=${encodeURIComponent(activeGroup)}` : ""
                      }`}
                      download="data.kml"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-muted/40 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                          <Globe2 className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            Google Earth (.kml)
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Kompatibel dengan Google Earth & GPS viewer
                          </div>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all" />
                    </a>

                    {/* Markdown file only (.md) */}
                    <a
                      href={`/api/spatial-crud/export?format=md${
                        activeGroup !== "Semua" ? `&group=${encodeURIComponent(activeGroup)}` : ""
                      }`}
                      download="INFORMASI_DATA_SPASIAL.md"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border hover:border-primary/50 hover:bg-muted/40 transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            Informasi Metadata (.md)
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            Dokumentasi data, statistik, koordinat & tabel fitur
                          </div>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-all" />
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Floating Toggle Button to Reopen Side Panel (if collapsed) */}
        {!isSidePanelOpen && (
          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="absolute top-4 left-4 z-30 p-2.5 rounded-lg bg-card/90 backdrop-blur-md border border-border shadow-lg text-foreground hover:bg-muted transition-all flex items-center gap-2 font-semibold text-xs cursor-pointer"
            title="Buka Panel Samping"
          >
            <ChevronRight className="w-4 h-4 text-primary" />
            <span>Buka Panel CRUD</span>
          </button>
        )}

        {/* ===================== MAP SECTION ===================== */}
        <main className="flex-1 h-full w-full relative overflow-hidden bg-muted/10">
          {/* Interactive Leaflet Map */}
          <LeafletSpatialCrudMap
            features={mapFeatures}
            activeBasemapId={activeBasemapId}
            drawMode={drawMode}
            draftPoints={draftPoints}
            onDraftPointsChange={setDraftPoints}
            onDraftGeometryChange={setDraftGeometry}
            onSelectFeature={(feat) => {
              setFocusedFeatureId(feat.id);
            }}
            onEditFeature={handleStartEdit}
            onDeleteFeature={(feat) => setDeleteTarget(feat)}
            focusedFeatureId={focusedFeatureId}
            activeColor={color}
            className="w-full h-full"
          />

          {/* Floating Live Drawing Action Bar (when drawing is active) */}
          {drawMode !== "none" && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-card/95 backdrop-blur-md px-4 py-2.5 rounded-lg border border-primary/40 shadow-2xl animate-in slide-in-from-bottom-3 duration-200">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="text-xs">
                <span className="font-bold text-foreground">
                  Menggambar:{" "}
                  {drawMode === "point"
                    ? "Titik"
                    : drawMode === "linestring"
                    ? "Garis"
                    : "Poligon"}
                </span>
                <span className="text-muted-foreground ml-1.5">
                  ({draftPoints.length} titik)
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {draftPoints.length > 0 && (
                  <button
                    onClick={handleUndoDraftPoint}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1 cursor-pointer"
                  >
                    <Undo2 className="w-3 h-3" />
                    Undo
                  </button>
                )}
                <button
                  onClick={resetDrawing}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer"
                >
                  Batal
                </button>
                {draftGeometry && (
                  <button
                    onClick={() => {
                      if (!isSidePanelOpen) setIsSidePanelOpen(true);
                      setActiveTab("draw");
                    }}
                    className="px-3 py-1 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 shadow-xs cursor-pointer"
                  >
                    Selesai & Simpan ➔
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ================= FLOATING BATCH ACTION BAR (FITUR SELECT) ================= */}
          {selectedIds.length > 0 && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 bg-card/95 backdrop-blur-md px-4 py-2.5 rounded-lg border border-border shadow-2xl animate-in slide-in-from-top-3 duration-200">
              <div className="flex items-center gap-2 pr-2 border-r border-border/80">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-xs font-bold text-foreground">
                  {selectedIds.length} Objek Dipilih
                </span>
              </div>

              {/* Action 1: Gabungkan / Pindahkan ke Grup */}
              <button
                onClick={() => {
                  setRegroupTargetGroup(activeGroup !== "Semua" ? activeGroup : "Utama");
                  setRegroupCustomInput("");
                  setIsRegroupModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium shadow-xs hover:opacity-90 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Gabungkan data yang lupa digrup menjadi 1"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Gabungkan ke Grup</span>
              </button>

              {/* Action 2: Ekspor Terpilih */}
              <a
                href={`/api/spatial-crud/export?format=zip&ids=${selectedIds.join(",")}`}
                download="ekspor_terpilih_lengkap.zip"
                className="px-3 py-1.5 rounded-md bg-background hover:bg-muted text-foreground border border-border text-xs font-medium shadow-2xs transition-all flex items-center gap-1.5"
                title="Ekspor item terpilih lengkap dengan file .md"
              >
                <Download className="w-3.5 h-3.5 text-primary" />
                <span>Ekspor (ZIP + MD)</span>
              </a>

              {/* Action 3: Hapus Terpilih */}
              <button
                onClick={() => setIsBatchDeleteModalOpen(true)}
                className="px-2.5 py-1.5 rounded-md bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium transition-all flex items-center gap-1 cursor-pointer"
                title="Hapus massal item terpilih"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>

              {/* Action 4: Batalkan Seleksi */}
              <button
                onClick={() => setSelectedIds([])}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                title="Batalkan Pilihan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: BUAT GRUP BARU ================= */}
      <Dialog open={isNewGroupModalOpen} onOpenChange={setIsNewGroupModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FolderPlus className="w-5 h-5 text-primary" />
              <span>Tambah Grup Baru</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan nama grup untuk mengelompokkan data spasial Anda.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateNewGroup} className="space-y-4 pt-1">
            <Field>
              <FieldLabel className="text-xs font-semibold">Nama Grup</FieldLabel>
              <input
                type="text"
                required
                autoFocus
                placeholder="Contoh: Titik Survey 1 / Batas Desa"
                value={newGroupNameInput}
                onChange={(e) => setNewGroupNameInput(e.target.value)}
                className="w-full px-3 py-2 bg-background rounded-lg border border-border text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 font-medium"
              />
            </Field>

            <DialogFooter className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewGroupModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="font-medium">
                Simpan Grup
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: GABUNGKAN / PINDAHKAN KE GRUP (BATCH REGROUP) ================= */}
      <Dialog open={isRegroupModalOpen} onOpenChange={setIsRegroupModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              <span>Gabungkan {selectedIds.length} Objek ke Grup</span>
            </DialogTitle>
            <DialogDescription>
              Pindahkan semua objek yang dipilih ke dalam satu grup agar data terorganisir rapi.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            <Field>
              <FieldLabel>Pilih Grup Tujuan</FieldLabel>
              <select
                value={regroupTargetGroup}
                onChange={(e) => {
                  setRegroupTargetGroup(e.target.value);
                  if (e.target.value !== "__new__") setRegroupCustomInput("");
                }}
                className="w-full px-3 py-2 bg-background rounded-lg border border-border text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 font-medium"
              >
                <option value="Tanpa Grup">🌐 Tanpa Grup (Mandiri)</option>
                {allGroups.map((g) => (
                  <option key={g} value={g}>
                    📁 {g}
                  </option>
                ))}
                <option value="__new__">+ Buat Grup Baru...</option>
              </select>
            </Field>

            {regroupTargetGroup === "__new__" && (
              <Field>
                <FieldLabel>Nama Grup Baru</FieldLabel>
                <input
                  type="text"
                  required
                  placeholder="Ketik nama grup baru..."
                  value={regroupCustomInput}
                  onChange={(e) => setRegroupCustomInput(e.target.value)}
                  className="w-full px-3 py-2 bg-background rounded-lg border border-primary/50 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary/40 font-semibold text-primary"
                />
              </Field>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsRegroupModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting || (regroupTargetGroup === "__new__" && !regroupCustomInput.trim())}
              onClick={handleConfirmBatchRegroup}
              className="font-bold"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Terapkan Pemindahan</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: PINDAH GRUP SATUAN ================= */}
      <Dialog open={!!singleMoveTarget} onOpenChange={(open) => !open && setSingleMoveTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-primary" />
              <span>Pindahkan Objek &quot;{singleMoveTarget?.name}&quot;</span>
            </DialogTitle>
            <DialogDescription>
              Pilih grup tujuan untuk objek ini (saat ini di grup:{" "}
              <strong>{isStandaloneGroup(singleMoveTarget?.group_name) ? "Tanpa Grup (Mandiri)" : singleMoveTarget?.group_name}</strong>):
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1 max-h-60 overflow-y-auto">
            <button
              onClick={() => handleConfirmSingleMove("Tanpa Grup")}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                isStandaloneGroup(singleMoveTarget?.group_name)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted text-foreground"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Globe2 className="w-4 h-4 text-primary" />
                <span>Tanpa Grup (Mandiri)</span>
              </div>
              {isStandaloneGroup(singleMoveTarget?.group_name) && (
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20">
                  Status Sekarang
                </span>
              )}
            </button>

            {allGroups.map((grp) => (
              <button
                key={grp}
                onClick={() => handleConfirmSingleMove(grp)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  singleMoveTarget?.group_name === grp
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted text-foreground"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="w-4 h-4 text-primary" />
                  <span>{grp}</span>
                </div>
                {singleMoveTarget?.group_name === grp && (
                  <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20">
                    Grup Sekarang
                  </span>
                )}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSingleMoveTarget(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: PRATINJAU FILE INFORMASI .MD ================= */}
      <Dialog open={previewMdModalOpen} onOpenChange={setPreviewMdModalOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Dokumen Informasi Spasial (.md)</span>
              </div>
              <a
                href={`/api/spatial-crud/export?format=md${
                  activeGroup !== "Semua" ? `&group=${encodeURIComponent(activeGroup)}` : ""
                }`}
                download="INFORMASI_DATA_SPASIAL.md"
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-1.5 shadow-xs hover:opacity-90"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File .MD</span>
              </a>
            </DialogTitle>
            <DialogDescription>
              File informasi ini otomatis dibuat dan disertakan dalam setiap paket ekspor ZIP.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 rounded-lg bg-muted/40 border border-border text-xs font-mono whitespace-pre-wrap leading-relaxed">
            {isLoadingMdPreview ? (
              <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span>Membuat pratinjau dokumen .md...</span>
              </div>
            ) : (
              mdPreviewContent
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPreviewMdModalOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: KONFIRMASI HAPUS SATUAN ================= */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Hapus Objek Spasial?"
        description={
          deleteTarget
            ? `Apakah Anda yakin ingin menghapus objek "${deleteTarget.name}" (${deleteTarget.type}) dari grup "${deleteTarget.group_name || "Utama"}"? Tindakan ini tidak dapat dibatalkan.`
            : ""
        }
        confirmText="Hapus Permanen"
        cancelText="Batal"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* ================= MODAL: KONFIRMASI HAPUS BATCH ================= */}
      <ConfirmModal
        isOpen={isBatchDeleteModalOpen}
        title={`Hapus ${selectedIds.length} Objek Terpilih?`}
        description={`Apakah Anda yakin ingin menghapus ${selectedIds.length} objek spasial yang dipilih sekaligus dari database PostgreSQL? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Semua Terpilih"
        cancelText="Batal"
        variant="destructive"
        onConfirm={handleConfirmBatchDelete}
        onClose={() => setIsBatchDeleteModalOpen(false)}
      />

      {/* ================= MODAL: UBAH NAMA GRUP ================= */}
      <Dialog open={!!renameTargetGroup} onOpenChange={(open) => !open && setRenameTargetGroup(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" />
              <span>Ubah Nama Grup</span>
            </DialogTitle>
            <DialogDescription>
              Ubah nama grup &quot;{renameTargetGroup}&quot;. Semua data spasial di dalam grup ini akan otomatis dialihkan ke nama baru.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConfirmRenameGroup} className="space-y-4 py-2">
            <Field>
              <FieldLabel>Nama Grup Baru</FieldLabel>
              <input
                type="text"
                value={renameNewNameInput}
                onChange={(e) => setRenameNewNameInput(e.target.value)}
                placeholder="Masukkan nama baru grup..."
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs focus:ring-1 focus:ring-primary/40 focus:outline-hidden"
                autoFocus
              />
            </Field>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setRenameTargetGroup(null)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-lg font-medium"
                disabled={!renameNewNameInput.trim() || renameNewNameInput.trim() === renameTargetGroup}
              >
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: KONFIRMASI HAPUS GRUP ================= */}
      <ConfirmModal
        isOpen={!!deleteTargetGroup}
        title="Hapus Grup Spasial?"
        description={
          deleteTargetGroup
            ? `Apakah Anda yakin ingin menghapus grup "${deleteTargetGroup}" beserta semua data spasial di dalamnya? Tindakan ini permanen dan tidak dapat dibatalkan.`
            : ""
        }
        confirmText="Hapus Grup Permanen"
        cancelText="Batal"
        variant="destructive"
        onConfirm={handleConfirmDeleteGroup}
        onClose={() => setDeleteTargetGroup(null)}
      />
    </div>
  );
}
