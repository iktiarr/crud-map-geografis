import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    await initDatabase();

    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim().toLowerCase();

    const users = await sql`
      SELECT id, name, username, email, password, role, phone, address, created_at
      FROM users
      WHERE username = ${cleanIdentifier} OR email = ${cleanIdentifier}
      LIMIT 1;
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan. Periksa kembali username/email Anda." },
        { status: 401 }
      );
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role || "user",
      phone: user.phone,
      address: user.address,
      createdAt: user.created_at,
    };

    const response = NextResponse.json({
      success: true,
      message: "Berhasil masuk!",
      user: safeUser,
    });

    response.cookies.set("auth_session", JSON.stringify({
      id: safeUser.id,
      name: safeUser.name,
      username: safeUser.username,
      email: safeUser.email,
      role: safeUser.role,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: unknown) {
    console.error("Login Error:", error);
    const message = error instanceof Error ? error.message : "Terjadi kesalahan saat masuk.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
