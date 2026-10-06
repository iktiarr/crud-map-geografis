import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql, initDatabase } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await initDatabase();

    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username")?.trim().toLowerCase();
    const email = searchParams.get("email")?.trim().toLowerCase();

    // Dapatkan ID session user yang sedang login jika ada
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth_session");
    let currentUserId: number | null = null;

    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        if (session?.id) currentUserId = Number(session.id);
      } catch {
        // Abaikan parse error
      }
    }

    const result: {
      username?: { available: boolean; message: string; isSelf: boolean };
      email?: { available: boolean; message: string; isSelf: boolean };
    } = {};

    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/;

    if (username) {
      if (username.length < 3) {
        result.username = {
          available: false,
          message: "Username minimal 3 karakter",
          isSelf: false,
        };
      } else if (!USERNAME_REGEX.test(username)) {
        result.username = {
          available: false,
          message: "Hanya huruf, angka, titik, dan garis bawah",
          isSelf: false,
        };
      } else {
        const users = await sql`
          SELECT id, username FROM users
          WHERE username = ${username}
          LIMIT 1;
        `;

        if (users.length === 0) {
          result.username = {
            available: true,
            message: "Username tersedia",
            isSelf: false,
          };
        } else if (currentUserId && users[0].id === currentUserId) {
          result.username = {
            available: true,
            message: "Username akun Anda",
            isSelf: true,
          };
        } else {
          result.username = {
            available: false,
            message: "Username sudah digunakan",
            isSelf: false,
          };
        }
      }
    }

    if (email) {
      if (!EMAIL_REGEX.test(email)) {
        result.email = {
          available: false,
          message: "Format email tidak valid",
          isSelf: false,
        };
      } else {
        const users = await sql`
          SELECT id, email FROM users
          WHERE email = ${email}
          LIMIT 1;
        `;

        if (users.length === 0) {
          result.email = {
            available: true,
            message: "Email aman",
            isSelf: false,
          };
        } else if (currentUserId && users[0].id === currentUserId) {
          result.email = {
            available: true,
            message: "Email akun Anda",
            isSelf: true,
          };
        } else {
          result.email = {
            available: false,
            message: "Email sudah terdaftar",
            isSelf: false,
          };
        }
      }
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Gagal memeriksa ketersediaan akun.";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
