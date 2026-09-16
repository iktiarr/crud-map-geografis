import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

// POST /api/spatial-crud/batch — Batch operations (regroup, delete)
export async function POST(request: Request) {
  try {
    await initDatabase();
    const body = await request.json();
    const { action, ids, targetGroup } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Parameter action dan daftar id wajib diisi" },
        { status: 400 }
      );
    }

    const numericIds = ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id));
    if (numericIds.length === 0) {
      return NextResponse.json(
        { status: "error", message: "Daftar ID tidak valid" },
        { status: 400 }
      );
    }

    // 1. REGROUP: Pindahkan / gabungkan item terpilih ke grup tujuan
    if (action === "regroup") {
      const groupName = targetGroup && typeof targetGroup === "string" && targetGroup.trim()
        ? targetGroup.trim()
        : "Utama";

      await sql`
        UPDATE spatial_crud_features
        SET 
          group_name = ${groupName},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY(${numericIds});
      `;

      return NextResponse.json({
        status: "success",
        message: `Berhasil memindahkan ${numericIds.length} objek ke dalam grup "${groupName}"`,
        count: numericIds.length,
        targetGroup: groupName,
      });
    }

    // 2. DELETE: Hapus massal objek terpilih
    if (action === "delete") {
      await sql`
        DELETE FROM spatial_crud_features
        WHERE id = ANY(${numericIds});
      `;

      return NextResponse.json({
        status: "success",
        message: `Berhasil menghapus ${numericIds.length} objek terpilih dari database`,
        count: numericIds.length,
      });
    }

    return NextResponse.json(
      { status: "error", message: `Aksi "${action}" tidak didukung` },
      { status: 400 }
    );
  } catch (error) {
    console.error("Batch operation error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses batch operation",
      },
      { status: 500 }
    );
  }
}
