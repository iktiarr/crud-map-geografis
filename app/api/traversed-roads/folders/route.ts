import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/traversed-roads/folders — Ambil daftar semua folder rute jalan
export async function GET() {
  try {
    await initDatabase();

    // Ambil dari tabel folder dan distinct dari tabel traversed_roads
    const rows = await sql`
      SELECT id, name, description, color, created_at
      FROM traversed_road_folders
      ORDER BY name ASC;
    `;

    const distinctFromRoutes = await sql`
      SELECT DISTINCT folder_name as name
      FROM traversed_roads
      WHERE folder_name IS NOT NULL AND folder_name != '' AND folder_name != 'Utama' AND folder_name != 'Tanpa Folder'
      ORDER BY name ASC;
    `;

    const allFolderNames = new Set<string>();
    rows.forEach((r) => allFolderNames.add(r.name));
    distinctFromRoutes.forEach((r) => allFolderNames.add(r.name));

    return NextResponse.json({
      status: "success",
      folders: rows,
      folderNames: Array.from(allFolderNames),
    });
  } catch (error) {
    console.error("GET /api/traversed-roads/folders error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengambil daftar folder",
      },
      { status: 500 }
    );
  }
}

// POST /api/traversed-roads/folders — Buat folder baru
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { name, description = "", color = "#2563eb" } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { status: "error", message: "Nama folder wajib diisi" },
        { status: 400 }
      );
    }

    const trimmed = name.trim();

    const result = await sql`
      INSERT INTO traversed_road_folders (name, description, color)
      VALUES (${trimmed}, ${description.trim()}, ${color})
      ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, color = EXCLUDED.color
      RETURNING id, name, description, color, created_at;
    `;

    return NextResponse.json({
      status: "success",
      message: `Folder "${trimmed}" berhasil dibuat`,
      data: result[0],
    });
  } catch (error) {
    console.error("POST /api/traversed-roads/folders error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal membuat folder baru",
      },
      { status: 500 }
    );
  }
}

// PUT /api/traversed-roads/folders — Ubah nama folder
export async function PUT(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { oldName, newName } = body;

    if (!oldName || !newName || !newName.trim()) {
      return NextResponse.json(
        { status: "error", message: "Nama lama dan baru wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedNew = newName.trim();

    // Update di tabel folders
    await sql`
      UPDATE traversed_road_folders
      SET name = ${trimmedNew}
      WHERE name = ${oldName.trim()};
    `;

    // Update di rute yang berada di folder ini
    await sql`
      UPDATE traversed_roads
      SET folder_name = ${trimmedNew}
      WHERE folder_name = ${oldName.trim()};
    `;

    return NextResponse.json({
      status: "success",
      message: `Folder berhasil diubah menjadi "${trimmedNew}"`,
    });
  } catch (error) {
    console.error("PUT /api/traversed-roads/folders error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal mengubah nama folder",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/traversed-roads/folders — Hapus folder
export async function DELETE(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const folderName = searchParams.get("name");

    if (!folderName || !folderName.trim()) {
      return NextResponse.json(
        { status: "error", message: "Nama folder wajib disertakan" },
        { status: 400 }
      );
    }

    const trimmed = folderName.trim();

    await sql`
      DELETE FROM traversed_road_folders
      WHERE LOWER(name) = LOWER(${trimmed});
    `;

    // Ubah rute jalan di folder ini menjadi 'Tanpa Folder'
    await sql`
      UPDATE traversed_roads
      SET folder_name = 'Tanpa Folder'
      WHERE LOWER(folder_name) = LOWER(${trimmed});
    `;

    return NextResponse.json({
      status: "success",
      message: `Folder "${trimmed}" berhasil dihapus. Rute di dalamnya dialihkan ke Tanpa Folder.`,
    });
  } catch (error) {
    console.error("DELETE /api/traversed-roads/folders error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal menghapus folder",
      },
      { status: 500 }
    );
  }
}
