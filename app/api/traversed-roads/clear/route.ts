import { NextResponse } from "next/server";
import { sql, initDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

// DELETE or POST /api/traversed-roads/clear — Hapus semua rute jalan
export async function POST() {
  try {
    await initDatabase();

    const result = await sql`
      DELETE FROM traversed_roads
      RETURNING id;
    `;

    try {
      await sql`
        DELETE FROM traversed_road_folders;
      `;
    } catch (fldErr) {
      console.warn("Notice deleting folders:", fldErr);
    }

    return NextResponse.json({
      status: "success",
      message: `Semua rute jalan (${result.length} data) dan folder berhasil dibersihkan`,
      deletedCount: result.length,
    });
  } catch (error) {
    console.error("POST /api/traversed-roads/clear error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Gagal membersihkan data jalan",
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return POST();
}
