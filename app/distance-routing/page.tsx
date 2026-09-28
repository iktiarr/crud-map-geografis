"use client";

import * as React from "react";
import { Check, AlertTriangle, X } from "lucide-react";
import {
  calculateMultiPointRoadRoute,
  reverseGeocodeRoadName,
} from "@/lib/road-routing";

// Import Konfigurasi & Tipe Data
import { DEFAULT_ROUTE_CONFIG } from "./konfigurasi";
import {
  TraversedRoadRecord,
  WaypointItem,
  MultiPointRouteResult,
  TravelMode,
  LineStyle,
  ToastMessage,
} from "./tipe";

// Import Layanan API Backend Modul 5
import {
  ambilSemuaRuteDanFolder,
  simpanRuteBaru,
  updateKustomisasiRute,
  hapusRute,
  buatFolderBaru,
  ubahNamaFolder,
  hapusFolder,
} from "./layanan/api-rute";

// Import Komponen Tampilan (Bahasa Indonesia)
import { PanelSamping } from "./komponen/panel-samping";
import { DaftarFolder } from "./komponen/daftar-folder";
import { DaftarRuteFolder } from "./komponen/daftar-rute-folder";
import { TambahRute } from "./komponen/tambah-rute";
import { ModalFolder } from "./komponen/modal-folder";
import { ModalRute } from "./komponen/modal-rute";
import { PetaRute } from "./komponen/peta-rute";

