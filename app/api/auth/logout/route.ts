import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Berhasil keluar dari akun.",
  });

  response.cookies.delete("auth_session");

  return response;
}
