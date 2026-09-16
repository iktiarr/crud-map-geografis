import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

// GET /api/spatial-crud/groups — Ambil semua daftar grup
export async function GET() {
  try {
    await initDatabase();
    const rows = await sql`
      SELECT DISTINCT group_name as name FROM spatial_crud_features WHERE group_name IS NOT NULL AND group_name != ''
      UNION
      SELECT name FROM spatial_groups
      ORDER BY name ASC;
    `;
    const groups = rows.map((r) => r.name).filter(Boolean);
    return NextResponse.json({ status: "success", data: groups });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}

// POST /api/spatial-crud/groups — Simpan nama grup baru ke database
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const groupName = (body.name || "").trim();
    if (!groupName) {
      return NextResponse.json(
        { status: "error", message: "Nama grup tidak boleh kosong" },
        { status: 400 }
      );
    }
    await sql`
      INSERT INTO spatial_groups (name) VALUES (${groupName})
      ON CONFLICT (name) DO NOTHING;
    `;
    return NextResponse.json({
      status: "success",
      message: `Grup "${groupName}" berhasil disimpan ke database`,
      data: groupName,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}

// PUT /api/spatial-crud/groups — Ubah nama grup (rename) di spatial_groups dan spatial_crud_features
export async function PUT(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const oldName = (body.oldName || "").trim();
    const newName = (body.newName || "").trim();
    if (!oldName || !newName) {
      return NextResponse.json(
        { status: "error", message: "Nama lama dan nama baru diperlukan" },
        { status: 400 }
      );
    }
    // Update di spatial_groups
    await sql`UPDATE spatial_groups SET name = ${newName} WHERE name = ${oldName};`;
    // Update di semua fitur yang memakai group_name ini
    await sql`UPDATE spatial_crud_features SET group_name = ${newName} WHERE group_name = ${oldName};`;
    return NextResponse.json({
      status: "success",
      message: `Grup "${oldName}" berhasil diubah menjadi "${newName}"`,
      data: { oldName, newName },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}

// DELETE /api/spatial-crud/groups — Hapus nama grup dari database
export async function DELETE(request: Request) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const groupName = searchParams.get("name")?.trim();
    if (!groupName) {
      return NextResponse.json(
        { status: "error", message: "Nama grup diperlukan" },
        { status: 400 }
      );
    }
    await sql`DELETE FROM spatial_groups WHERE name = ${groupName};`;
    await sql`DELETE FROM spatial_crud_features WHERE group_name = ${groupName};`;
    return NextResponse.json({
      status: "success",
      message: `Grup "${groupName}" berhasil dihapus dari database`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
    return NextResponse.json({ status: "error", message: msg }, { status: 500 });
  }
}