export default function DistanceRoutingPage() {
  // State Tampilan & Navigasi Panel Samping
  const [isSidePanelOpen, setIsSidePanelOpen] = React.useState(true);
  const [folderSubTab, setFolderSubTab] = React.useState<"add-route" | "routes-list">("routes-list");

  // State Data Database
  const [routes, setRoutes] = React.useState<TraversedRoadRecord[]>([]);
  const [dbFolders, setDbFolders] = React.useState<string[]>([]);
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null);
  const [dbError, setDbError] = React.useState<string | null>(null);

  // State Peta & Basemap
  const [activeBasemapId, setActiveBasemapId] = React.useState(DEFAULT_ROUTE_CONFIG.basemapId);
  const [focusedRouteId, setFocusedRouteId] = React.useState<number | null>(null);

  // State Waypoint & Kalkulasi Rute
  const [waypoints, setWaypoints] = React.useState<WaypointItem[]>([]);
  const travelMode: TravelMode = DEFAULT_ROUTE_CONFIG.travelMode;
  const [isCalculatingRoute, setIsCalculatingRoute] = React.useState(false);
  const [draftRouteData, setDraftRouteData] = React.useState<MultiPointRouteResult | null>(null);

  // State Kustomisasi Garis Rute
  const [customColor, setCustomColor] = React.useState(DEFAULT_ROUTE_CONFIG.color);
  const [customWeight, setCustomWeight] = React.useState(DEFAULT_ROUTE_CONFIG.weight);
  const customOpacity = DEFAULT_ROUTE_CONFIG.opacity;
  const [customLineStyle, setCustomLineStyle] = React.useState<LineStyle>(DEFAULT_ROUTE_CONFIG.lineStyle);
  const [targetFolder, setTargetFolder] = React.useState("Utama");
  const [routeName, setRouteName] = React.useState("Rute Baru");
  const routeCategory = DEFAULT_ROUTE_CONFIG.category;

  // State Aksi & Notifikasi Toast
  const [isSaving, setIsSaving] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState<ToastMessage | null>(null);

  // State Modal Folder
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = React.useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = React.useState("");
  const [renameTargetFolder, setRenameTargetFolder] = React.useState<string | null>(null);
  const [renameNewNameInput, setRenameNewNameInput] = React.useState("");
  const [deleteTargetFolder, setDeleteTargetFolder] = React.useState<string | null>(null);

  // State Modal Rute
  const [deleteTargetRouteId, setDeleteTargetRouteId] = React.useState<number | null>(null);
  const [isDeleteRouteModalOpen, setIsDeleteRouteModalOpen] = React.useState(false);
  const [editingRoute, setEditingRoute] = React.useState<TraversedRoadRecord | null>(null);
  const [isEditingRouteModalOpen, setIsEditingRouteModalOpen] = React.useState(false);

  // State Modal Tambah Rute Baru (Alur: Tambah nama folder -> Tambah nama rute -> Baru edit rute)
  const [isNewRouteModalOpen, setIsNewRouteModalOpen] = React.useState(false);
  const [newRouteNameInput, setNewRouteNameInput] = React.useState("");

  // Helper Notifikasi Toast
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Memuat Rute & Folder dari Database
  const fetchRoutesAndFolders = React.useCallback(async () => {
    setDbError(null);
    const { routes: fetchedRoutes, folderNames, errorMessage } = await ambilSemuaRuteDanFolder();
    if (errorMessage) {
      setDbError(errorMessage);
    }
    setRoutes(fetchedRoutes);
    setDbFolders(folderNames);
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    fetchRoutesAndFolders().catch((e) => {
      if (isMounted) console.error(e);
    });
    return () => {
      isMounted = false;
    };
  }, [fetchRoutesAndFolders]);

  // 2. Kalkulasi Rute Otomatis saat Waypoint Berubah
  React.useEffect(() => {
    if (waypoints.length < 2) {
      setDraftRouteData(null);
      return;
    }

    let isMounted = true;
    calculateMultiPointRoadRoute(waypoints, travelMode)
      .then((res) => {
        if (!isMounted) return;
        setDraftRouteData(res);
        setIsCalculatingRoute(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Gagal kalkulasi rute:", err);
        setIsCalculatingRoute(false);
      });

    return () => {
      isMounted = false;
    };
  }, [waypoints, travelMode]);

  // 3. Interaksi Klik Peta untuk Menambah Titik
  const handleMapClick = async (lat: number, lng: number) => {
    if (!selectedFolder || folderSubTab !== "add-route") return;

    setIsCalculatingRoute(true);
    const newId = `wp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const tempName = `Titik ${waypoints.length + 1}`;

    const newWp: WaypointItem = { id: newId, name: tempName, lat, lng };
    setWaypoints((prev) => [...prev, newWp]);

    const roadName = await reverseGeocodeRoadName(lat, lng);
    setWaypoints((prev) =>
      prev.map((p) => (p.id === newId ? { ...p, name: roadName } : p))
    );
  };

  const handleWaypointDragEnd = async (index: number, lat: number, lng: number) => {
    setIsCalculatingRoute(true);
    setWaypoints((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, lat, lng } : p))
    );

    const roadName = await reverseGeocodeRoadName(lat, lng);
    setWaypoints((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, name: roadName } : p))
    );
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (next.length < 2) setDraftRouteData(null);
      else setIsCalculatingRoute(true);
      return next;
    });
  };

  const handleResetWaypoints = () => {
    setWaypoints([]);
    setDraftRouteData(null);
    setRouteName("Rute Baru");
    showToast("Titik rute berhasil direset", "success");
  };

  const handleMoveWaypoint = (index: number, direction: "up" | "down") => {
    setWaypoints((prev) => {
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const clone = [...prev];
      const temp = clone[index];
      clone[index] = clone[targetIndex];
      clone[targetIndex] = temp;
      setIsCalculatingRoute(true);
      return clone;
    });
  };

  const handleReverseAllWaypoints = () => {
    setWaypoints((prev) => {
      const reversed = [...prev].reverse();
      setIsCalculatingRoute(true);
      return reversed;
    });
  };

  // 4. Operasi Buka & Tutup Folder
  const handleOpenFolder = (folderName: string) => {
    setSelectedFolder(folderName);
    setTargetFolder(folderName);
    setFolderSubTab("routes-list");
  };

  const handleBackToAllFolders = () => {
    setSelectedFolder(null);
    setFolderSubTab("routes-list");
    setWaypoints([]);
    setDraftRouteData(null);
    setRouteName("Rute Baru");
  };

  // 5. Simpan Rute Baru
  const handleSaveRoute = async () => {
    if (waypoints.length < 2 || !draftRouteData) {
      showToast("Tentukan minimal 2 titik jalan terlebih dahulu", "error");
      return;
    }

    setIsSaving(true);
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];

    const payload = {
      name: routeName.trim() || `${origin.name} ➔ ${destination.name}`,
      folder_name: targetFolder.trim() || "Utama",
      origin_name: origin.name || "Titik Asal",
      origin_lat: origin.lat,
      origin_lng: origin.lng,
      destination_name: destination.name || "Titik Tujuan",
      destination_lat: destination.lat,
      destination_lng: destination.lng,
      waypoints: waypoints.map((w) => ({ name: w.name, lat: w.lat, lng: w.lng })),
      distance_km: draftRouteData.distanceKm,
      duration_min: draftRouteData.durationMin,
      color: customColor,
      weight: customWeight,
      opacity: customOpacity,
      line_style: customLineStyle,
      travel_mode: travelMode,
      category: routeCategory,
      geojson: {
        type: "LineString",
        coordinates: draftRouteData.coordinates,
      },
    };

    const res = await simpanRuteBaru(payload);
    setIsSaving(false);

    if (res.success) {
      showToast(`Rute "${payload.name}" berhasil disimpan ke folder "${payload.folder_name}"!`, "success");
      await fetchRoutesAndFolders();
      setWaypoints([]);
      setDraftRouteData(null);
      setRouteName("Rute Baru");
      setFolderSubTab("routes-list");
    } else {
      showToast(res.message || "Gagal menyimpan rute jalan", "error");
    }
  };

  // 6. Operasi Folder (Buat, Ubah Nama, Hapus)
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderNameInput.trim();
    if (!trimmed) {
      showToast("Nama folder tidak boleh kosong", "error");
      return;
    }

    const res = await buatFolderBaru(trimmed);
    if (res.success) {
      showToast(`Folder "${trimmed}" berhasil dibuat!`, "success");
      setDbFolders((prev) => Array.from(new Set([...prev, trimmed])));
      setSelectedFolder(trimmed);
      setTargetFolder(trimmed);
      setFolderSubTab("routes-list");
      setIsNewFolderModalOpen(false);
      setNewFolderNameInput("");
    } else {
      showToast(res.message || "Gagal membuat folder", "error");
    }
  };

  const handleRenameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTargetFolder) return;
    const trimmed = renameNewNameInput.trim();
    if (!trimmed) {
      showToast("Nama folder tidak boleh kosong", "error");
      return;
    }

    const res = await ubahNamaFolder(renameTargetFolder, trimmed);
    if (res.success) {
      showToast(`Folder diubah menjadi "${trimmed}"`, "success");
      setDbFolders((prev) => prev.map((f) => (f === renameTargetFolder ? trimmed : f)));
      setRoutes((prev) =>
        prev.map((r) =>
          r.folder_name?.toLowerCase() === renameTargetFolder.toLowerCase()
            ? { ...r, folder_name: trimmed }
            : r
        )
      );
      if (selectedFolder === renameTargetFolder) setSelectedFolder(trimmed);
      if (targetFolder === renameTargetFolder) setTargetFolder(trimmed);
      setRenameTargetFolder(null);
      setRenameNewNameInput("");
    } else {
      showToast(res.message || "Gagal mengubah nama folder", "error");
    }
  };

  const handleConfirmDeleteFolder = async () => {
    if (!deleteTargetFolder) return;
    const folderToDelete = deleteTargetFolder;

    const res = await hapusFolder(folderToDelete);
    if (res.success) {
      showToast(`Folder "${folderToDelete}" berhasil dihapus`, "success");
      setDbFolders((prev) =>
        prev.filter((f) => f.toLowerCase() !== folderToDelete.toLowerCase())
      );
      if (selectedFolder?.toLowerCase() === folderToDelete.toLowerCase()) {
        setSelectedFolder(null);
        setFolderSubTab("routes-list");
      }
      if (targetFolder?.toLowerCase() === folderToDelete.toLowerCase()) {
        setTargetFolder("Utama");
      }
      setRoutes((prev) =>
        prev.map((r) =>
          (r.folder_name || "").toLowerCase() === folderToDelete.toLowerCase()
            ? { ...r, folder_name: "Tanpa Folder" }
            : r
        )
      );
      setDeleteTargetFolder(null);
    } else {
      showToast(res.message || "Gagal menghapus folder", "error");
    }
  };

  // 7. Operasi Rute (Hapus & Edit Kustomisasi)
  const handleConfirmDeleteRoute = async () => {
    if (!deleteTargetRouteId) return;
    const idToDelete = deleteTargetRouteId;

    const res = await hapusRute(idToDelete);
    if (res.success) {
      showToast("Rute jalan berhasil dihapus", "success");
      setRoutes((prev) => prev.filter((r) => r.id !== idToDelete));
      if (focusedRouteId === idToDelete) setFocusedRouteId(null);
      setIsDeleteRouteModalOpen(false);
      setDeleteTargetRouteId(null);
    } else {
      showToast(res.message || "Gagal menghapus rute", "error");
    }
  };

  const handleSaveRouteEdit = async () => {
    if (!editingRoute) return;

    const res = await updateKustomisasiRute(editingRoute.id, editingRoute);
    if (res.success) {
      showToast("Kustomisasi rute jalan berhasil diperbarui!", "success");
      setRoutes((prev) =>
        prev.map((r) => (r.id === editingRoute.id ? { ...r, ...editingRoute } : r))
      );
      setIsEditingRouteModalOpen(false);
      setEditingRoute(null);
    } else {
      showToast(res.message || "Gagal memperbarui rute", "error");
    }
  };

  // Alur Tambah Rute Baru: Tambah nama folder -> Tambah nama rute -> Baru edit rute tersebut
  const handleOpenNewRouteModal = () => {
    setNewRouteNameInput("");
    setIsNewRouteModalOpen(true);
  };

  const handleSubmitNewRoute = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newRouteNameInput.trim();
    if (!trimmed) {
      showToast("Nama rute tidak boleh kosong", "error");
      return;
    }
    setRouteName(trimmed);
    setWaypoints([]);
    setDraftRouteData(null);
    setIsNewRouteModalOpen(false);
    setFolderSubTab("add-route");
    showToast(`Mulai memetakan rute "${trimmed}". Silakan klik titik-titik pada peta.`, "success");
  };

  // 8. Filtered & Grouped Data
  const allFolderList = React.useMemo(() => {
    const set = new Set<string>();
    dbFolders.forEach((f) => {
      if (f && f.trim().toLowerCase() !== "tanpa folder") set.add(f.trim());
    });
    routes.forEach((r) => {
      if (r.folder_name && r.folder_name.trim().toLowerCase() !== "tanpa folder") {
        set.add(r.folder_name.trim());
      }
    });
    return Array.from(set);
  }, [dbFolders, routes]);

  const unassignedRoutes = React.useMemo(() => {
    return routes.filter(
      (r) => !r.folder_name || r.folder_name.trim().toLowerCase() === "tanpa folder"
    );
  }, [routes]);

  const filteredRoutes = React.useMemo(() => {
    if (selectedFolder) {
      if (selectedFolder.trim().toLowerCase() === "tanpa folder") {
        return unassignedRoutes;
      }
      return routes.filter(
        (r) => (r.folder_name || "").trim().toLowerCase() === selectedFolder.trim().toLowerCase()
      );
    }
    return routes;
  }, [routes, selectedFolder, unassignedRoutes]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground font-sans antialiased selection:bg-primary/20 selection:text-primary">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl border backdrop-blur-md flex items-center gap-2.5 animate-in fade-in slide-in-from-top-4 duration-200 text-xs font-medium ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
              : "bg-red-500/10 border-red-500/30 text-red-500"
          }`}
        >
          {toastMessage.type === "success" ? (
            <Check className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Split View: Panel Samping (Kiri) & Peta Leaflet (Kanan) */}
      <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden relative">
        <PanelSamping
          isOpen={isSidePanelOpen}
          onClose={() => setIsSidePanelOpen(false)}
          activeBasemapId={activeBasemapId}
          onBasemapChange={setActiveBasemapId}
          dbError={dbError}
        >
          {!selectedFolder ? (
            <DaftarFolder
              allFolderList={allFolderList}
              routes={routes}
              unassignedRoutes={unassignedRoutes}
              onOpenFolder={handleOpenFolder}
              onOpenNewFolderModal={() => setIsNewFolderModalOpen(true)}
              onOpenRenameFolderModal={(f) => {
                setRenameTargetFolder(f);
                setRenameNewNameInput(f);
              }}
              onOpenDeleteFolderModal={(f) => setDeleteTargetFolder(f)}
            />
          ) : selectedFolder !== "Tanpa Folder" && folderSubTab === "add-route" ? (
            <TambahRute
              selectedFolder={selectedFolder}
              allFolderList={allFolderList}
              filteredRoutesCount={filteredRoutes.length}
              onSetFolderSubTab={setFolderSubTab}
              routeName={routeName}
              onRouteNameChange={setRouteName}
              targetFolder={targetFolder}
              onTargetFolderChange={setTargetFolder}
              customColor={customColor}
              onCustomColorChange={setCustomColor}
              customWeight={customWeight}
              onCustomWeightChange={setCustomWeight}
              customOpacity={customOpacity}
              customLineStyle={customLineStyle}
              onCustomLineStyleChange={setCustomLineStyle}
              waypoints={waypoints}
              draftRouteData={draftRouteData}
              isCalculatingRoute={isCalculatingRoute}
              isSaving={isSaving}
              onSaveRoute={handleSaveRoute}
              onResetWaypoints={handleResetWaypoints}
              onRemoveWaypoint={handleRemoveWaypoint}
              onMoveWaypoint={handleMoveWaypoint}
              onReverseAllWaypoints={handleReverseAllWaypoints}
              onAddIntermediatePoint={() => {
                showToast("Klik titik baru pada peta di sebelah kanan", "success");
              }}
            />
          ) : (
            <DaftarRuteFolder
              selectedFolder={selectedFolder}
              filteredRoutes={filteredRoutes}
              focusedRouteId={focusedRouteId}
              folderSubTab={folderSubTab}
              onBackToAllFolders={handleBackToAllFolders}
              onSetFolderSubTab={setFolderSubTab}
              onFocusRoute={(id) => setFocusedRouteId(id)}
              onOpenEditRouteModal={(r) => {
                setEditingRoute({ ...r });
                setIsEditingRouteModalOpen(true);
              }}
              onOpenDeleteRouteModal={(id) => {
                setDeleteTargetRouteId(id);
                setIsDeleteRouteModalOpen(true);
              }}
              onOpenRenameFolderModal={(f) => {
                setRenameTargetFolder(f);
                setRenameNewNameInput(f);
              }}
              onOpenDeleteFolderModal={(f) => setDeleteTargetFolder(f)}
              onOpenNewRouteModal={handleOpenNewRouteModal}
            />
          )}
        </PanelSamping>

        <PetaRute
          isSidePanelOpen={isSidePanelOpen}
          onOpenSidePanel={() => setIsSidePanelOpen(true)}
          routes={routes}
          waypoints={waypoints}
          draftPathCoordinates={draftRouteData?.leafletPoints || []}
          customColor={customColor}
          customWeight={customWeight}
          customOpacity={customOpacity}
          customLineStyle={customLineStyle}
          isAddPointMode={selectedFolder !== null && selectedFolder !== "Tanpa Folder" && folderSubTab === "add-route"}
          onMapClickAddWaypoint={handleMapClick}
          onWaypointDragEnd={handleWaypointDragEnd}
          basemapId={activeBasemapId}
          focusedRouteId={focusedRouteId}
          onRouteClick={(r) => setFocusedRouteId(r.id)}
        />
      </div>

      {/* Pop-up Modals untuk Folder */}
      <ModalFolder
        isNewFolderOpen={isNewFolderModalOpen}
        newFolderName={newFolderNameInput}
        onNewFolderNameChange={setNewFolderNameInput}
        onCloseNewFolder={() => setIsNewFolderModalOpen(false)}
        onSubmitNewFolder={handleCreateFolder}
        renameTargetFolder={renameTargetFolder}
        renameNewName={renameNewNameInput}
        onRenameNewNameChange={setRenameNewNameInput}
        onCloseRenameFolder={() => {
          setRenameTargetFolder(null);
          setRenameNewNameInput("");
        }}
        onSubmitRenameFolder={handleRenameFolder}
        deleteTargetFolder={deleteTargetFolder}
        onCloseDeleteFolder={() => setDeleteTargetFolder(null)}
        onConfirmDeleteFolder={handleConfirmDeleteFolder}
      />

      {/* Pop-up Modals untuk Rute */}
      <ModalRute
        isNewRouteOpen={isNewRouteModalOpen}
        newRouteName={newRouteNameInput}
        targetFolderName={selectedFolder || targetFolder}
        onNewRouteNameChange={setNewRouteNameInput}
        onCloseNewRoute={() => setIsNewRouteModalOpen(false)}
        onSubmitNewRoute={handleSubmitNewRoute}
        isDeleteOpen={isDeleteRouteModalOpen}
        targetRoute={routes.find((r) => r.id === deleteTargetRouteId) || null}
        onCloseDelete={() => {
          setIsDeleteRouteModalOpen(false);
          setDeleteTargetRouteId(null);
        }}
        onConfirmDelete={handleConfirmDeleteRoute}
        isEditOpen={isEditingRouteModalOpen}
        editingRoute={editingRoute}
        allFolderList={allFolderList}
        onEditingRouteChange={setEditingRoute}
        onCloseEdit={() => {
          setIsEditingRouteModalOpen(false);
          setEditingRoute(null);
        }}
        onSubmitEdit={handleSaveRouteEdit}
      />
    </div>
  );
}
